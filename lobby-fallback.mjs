// Lightweight, Ponder-independent lobby list.
//
// Discovers ChessGameFactory tables purely via TableCreated event logs (eth_getLogs), which are
// never subject to the "historical state ... is not available" pruning that can break Ponder's
// own backfill on a thin public RPC -- then reads every known table's current fields in one
// batched Multicall3 call at the LATEST block only, which is also never a historical read. See
// CONTRACT_ACTIONS.md for why this split (logs + current-state reads) sidesteps that failure mode
// entirely.
//
// Serves the exact `tables(...)` shape webapp-public's fetchTables() expects, AND the exact
// `moves(where: { tableId: ... })` shape useMoveHistory() expects -- move history needs no board
// replay at all, since MoveRow never carries board state (see lib/useMoveHistory.ts): from/to/
// promotion/mover/stakePaid/txHash come straight from each MoveMade log, `takenBack` and
// `potAfter` are reconstructed by replaying MoveMade+TakebackAccepted in block order (pure
// arithmetic bookkeeping, matching plyCount's own increment/decrement -- no chess legality logic
// needed). Everything else (backers, single-table-by-id) is still proxied straight through to
// the real Ponder endpoint untouched.
//
// Also serves a plain (non-GraphQL) POST /add-table { txHash } for registering a table this
// scan hasn't reached yet, given just its creation transaction hash -- see addTableFromTxHash().
//
// If ELO_REGISTRY_ADDRESS is set, also self-answers `ratings(...)` by reading
// ChessEloRegistry.effectiveRating(address) live for every known player -- Ponder's own indexed
// `rating` rows can be permanently missing for players whose RatingUpdated event fell in a block
// range Ponder skipped past (e.g. after a START_BLOCK bump to route around the historical-state
// pruning issue), even though the table itself was later recovered via /add-table. Since
// effectiveRating() already returns the default rating for anyone, this is a live-state read like
// the table fields above, not a ranged log query -- immune to the same pruning class of failure.
//
// Env vars (same names/file as the real indexer's .env.local, reused on purpose):
//   PONDER_RPC_URL_POLYGON   RPC endpoint
//   FACTORY_ADDRESS          ChessGameFactory address
//   ELO_REGISTRY_ADDRESS     ChessEloRegistry address (optional -- ratings(...) is proxied to
//                            Ponder as before if unset)
//   START_BLOCK              block to start scanning TableCreated from on first run
//   PONDER_GRAPHQL_URL       real Ponder endpoint to proxy non-lobby queries to (default :42069)
//   LOBBY_PORT               port this script listens on (default 42071)
//   LOBBY_RPC_FALLBACKS      comma-separated extra RPC URLs tried, in order, when a ranged
//                            eth_getLogs call fails on the primary one (see getLogsResilient)

import { createPublicClient, http, parseAbiItem, decodeEventLog } from "viem";
import { polygon } from "viem/chains";
import { createServer } from "node:http";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const RPC_URL = process.env.PONDER_RPC_URL_POLYGON ?? "https://polygon-bor-rpc.publicnode.com";
const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS;
const ELO_REGISTRY_ADDRESS = process.env.ELO_REGISTRY_ADDRESS;
const START_BLOCK = BigInt(process.env.START_BLOCK ?? "0");
const PONDER_URL = process.env.PONDER_GRAPHQL_URL ?? "http://127.0.0.1:42069/graphql";
const PORT = Number(process.env.LOBBY_PORT ?? 42071);
const CACHE_FILE = fileURLToPath(new URL("./lobby-cache.json", import.meta.url));
const LOG_CHUNK = 9999n; // polygon-bor-rpc.publicnode.com's per-call block-range cap
const REFRESH_TTL_MS = 5000; // don't re-hit the chain more than once per 5s per incoming request

if (!FACTORY_ADDRESS) {
  console.error("FACTORY_ADDRESS is not set (check .env.local)");
  process.exit(1);
}

