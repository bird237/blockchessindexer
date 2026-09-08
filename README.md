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

Ranged `eth_getLogs` calls (used to scan for new tables and for move history) are still exposed to a
*different*, also-inconsistent limitation: "History has been pruned for this block" from whichever
backend node happens to be serving the request behind the public RPC's load balancer -- the same
range can fail one moment and succeed the next. To work around it, every such call is retried
against `LOBBY_RPC_FALLBACKS` (a comma-separated list of alternate RPC URLs, default
`https://gateway.tenderly.co/public/polygon` -- the only other free, no-API-key endpoint found that
actually serves full-size ranges correctly; several others were tried and rejected, see the code
comment above `FALLBACK_RPC_URLS`) before giving up. Current-block reads (`multicall`) and per-tx
lookups (`getTransactionReceipt`/`getBlock`) don't need this and aren't retried this way -- they've
never been observed to fail this way.

Environment variables: `PONDER_RPC_URL_POLYGON`, `FACTORY_ADDRESS`, `START_BLOCK` (same meaning as
above), `LOBBY_RPC_FALLBACKS` (see above), plus `PONDER_GRAPHQL_URL` (real Ponder instance to proxy
to, default `http://127.0.0.1:42069/graphql`) and `LOBBY_PORT` (default `42071`). Persists scan
checkpoints to `lobby-cache.json` next to the script — delete this file if you change `START_BLOCK`
and want the new value to actually take effect, since a cached checkpoint takes priority on startup.

Point your reverse proxy/frontend at this service's port instead of Ponder's directly; it forwards
anything it doesn't specially handle, so it's a drop-in replacement.

### POST /add-table — register a table by its creation tx hash

For a table `lobby-fallback.mjs` missed on its own (its creation block predates the log-scan window
you're running with, or you just don't want to wait for the next scan): register it directly by tx
hash instead of restarting the scan from an earlier `START_BLOCK`, which would re-expose you to the
same historical-read fragility this whole approach exists to avoid.

```bash
curl -X POST http://localhost:42071/add-table -H 'Content-Type: application/json' \
  -d '{"txHash":"0x..."}'
# -> { "ok": true, "table": "0x..." }
```

Decodes the `TableCreated` log straight out of the transaction's own receipt rather than a fresh
`eth_getLogs` call — receipts are permanent per-tx records every node keeps, so this step alone is
immune to log-range pruning (confirmed: an equivalent single-block `eth_getLogs` query for the same
tx failed with "History has been pruned for this block" while the receipt resolved instantly). The
table appears in the next `tables(...)` response immediately.

Move history for that table is a separate concern: it's still recovered via the normal ranged
`eth_getLogs` scan (from the table's creation block onward), which is subject to the same pruning
inconsistency as everything else in this file — mitigated, not eliminated, by the `LOBBY_RPC_FALLBACKS`
retry described above. In testing, the primary RPC failed outright on this exact scan for a table
created ~2 days earlier, but the fallback (Tenderly's public gateway) recovered the full move history
correctly on the very next attempt. If every fallback in the list also fails, that's a genuine gap
short of running your own archival node -- add more URLs to `LOBBY_RPC_FALLBACKS` if you find ones
that hold up.

This is also exposed to end users directly, e.g. an "add a missing table by tx hash" box in the
frontend's lobby — see `webapp/app/page.tsx`.

### manual-add-table.mjs — same thing, from the command line

```bash
node manual-add-table.mjs <tableAddress> [creationTxHash]
```

Same receipt-decoding approach as `POST /add-table`, plus an `isTable(address)` sanity check against
the factory. Useful when you'd rather not (or can't yet) hit the running service over HTTP. Stop
`lobby-fallback.mjs` before running (it only reads `lobby-cache.json` once at startup), then start it
again afterward.

### Live `ratings(...)` (needs `ELO_REGISTRY_ADDRESS`)

If `ELO_REGISTRY_ADDRESS` is set, the lobby's `ratings(...)` query is also self-answered: it reads
`ChessEloRegistry.effectiveRating(address)` live (current block, not a ranged log query) for every
address that has ever appeared as `whitePlayer`/`blackPlayer` on a known table. This exists because
Ponder's own indexed `rating` rows can be permanently missing for a player whose `RatingUpdated`
event fell in a block range Ponder's scan skipped past (typically after a `START_BLOCK` bump used to
route around the historical-state pruning problem) — the table itself might get recovered via
`/add-table`, but its players' ratings would otherwise stay stuck at whatever Ponder last saw (or
absent entirely), even though the table's own page reads the correct current rating directly from
the contract. Leave `ELO_REGISTRY_ADDRESS` unset to keep proxying `ratings(...)` to Ponder as before.

## ops/ — indexer watchdog

`ops/blockchess-indexer-watchdog.sh` + matching `.service`/`.timer` systemd units: a self-recovery
watchdog for the main Ponder indexer (not for `lobby-fallback.mjs`, which doesn't need one). A
systemd timer runs the script every minute; it greps recent indexer logs for the
`historical state ... is not available` stuck-loop signature, and if found, bumps `START_BLOCK` to
near the current chain head, wipes the local `.ponder` database, and restarts the service. Has a
5-minute cooldown to avoid flapping. Requires only `curl` (no Foundry/`cast` dependency) to read the
current block number. See the script's header comment for the exact paths/variables it expects on
the host, and adjust them to match your deployment before installing.
