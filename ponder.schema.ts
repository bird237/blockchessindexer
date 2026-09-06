import { onchainTable } from "ponder";

// One row per deployed ChessGameTable clone (Duel/Crowd).
export const table = onchainTable("table", (t) => ({
  id: t.hex().primaryKey(), // table contract address
  mode: t.integer().notNull(), // 0=Duel, 1=Crowd
  creator: t.hex().notNull(), // msg.sender of the Factory create call
  frontendRecipient: t.hex().notNull(),
  createdAtBlock: t.bigint().notNull(),
  createdAtTimestamp: t.bigint().notNull(),

  // static config, read once right after creation
  baseStake: t.bigint().notNull(),
  rampPly: t.integer().notNull(),
  moveTimeout: t.bigint().notNull(),
  curve: t.integer().notNull(), // 0=Linear, 1=Compound
  protocolFeeBps: t.integer().notNull(),
  protocolFeeRecipient: t.hex().notNull(),
  referralFeeBps: t.integer().notNull(),
  // address(0) = native currency (POL); any other value is the allowlisted ERC20 this table's
  // stakes/fees/payouts move in. Frozen at creation (ChessGameTable.initialize), never re-read.
  token: t.hex().notNull(),

  // live state, updated on every relevant event
  status: t.integer().notNull(), // 0=Active, 1=Finished
  result: t.integer().notNull(), // 0=None, 1=WhiteWon, 2=BlackWon, 3=Draw
  plyCount: t.integer().notNull(),
  pot: t.bigint().notNull(),
  currentStake: t.bigint().notNull(),
  whiteToMove: t.boolean().notNull(),
  lastMoveTimestamp: t.bigint().notNull(),

  // Seating (Duel: address(0) = vacancy, filled by whoever makes the first move
  // for that colour -- see ChessGameTable.makeMove) and Crowd contribution
  // totals (always 0 for Duel, contract only tracks these in Crowd mode).
  // Both are public getters on the table contract, read live like everything
  // else here -- never re-derived off-chain.
  whitePlayer: t.hex().notNull(),
  blackPlayer: t.hex().notNull(),
  totalWhiteContribution: t.bigint().notNull(),
  totalBlackContribution: t.bigint().notNull(),
}));

// One row per distinct address that has contributed to one side of a Crowd
// table. The contract only sums amounts (totalWhiteContribution/
// totalBlackContribution above) and never counts distinct backers itself, so
// the lobby's "N backers" figure has to be built here instead. Duel tables
// never get rows (contribution tracking is Crowd-only on-chain, see
// ChessGameTable.makeMove's `if (mode == Mode.Crowd)` gate).
//
// Known gap (accepted as-is): a row is never removed, so an
// address whose sole contribution was later fully refunded via a takeback
// still counts toward "N backers" even though totalWhiteContribution/
// totalBlackContribution -- the numbers that actually gate payouts via
// claimShare() -- correctly reflect the refund. Cosmetic-only, narrow (only
// possible for someone's very first move on a side, undone before any other
// contribution), not worth the extra per-backer amount tracking it would
// take to fix.
export const backer = onchainTable("backer", (t) => ({
  id: t.text().primaryKey(), // `${tableAddress}-${address}`
  tableId: t.hex().notNull(),
  address: t.hex().notNull(),
  isWhite: t.boolean().notNull(),
}));

// One row per successful move (MoveMade event), including the resulting
// canonical on-chain state read right after the move -- never recomputed
// off-chain, to avoid re-implementing chess rules in a second language.
//
// `id` is keyed by block/log, NOT by plyIndex: a takeback rolls plyCount back
// by one on-chain, and a later move can land on that SAME plyIndex again --
// keying by plyIndex would collide on re-insert. `plyIndex` stays a plain
// (non-unique) field for ordering/display; `takenBack` marks the row that a
// later TakebackAccepted undid, instead of deleting it, so the UI can show
// "this move happened, then got taken back" rather than erasing history.
export const move = onchainTable("move", (t) => ({
  id: t.text().primaryKey(), // `${tableAddress}-${blockNumber}-${logIndex}`
  tableId: t.hex().notNull(),
  plyIndex: t.integer().notNull(), // 1-based, matches on-chain plyCount after the move
  mover: t.hex().notNull(),
  fromSquare: t.integer().notNull(),
  toSquare: t.integer().notNull(),
  promotion: t.integer().notNull(),
  stakePaid: t.bigint().notNull(),
  blockNumber: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
  txHash: t.hex().notNull(),
  takenBack: t.boolean().notNull(), // true once a later TakebackAccepted undoes this exact move

  // canonical state AFTER this move, read via readContract at this block
  boardAfter: t.bigint().notNull(), // packed uint256, 4 bits/square
  castlingRightsAfter: t.integer().notNull(),
  enPassantAfterSquare: t.integer().notNull(),
  whiteToMoveAfter: t.boolean().notNull(),
  halfmoveClockAfter: t.integer().notNull(),
  currentStakeAfter: t.bigint().notNull(),
  potAfter: t.bigint().notNull(),
}));

// Terminal event for a table (checkmate/stalemate/draw/timeout/resign/etc).
export const gameFinishedEvent = onchainTable("game_finished_event", (t) => ({
  id: t.text().primaryKey(), // `${tableAddress}-${blockNumber}-${logIndex}`
  tableId: t.hex().notNull(),
  result: t.integer().notNull(),
  triggeredBy: t.hex().notNull(),
  blockNumber: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
}));

// Owner-curated ERC20 allowlist state, fed by ChessGameFactory's TokenAllowlistUpdated event.
// address(0) (native currency) is never emitted here -- it's always allowed
// implicitly, both on-chain and in the frontend's token picker. A row with `allowed: false`
// means the token WAS allowlisted and has since been removed (kept, not deleted, so history is
// visible) -- existing tables created with it are unaffected either way, see the contract's own
// NatSpec on setTokenAllowed.
export const allowedToken = onchainTable("allowed_token", (t) => ({
  id: t.hex().primaryKey(), // token address
  allowed: t.boolean().notNull(),
  updatedAtBlock: t.bigint().notNull(),
  updatedAtTimestamp: t.bigint().notNull(),
}));

// Current ELO rating per player, fed by ChessEloRegistry's RatingUpdated
// event (Duel-only). A player with no row here is untouched --
// the registry's own effectiveRating() returns DEFAULT_RATING (1200) for
// anyone who hasn't finished a recorded game, so the frontend should treat a
// missing row the same way rather than showing 0/blank.
export const rating = onchainTable("rating", (t) => ({
  id: t.hex().primaryKey(), // player address
  value: t.integer().notNull(),
  updatedAtBlock: t.bigint().notNull(),
  updatedAtTimestamp: t.bigint().notNull(),
}));