const TABLE_CREATED = parseAbiItem(
  "event TableCreated(address indexed table, uint8 mode, address indexed creator, address frontendRecipient)",
);
const MOVE_MADE = parseAbiItem(
  "event MoveMade(address indexed mover, uint8 from, uint8 to, uint8 promotion, uint256 stakePaid)",
);
const TAKEBACK_ACCEPTED = parseAbiItem(
  "event TakebackAccepted(address indexed proposer, address indexed accepter, uint256 refunded)",
);

// One view function per TableRow field the frontend reads live (see webapp's lib/graphql.ts
// TABLE_FIELDS) -- creator/frontendRecipient/createdAt* come from the log itself instead, no
// read needed for those.
const TABLE_READS = [
  "mode",
  "baseStake",
  "rampPly",
  "moveTimeout",
  "curve",
  "protocolFeeBps",
  "protocolFeeRecipient",
  "referralFeeBps",
  "status",
  "result",
  "plyCount",
  "pot",
  "currentStake",
  "whiteToMove",
  "lastMoveTimestamp",
  "whitePlayer",
  "blackPlayer",
  "totalWhiteContribution",
  "totalBlackContribution",
  "token",
];

const TABLE_ABI = [
  parseAbiItem("function mode() view returns (uint8)"),
  parseAbiItem("function baseStake() view returns (uint256)"),
  parseAbiItem("function rampPly() view returns (uint32)"),
  parseAbiItem("function moveTimeout() view returns (uint32)"),
  parseAbiItem("function curve() view returns (uint8)"),
  parseAbiItem("function protocolFeeBps() view returns (uint16)"),
  parseAbiItem("function protocolFeeRecipient() view returns (address)"),
  parseAbiItem("function referralFeeBps() view returns (uint16)"),
  parseAbiItem("function status() view returns (uint8)"),
  parseAbiItem("function result() view returns (uint8)"),
  parseAbiItem("function plyCount() view returns (uint32)"),
  parseAbiItem("function pot() view returns (uint256)"),
  parseAbiItem("function currentStake() view returns (uint256)"),
  parseAbiItem("function whiteToMove() view returns (bool)"),
  parseAbiItem("function lastMoveTimestamp() view returns (uint64)"),
  parseAbiItem("function whitePlayer() view returns (address)"),
  parseAbiItem("function blackPlayer() view returns (address)"),
  parseAbiItem("function totalWhiteContribution() view returns (uint256)"),
  parseAbiItem("function totalBlackContribution() view returns (uint256)"),
  parseAbiItem("function token() view returns (address)"),
];

const EFFECTIVE_RATING_ABI = parseAbiItem("function effectiveRating(address player) view returns (uint16)");

// "History has been pruned for this block" comes from the specific backend node behind
// polygon-bor-rpc.publicnode.com's load balancer that happened to serve a given request -- it's
// been observed to be inconsistent for the exact same block/range across repeated calls, which
// points at different backend nodes with different pruning states rather than a hard cutoff. So
// instead of trusting one endpoint, a ranged eth_getLogs call is retried against a short list of
// independent public RPCs before giving up -- current-block reads (multicall) and per-tx lookups
// (getTransactionReceipt/getBlock) don't need this, only ranged log scans do.
//
// Tenderly's public gateway is the only other free, no-key endpoint found that actually serves a
// full 9999-block eth_getLogs call correctly (verified against a real, previously-pruned range).
// Several other "free public RPC" options were tried and rejected: drpc.org's public gateway
// refuses eth_getLogs outright regardless of range (misleading "over 10000 blocks" error even on
// tiny ranges), 1rpc.io caps eth_getLogs at ~50 blocks (too small to be useful at our chunk size),
// and ankr.com's public endpoint now requires an API key. Add more via LOBBY_RPC_FALLBACKS if you
// find others that hold up.
const FALLBACK_RPC_URLS = (process.env.LOBBY_RPC_FALLBACKS ?? "https://gateway.tenderly.co/public/polygon")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const RPC_URLS = [RPC_URL, ...FALLBACK_RPC_URLS.filter((u) => u !== RPC_URL)];
const clients = RPC_URLS.map((url) => createPublicClient({ chain: polygon, transport: http(url) }));
const client = clients[0]; // primary, used for every non-ranged-log call (getBlock, receipts, multicall)

