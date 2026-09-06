# Blockchess Indexer

This repository provides a [Ponder](https://ponder.sh) indexer for the Blockchess on-chain smart contracts. It indexes EVM contract events into a PostgreSQL database and auto-serves a GraphQL API for querying game directory listings, move histories, and player analytics.

## Architecture and Design

### Event Sources and Dynamic Factory Tracking

The indexer continuously monitors three categories of on-chain event sources:

1. **`ChessGameFactory` (Fixed Address)**: Listens for `TableCreated` events when new `ChessGameTable` clones (Duel or Crowd modes) are deployed, and `TokenAllowlistUpdated` events when the factory owner updates the list of permitted ERC20 stake tokens.
2. **`ChessGameTable` Clones (Dynamic Discovery)**: Uses Ponder's factory event resolver (`factory({address: factoryAddress, event: TableCreated, parameter: "table"})`) to discover dynamically created table clone addresses. Each clone is monitored for `MoveMade`, `GameFinished`, and `TakebackAccepted` events without requiring hardcoded game addresses.
3. **`ChessEloRegistry` (Fixed Address)**: Listens for `RatingUpdated` events emitted whenever a finalized Duel table outcome is permissionlessly recorded into the global ELO system.

### Read-Through Design Principle

The indexer never re-derives chess rules, board positions, or game logic off-chain. Upon receiving any event, it re-reads the canonical state directly from the smart contract via `readContract` at that specific block number. This includes reading the packed board bitboard, castling rights, en passant target square, active player turn, required stake, and current pot.

The EVM smart contracts remain the sole source of truth. The indexer acts strictly as a read-through, structured historical data and query layer over on-chain state.

### Data Model

The indexer manages six PostgreSQL tables:

* **`table`**: Represents each deployed `ChessGameTable` clone. Stores immutable deployment parameters (base stake, ramp ply, move timeout, pricing curve, protocol fee percentage and recipient, referral fee percentage, and ERC20 stake token) alongside live table state kept synchronized with the contract (status, final result, ply count, current pot, current required stake, active player turn, seated addresses, and total Crowd contribution amounts).
* **`move`**: Stores each successful `MoveMade` event together with the canonical post-move contract state. Rows are keyed by block number and log index rather than ply number because takebacks decrement the on-chain ply counter, allowing future moves to land on previously used ply indices. A `takenBack` flag marks moves superseded by a `TakebackAccepted` event so that complete move history remains visible.
* **`gameFinishedEvent`**: Records terminal table outcomes (such as checkmate, stalemate, draw, timeout, or resignation) alongside the caller address that finalized the game.
* **`backer`**: Tracks distinct backer addresses contributing to each side of a Crowd table. Because the contract only maintains aggregate contribution totals per side, this table allows reconstructing individual backer headcounts.
* **`allowedToken`**: Records historical updates to the curated ERC20 allowlist made by the factory owner. Native currency (address zero) is implicitly allowed on-chain and is omitted from this table.
* **`rating`**: Records current player ELO ratings from Duel games. A missing row indicates that a player holds the default starting rating rather than a rating of zero.

### GraphQL API and Frontend Integration

The indexer exposes an auto-generated GraphQL API (by default at `http://localhost:42069/graphql`). The frontend uses this endpoint to query data that is expensive or inconvenient to fetch directly from EVM RPC nodes:

* Cross-table lobby directory and game filtering
* Complete move history sequences for game playback and analysis
* Backer counts and backer lists for Crowd tables
* ELO leaderboard rankings

To protect transactional integrity, the frontend deliberately bypasses the indexer for state that conditions on-chain transactions (such as current pot size, required stake, or active turn). Those values are read live directly from the blockchain via RPC, ensuring that monetary transactions never depend on indexer freshness or availability.

### Execution and Storage Model

The indexer utilizes embedded PGlite (an in-process Postgres-compatible engine) by default, but can also connect to an external PostgreSQL database.

Because the indexer maintains continuous websocket or polling subscriptions to EVM nodes and manages persistent database state, it must run as a single long-lived process per network rather than on a serverless architecture. Each network deployment requires its own instance, with target chain details and contract addresses supplied via environment configuration.
