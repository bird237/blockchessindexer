// One-off CLI to manually register a known ChessGameTable address into lobby-fallback.mjs's
// cache, bypassing the TableCreated log scan entirely -- useful for a table whose creation block
// is older than whatever window the public RPC's eth_getLogs will still serve, or just to make a
// table show up immediately without waiting for the next lazy scan. lobby-fallback.mjs only needs
// an address to know about a table; every *current* field is re-read live via `multicall` on each
// request, so this never touches historical eth_call either -- same reasoning as lobby-fallback.mjs
// itself, see its header comment and CONTRACT_ACTIONS.md.
//
// Usage:
//   node manual-add-table.mjs <tableAddress> [creationTxHash]
//
// With the table's creation tx hash: resolves the exact block/timestamp and the TableCreated log
// itself for creator/frontendRecipient, and seeds move-history scanning to start right before that
// table's first block -- so full move history for that table can still be recovered.
//
// Without a tx hash: adds the table with creator/frontendRecipient left null, and move-history
// scanning seeded from the current block onward -- past moves for that table will NOT be
// recoverable this way. Pass the tx hash if you have it (e.g. from when you created the table).
//
// Stop lobby-fallback.mjs before running this, then start it again after -- it only reads
// lobby-cache.json once at startup, and a concurrent write from a live request could clobber this
// script's edit (or vice versa).

import { createPublicClient, http, parseAbiItem, getAddress, decodeEventLog } from "viem";
import { polygon } from "viem/chains";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const RPC_URL = process.env.PONDER_RPC_URL_POLYGON ?? "https://polygon-bor-rpc.publicnode.com";
const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS;
const CACHE_FILE = fileURLToPath(new URL("./lobby-cache.json", import.meta.url));

const [, , tableArg, txHashArg] = process.argv;
if (!tableArg) {
  console.error("Usage: node manual-add-table.mjs <tableAddress> [creationTxHash]");
  process.exit(1);
}
if (!FACTORY_ADDRESS) {
  console.error("FACTORY_ADDRESS is not set (check .env.local)");
  process.exit(1);
}

const tableAddress = getAddress(tableArg); // throws on a malformed address
const addr = tableAddress.toLowerCase();

const TABLE_CREATED = parseAbiItem(
  "event TableCreated(address indexed table, uint8 mode, address indexed creator, address frontendRecipient)",
);
const IS_TABLE = parseAbiItem("function isTable(address) view returns (bool)");

const client = createPublicClient({ chain: polygon, transport: http(RPC_URL) });

const isRealTable = await client.readContract({
  address: FACTORY_ADDRESS,
  abi: [IS_TABLE],
  functionName: "isTable",
  args: [tableAddress],
});
if (!isRealTable) {
  console.error(`${tableAddress} is not a table this factory (${FACTORY_ADDRESS}) ever deployed -- aborting`);
  process.exit(1);
}

let meta = { creator: null, frontendRecipient: null, createdAtBlock: null, createdAtTimestamp: null };
let moveScanFrom;

if (txHashArg) {
  // Decode straight from the receipt's own logs rather than a fresh eth_getLogs range query --
  // receipts are permanent per-tx records every node keeps, unlike the maintained log-range index,
  // which can (and, in testing, did) reject an identical single-block query as pruned.
  const receipt = await client.getTransactionReceipt({ hash: txHashArg });
  let decoded = null;
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== FACTORY_ADDRESS.toLowerCase()) continue;
    try {
      decoded = decodeEventLog({ abi: [TABLE_CREATED], data: log.data, topics: log.topics });
      break;
    } catch {
      // a different factory event in the same tx -- keep looking
    }
  }
  if (!decoded || decoded.args.table.toLowerCase() !== addr) {
    console.error(`No TableCreated(${tableAddress}) log found in tx ${txHashArg} -- check the hash`);
    process.exit(1);
  }
  const block = await client.getBlock({ blockNumber: receipt.blockNumber });
  meta = {
    creator: decoded.args.creator,
    frontendRecipient: decoded.args.frontendRecipient,
    createdAtBlock: receipt.blockNumber.toString(),
    createdAtTimestamp: block.timestamp.toString(),
  };
  moveScanFrom = (receipt.blockNumber - 1n).toString();
  console.log(`Resolved from tx: created at block ${receipt.blockNumber} by ${decoded.args.creator}`);
} else {
  console.warn(
    "No creation tx hash given -- creator/frontendRecipient will be null and past moves for this " +
      "table won't be recoverable (move scan will start from the current block forward).",
  );
  const latest = await client.getBlockNumber();
  moveScanFrom = (latest - 1n).toString();
}

const state = existsSync(CACHE_FILE)
  ? JSON.parse(readFileSync(CACHE_FILE, "utf8"))
  : { tables: {}, lastScannedBlock: "0", moves: {} };
if (!state.moves) state.moves = {};

state.tables[addr] = meta;
if (!state.moves[addr]) {
  state.moves[addr] = { lastScannedBlock: moveScanFrom, items: [] };
}

writeFileSync(CACHE_FILE, JSON.stringify(state));
console.log(`Added ${tableAddress} to ${CACHE_FILE}. Restart lobby-fallback.mjs to pick it up.`);