async function getLogsResilient(params) {
  let lastErr;
  for (let i = 0; i < clients.length; i++) {
    try {
      return await clients[i].getLogs(params);
    } catch (err) {
      lastErr = err;
      console.warn(`[lobby-fallback] getLogs failed on ${RPC_URLS[i]}: ${err.shortMessage ?? err.message ?? err}`);
    }
  }
  throw lastErr;
}

const TX_HASH_RE = /^0x[0-9a-fA-F]{64}$/;

// { tables: { "0xaddr": { creator, frontendRecipient, createdAtBlock, createdAtTimestamp } },
//   lastScannedBlock: "123",
//   moves: { "0xtableaddr": { lastScannedBlock: "123", items: [ {plyIndex, mover, fromSquare,
//                                                                 toSquare, promotion, stakePaid,
//                                                                 takenBack, potAfter, txHash} ] } } }
let state = existsSync(CACHE_FILE)
  ? JSON.parse(readFileSync(CACHE_FILE, "utf8"))
  : { tables: {}, lastScannedBlock: (START_BLOCK - 1n).toString(), moves: {} };
if (!state.moves) state.moves = {}; // upgrade an older cache file that predates move support

function saveState() {
  writeFileSync(CACHE_FILE, JSON.stringify(state));
}

async function scanNewTables() {
  const latest = await client.getBlockNumber();
  let from = BigInt(state.lastScannedBlock) + 1n;
  console.log(`[lobby-fallback] scan: factory=${FACTORY_ADDRESS} from=${from} to=${latest} (lastScannedBlock=${state.lastScannedBlock})`);
  if (from > latest) {
    console.log(`[lobby-fallback] scan: nothing to do, already caught up`);
    return;
  }
  while (from <= latest) {
    const to = from + LOG_CHUNK > latest ? latest : from + LOG_CHUNK;
    const logs = await getLogsResilient({
      address: FACTORY_ADDRESS,
      event: TABLE_CREATED,
      fromBlock: from,
      toBlock: to,
    });
    console.log(`[lobby-fallback] scan chunk ${from}-${to}: ${logs.length} TableCreated event(s)`);
    for (const log of logs) {
      const addr = log.args.table.toLowerCase();
      const block = await client.getBlock({ blockNumber: log.blockNumber });
      state.tables[addr] = {
        creator: log.args.creator,
        frontendRecipient: log.args.frontendRecipient,
        createdAtBlock: log.blockNumber.toString(),
        createdAtTimestamp: block.timestamp.toString(),
      };
      console.log(`[lobby-fallback] new table discovered: ${addr} at block ${log.blockNumber}`);
    }
    from = to + 1n;
  }
  state.lastScannedBlock = latest.toString();
  saveState();
}

async function refreshLiveState() {
  const addrs = Object.keys(state.tables);
  if (addrs.length === 0) return [];

  const calls = addrs.flatMap((addr) =>
    TABLE_ABI.map((abiItem) => ({ address: addr, abi: [abiItem], functionName: abiItem.name })),
  );
  const results = await client.multicall({ contracts: calls, allowFailure: true });

  const perTable = TABLE_ABI.length;
  return addrs.map((addr, i) => {
    const slice = results.slice(i * perTable, (i + 1) * perTable);
    const get = (name) => slice[TABLE_READS.indexOf(name)]?.result;
    const meta = state.tables[addr];
    const stringify = (v) => (v === undefined || v === null ? null : v.toString());
    return {
      id: addr,
      mode: get("mode") ?? null,
      creator: meta.creator,
      frontendRecipient: meta.frontendRecipient,
      createdAtBlock: meta.createdAtBlock,
      createdAtTimestamp: meta.createdAtTimestamp,
      baseStake: stringify(get("baseStake")),
      rampPly: get("rampPly") ?? null,
      moveTimeout: stringify(get("moveTimeout")),
      curve: get("curve") ?? null,
      protocolFeeBps: get("protocolFeeBps") ?? null,
      protocolFeeRecipient: get("protocolFeeRecipient") ?? null,
      referralFeeBps: get("referralFeeBps") ?? null,
      status: get("status") ?? null,
      result: get("result") ?? null,
      plyCount: get("plyCount") ?? null,
      pot: stringify(get("pot")),
      currentStake: stringify(get("currentStake")),
      whiteToMove: get("whiteToMove") ?? null,
      lastMoveTimestamp: stringify(get("lastMoveTimestamp")),
      whitePlayer: get("whitePlayer") ?? null,
      blackPlayer: get("blackPlayer") ?? null,
      totalWhiteContribution: stringify(get("totalWhiteContribution")),
      totalBlackContribution: stringify(get("totalBlackContribution")),
      token: get("token") ?? null,
    };
  });
}

