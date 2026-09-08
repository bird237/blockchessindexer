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

## Local development

```bash
npm install
cp .env.local.example .env.local   # fill in the values below for your deployment
npm run dev                  # GraphQL at http://localhost:42069/graphql
```

Requires Node.js **>=22** (see `package.json`'s `engines` field). Uses an embedded PGlite Postgres
by default — no external database needed for local development.

### Environment variables

| Variable | Meaning |
|---|---|
| `PONDER_RPC_URL_AMOY` | RPC URL for the chain being indexed (name is historical — read as a plain RPC URL by `ponder.config.ts` regardless of which network it actually points at; rename the config key there if you want it to read cleanly for your deployment) |
| `FACTORY_ADDRESS` | `ChessGameFactory` address for this deployment |
| `ELO_REGISTRY_ADDRESS` | `ChessEloRegistry` address for this deployment |
| `START_BLOCK` | Block number the factory was deployed at — lets the indexer skip scanning the chain's history before the contracts existed |

## Deploying

**This cannot run on Vercel.** Vercel runs serverless functions that spin up per request and don't
keep state between calls; Ponder is the opposite — a long-lived process that continuously syncs
from the chain and keeps its own database. It needs a host that runs persistent processes:
Railway, Fly.io, Render, or a plain VPS all work. Set the environment variables above and run
`npm install && npm run start`.

Run a separate instance per network (testnet vs. mainnet) with each network's own
`FACTORY_ADDRESS`/`ELO_REGISTRY_ADDRESS`/`START_BLOCK` — don't let games from different networks
mix in the same GraphQL data.

## lobby-fallback.mjs

A standalone, Ponder-independent Node.js service (`node lobby-fallback.mjs`) that answers the
frontend's `tables(...)`, `moves(where:{tableId})`, and `backers(where:{tableId})` GraphQL queries
directly from chain event logs (`TableCreated`, `MoveMade`, `TakebackAccepted`) plus current-block
`multicall` reads — everything else is transparently proxied to the real Ponder instance.

It exists because Ponder's own sync can get stuck: the public RPC's historical-state retention
window is short and non-deterministic, and after a crash/restart it can permanently miss tables or
moves that happened during the gap. This fallback never needs a historical `eth_call` (only current
state + full log history), so it isn't exposed to that failure mode.

Environment variables: `PONDER_RPC_URL_POLYGON`, `FACTORY_ADDRESS`, `START_BLOCK` (same meaning as
above), plus `PONDER_GRAPHQL_URL` (real Ponder instance to proxy to, default
`http://127.0.0.1:42069/graphql`) and `LOBBY_PORT` (default `42071`). Persists scan checkpoints to
`lobby-cache.json` next to the script — delete this file if you change `START_BLOCK` and want the
new value to actually take effect, since a cached checkpoint takes priority on startup.

Point your reverse proxy/frontend at this service's port instead of Ponder's directly; it forwards
anything it doesn't specially handle, so it's a drop-in replacement.

## ops/ — indexer watchdog

`ops/blockchess-indexer-watchdog.sh` + matching `.service`/`.timer` systemd units: a self-recovery
watchdog for the main Ponder indexer (not for `lobby-fallback.mjs`, which doesn't need one). A
systemd timer runs the script every minute; it greps recent indexer logs for the
`historical state ... is not available` stuck-loop signature, and if found, bumps `START_BLOCK` to
near the current chain head, wipes the local `.ponder` database, and restarts the service. Has a
5-minute cooldown to avoid flapping. Requires only `curl` (no Foundry/`cast` dependency) to read the
current block number. See the script's header comment for the exact paths/variables it expects on
the host, and adjust them to match your deployment before installing.