// Rebuilds one table's move list from MoveMade + TakebackAccepted logs, in block/log order.
// No board replay: plyIndex/potAfter/takenBack are pure bookkeeping over the two event streams,
// mirroring exactly what the contract itself does to plyCount/pot on takeback (roll back one
// ply, refund that move's stake) -- see GAME_MECHANICS.md section 5.
//
// Two overlapping calls for the SAME table (e.g. the frontend's 4s poll firing again before a
// slow scan -- widened by getLogsResilient's retries -- has finished) used to both read the same
// moveState.lastScannedBlock, both re-scan the same range, and both push the same moves onto
// moveState.items, producing visible duplicates. moveScanInFlight collapses concurrent calls for
// the same table into one in-progress scan, the same pattern getTables() already used for the
// tables-wide scan.
const moveScanInFlight = new Map();

async function scanTableMoves(tableAddress) {
  const addr = tableAddress.toLowerCase();
  if (moveScanInFlight.has(addr)) return moveScanInFlight.get(addr);
  const promise = scanTableMovesUnlocked(addr);
  moveScanInFlight.set(addr, promise);
  try {
    return await promise;
  } finally {
    moveScanInFlight.delete(addr);
  }
}

async function scanTableMovesUnlocked(addr) {
  if (!state.moves[addr]) {
    state.moves[addr] = { lastScannedBlock: (START_BLOCK - 1n).toString(), items: [] };
  }
  const moveState = state.moves[addr];
  const latest = await client.getBlockNumber();
  let from = BigInt(moveState.lastScannedBlock) + 1n;
  if (from > latest) return moveState.items;

  // Merge both event types into one chronologically-ordered stream per chunk.
  while (from <= latest) {
    const to = from + LOG_CHUNK > latest ? latest : from + LOG_CHUNK;
    const [moveLogs, takebackLogs] = await Promise.all([
      getLogsResilient({ address: addr, event: MOVE_MADE, fromBlock: from, toBlock: to }),
      getLogsResilient({ address: addr, event: TAKEBACK_ACCEPTED, fromBlock: from, toBlock: to }),
    ]);
    const events = [
      ...moveLogs.map((l) => ({ type: "move", log: l })),
      ...takebackLogs.map((l) => ({ type: "takeback", log: l })),
    ].sort((a, b) => {
      const blockDiff = a.log.blockNumber - b.log.blockNumber;
      if (blockDiff !== 0n) return blockDiff < 0n ? -1 : 1;
      return a.log.logIndex - b.log.logIndex;
    });

    let plyCounter = moveState.items.reduce(
      (max, m) => (m.takenBack ? max : Math.max(max, m.plyIndex)),
      0,
    );
    let pot = moveState.items
      .filter((m) => !m.takenBack)
      .reduce((sum, m) => sum + BigInt(m.stakePaid), 0n);

    for (const { type, log } of events) {
      if (type === "move") {
        plyCounter += 1;
        pot += log.args.stakePaid;
        moveState.items.push({
          plyIndex: plyCounter,
          mover: log.args.mover,
          fromSquare: log.args.from,
          toSquare: log.args.to,
          promotion: log.args.promotion,
          stakePaid: log.args.stakePaid.toString(),
          takenBack: false,
          potAfter: pot.toString(),
          txHash: log.transactionHash,
          _block: log.blockNumber.toString(),
          _logIndex: log.logIndex,
        });
      } else {
        // Takeback always undoes the most recent not-yet-undone move.
        for (let i = moveState.items.length - 1; i >= 0; i--) {
          if (!moveState.items[i].takenBack) {
            moveState.items[i].takenBack = true;
            pot -= BigInt(moveState.items[i].stakePaid);
            plyCounter -= 1;
            break;
          }
        }
      }
    }
    console.log(
      `[lobby-fallback] moves ${addr} chunk ${from}-${to}: ${moveLogs.length} move(s), ${takebackLogs.length} takeback(s)`,
    );
    from = to + 1n;
  }
  moveState.lastScannedBlock = latest.toString();
  saveState();
  return moveState.items;
}

// Backers = distinct addresses that have ever moved for a side of a Crowd table -- derivable
// entirely from the same MoveMade data already scanned for move history, zero extra RPC calls.
// Color is the ply-parity convention the frontend itself already uses (odd ply = White, see
// lib/settlement.ts's computeContributions). Matches the real schema's known, accepted quirk:
// a backer row is never removed even if their sole contribution was later taken back.
async function getBackers(tableAddress) {
  const addr = tableAddress.toLowerCase();
  await scanTableMoves(addr); // ensure state.moves[addr] is populated/up to date
  const items = state.moves[addr]?.items ?? [];
  const seen = new Map(); // address -> isWhite
  for (const m of items) {
    if (!seen.has(m.mover)) seen.set(m.mover, m.plyIndex % 2 === 1);
  }
  return [...seen.entries()].map(([address, isWhite]) => ({
    id: `${addr}-${address.toLowerCase()}`,
    tableId: addr,
    address,
    isWhite,
  }));
}

// Registers a table by its creation tx hash alone -- no need to already know its address, and no
// eth_getLogs range query needed either: the TableCreated log is decoded straight out of the
// transaction's own receipt (receipt.logs), which -- unlike a ranged eth_getLogs query -- is never
// subject to the "History has been pruned for this block" failure (receipts are cheap, permanent
// per-tx records every node keeps; only the maintained log-range index gets pruned on some
// backends). Confirmed by hitting that exact pruning error on this same block via a live
// eth_getLogs call during testing, while the receipt for the identical tx resolved instantly.
// Exposed over HTTP as POST /add-table so the frontend can offer a "paste the creation tx" recovery
// box for a table the scan hasn't (yet, or ever will) pick up on its own.
async function addTableFromTxHash(txHash) {
  if (typeof txHash !== "string" || !TX_HASH_RE.test(txHash)) {
    throw new Error("not a valid transaction hash");
  }
  const receipt = await client.getTransactionReceipt({ hash: txHash });
  let decoded = null;
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== FACTORY_ADDRESS.toLowerCase()) continue;
    try {
      const event = decodeEventLog({ abi: [TABLE_CREATED], data: log.data, topics: log.topics });
      decoded = event;
      break;
    } catch {
      // a different factory event (e.g. TokenAllowlistUpdated) -- keep looking
    }
  }
  if (!decoded) {
    throw new Error("this transaction did not create a table on this factory");
  }
  const addr = decoded.args.table.toLowerCase();
  if (!state.tables[addr]) {
    const block = await client.getBlock({ blockNumber: receipt.blockNumber });
    state.tables[addr] = {
      creator: decoded.args.creator,
      frontendRecipient: decoded.args.frontendRecipient,
      createdAtBlock: receipt.blockNumber.toString(),
      createdAtTimestamp: block.timestamp.toString(),
    };
  }
  if (!state.moves[addr]) {
    state.moves[addr] = { lastScannedBlock: (receipt.blockNumber - 1n).toString(), items: [] };
  }
  saveState();
  cachedRows = null; // force the next tables() call to pick this table up immediately
  return addr;
}

let cachedRows = null;
let cachedAt = 0;
let inFlight = null;

async function getTables() {
  if (cachedRows && Date.now() - cachedAt < REFRESH_TTL_MS) return cachedRows;
  if (inFlight) return inFlight; // collapse concurrent requests into one chain round-trip
  inFlight = (async () => {
    await scanNewTables();
    cachedRows = await refreshLiveState();
    cachedAt = Date.now();
    return cachedRows;
  })();
  try {
    return await inFlight;
  } finally {
    inFlight = null;
  }
}

// Live effectiveRating() for every player that has ever appeared as whitePlayer/blackPlayer on a
// known table -- not tied to Ponder ever having processed that player's RatingUpdated event, so a
// table recovered via /add-table (or any table whose ELO update fell in a block range Ponder's own
// scan skipped past) still shows a correct, current rating in the lobby immediately.
let ratingsCache = null;
let ratingsCachedAt = 0;

async function getRatings() {
  if (ratingsCache && Date.now() - ratingsCachedAt < REFRESH_TTL_MS) return ratingsCache;

  const tables = await getTables();
  const players = new Set();
  for (const t of tables) {
    for (const p of [t.whitePlayer, t.blackPlayer]) {
      if (p && p !== "0x0000000000000000000000000000000000000000") players.add(p.toLowerCase());
    }
  }
  if (players.size === 0) return [];

  const addrs = [...players];
  const results = await client.multicall({
    contracts: addrs.map((addr) => ({
      address: ELO_REGISTRY_ADDRESS,
      abi: [EFFECTIVE_RATING_ABI],
      functionName: "effectiveRating",
      args: [addr],
    })),
    allowFailure: true,
  });

  ratingsCache = addrs.map((id, i) => ({ id, value: results[i]?.result ?? null })).filter((r) => r.value !== null);
  ratingsCachedAt = Date.now();
  return ratingsCache;
}

async function proxyToPonder(body) {
  const res = await fetch(PONDER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  return res.text();
}

const server = createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", async () => {
    try {
      if (req.method === "POST" && req.url === "/add-table") {
        const { txHash } = JSON.parse(body || "{}");
        try {
          const addr = await addTableFromTxHash(txHash);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: true, table: addr }));
        } catch (err) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: false, error: String(err.message ?? err) }));
        }
        return;
      }
      const { query, variables } = JSON.parse(body || "{}");
      // "tables(...)" is the lobby list; "moves(...)" is one table's move history (variables.table
      // carries the address, matching useMoveHistory()'s own query shape). Anything else --
      // single-table-by-id, backers -- still needs Ponder's indexed history and is proxied as-is.
      if (typeof query === "string" && /\btables\s*\(/.test(query)) {
        const items = await getTables();
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ data: { tables: { items } } }));
        return;
      }
      if (typeof query === "string" && /\bmoves\s*\(/.test(query) && variables?.table) {
        const rawItems = await scanTableMoves(variables.table);
        // Strip internal-only sort keys before handing back the exact MoveRow shape.
        const items = rawItems.map(({ _block, _logIndex, ...rest }) => rest);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ data: { moves: { items } } }));
        return;
      }
      if (typeof query === "string" && /\bbackers\s*\(/.test(query) && variables?.table) {
        const items = await getBackers(variables.table);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ data: { backers: { items } } }));
        return;
      }
      if (ELO_REGISTRY_ADDRESS && typeof query === "string" && /\bratings\s*\(/.test(query)) {
        const items = await getRatings();
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ data: { ratings: { items } } }));
        return;
      }
      const upstream = await proxyToPonder(body);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(upstream);
    } catch (err) {
      console.error(`[lobby-fallback] request error:`, err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ errors: [{ message: String(err) }] }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`[lobby-fallback] listening on :${PORT}, proxying non-lobby queries to ${PONDER_URL}`);
});
