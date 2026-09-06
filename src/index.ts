import { ponder } from "ponder:registry";
import * as schema from "ponder:schema";
import { and, eq } from "drizzle-orm";
import { ChessGameTableAbi } from "../abis/ChessGameTableAbi";

// One-shot static config read right after a table is created via the Factory.
ponder.on("ChessGameFactory:TableCreated", async ({ event, context }) => {
  const tableAddress = event.args.table;
  const blockNumber = event.block.number;

  const [
    baseStake,
    rampPly,
    moveTimeout,
    curve,
    protocolFeeBps,
    protocolFeeRecipient,
    referralFeeBps,
    currentStake,
    whitePlayer,
    blackPlayer,
    token,
  ] = await Promise.all([
    context.client.readContract({
      abi: ChessGameTableAbi,
      address: tableAddress,
      functionName: "baseStake",
      blockNumber,
    }),
    context.client.readContract({
      abi: ChessGameTableAbi,
      address: tableAddress,
      functionName: "rampPly",
      blockNumber,
    }),
    context.client.readContract({
      abi: ChessGameTableAbi,
      address: tableAddress,
      functionName: "moveTimeout",
      blockNumber,
    }),
    context.client.readContract({
      abi: ChessGameTableAbi,
      address: tableAddress,
      functionName: "curve",
      blockNumber,
    }),
    context.client.readContract({
      abi: ChessGameTableAbi,
      address: tableAddress,
      functionName: "protocolFeeBps",
      blockNumber,
    }),
    context.client.readContract({
      abi: ChessGameTableAbi,
      address: tableAddress,
      functionName: "protocolFeeRecipient",
      blockNumber,
    }),
    context.client.readContract({
      abi: ChessGameTableAbi,
      address: tableAddress,
      functionName: "referralFeeBps",
      blockNumber,
    }),
    context.client.readContract({
      abi: ChessGameTableAbi,
      address: tableAddress,
      functionName: "currentStake",
      blockNumber,
    }),
    context.client.readContract({
      abi: ChessGameTableAbi,
      address: tableAddress,
      functionName: "whitePlayer",
      blockNumber,
    }),
    context.client.readContract({
      abi: ChessGameTableAbi,
      address: tableAddress,
      functionName: "blackPlayer",
      blockNumber,
    }),
    context.client.readContract({
      abi: ChessGameTableAbi,
      address: tableAddress,
      functionName: "token",
      blockNumber,
    }),
  ]);

  await context.db.insert(schema.table).values({
    id: tableAddress,
    mode: event.args.mode,
    creator: event.args.creator,
    frontendRecipient: event.args.frontendRecipient,
    createdAtBlock: blockNumber,
    createdAtTimestamp: event.block.timestamp,
    baseStake,
    rampPly,
    moveTimeout: BigInt(moveTimeout),
    curve,
    protocolFeeBps,
    protocolFeeRecipient,
    referralFeeBps,
    token,
    status: 0, // Active
    result: 0, // None
    plyCount: 0,
    pot: 0n,
    currentStake,
    whiteToMove: true,
    lastMoveTimestamp: event.block.timestamp,
    whitePlayer,
    blackPlayer,
    totalWhiteContribution: 0n,
    totalBlackContribution: 0n,
  });
});

// Every successful move: record it AND the canonical on-chain state right
// after it, read directly from the contract (never re-derived off-chain).
ponder.on("ChessGameTable:MoveMade", async ({ event, context }) => {
  const tableAddress = event.log.address;
  const blockNumber = event.block.number;

  const [
    boardAfter,
    castlingRightsAfter,
    enPassantAfterSquare,
    whiteToMoveAfter,
    halfmoveClockAfter,
    plyCountAfter,
    currentStakeAfter,
    potAfter,
    mode,
    whitePlayer,
    blackPlayer,
    totalWhiteContribution,
    totalBlackContribution,
  ] = await Promise.all([
    context.client.readContract({
      abi: ChessGameTableAbi,
      address: tableAddress,
      functionName: "board",
      blockNumber,
    }),
    context.client.readContract({
      abi: ChessGameTableAbi,
      address: tableAddress,
      functionName: "castlingRights",
      blockNumber,
    }),
    context.client.readContract({
      abi: ChessGameTableAbi,
      address: tableAddress,
      functionName: "enPassantSquare",
      blockNumber,
    }),
    context.client.readContract({
      abi: ChessGameTableAbi,
      address: tableAddress,
      functionName: "whiteToMove",
      blockNumber,
    }),
    context.client.readContract({
      abi: ChessGameTableAbi,
      address: tableAddress,
      functionName: "halfmoveClock",
      blockNumber,
    }),
    context.client.readContract({
      abi: ChessGameTableAbi,
      address: tableAddress,
      functionName: "plyCount",
      blockNumber,
    }),
    context.client.readContract({
      abi: ChessGameTableAbi,
      address: tableAddress,
      functionName: "currentStake",
      blockNumber,
    }),
    context.client.readContract({
      abi: ChessGameTableAbi,
      address: tableAddress,
      functionName: "pot",
      blockNumber,
    }),
    context.client.readContract({
      abi: ChessGameTableAbi,
      address: tableAddress,
      functionName: "mode",
      blockNumber,
    }),
    context.client.readContract({
      abi: ChessGameTableAbi,
      address: tableAddress,
      functionName: "whitePlayer",
      blockNumber,
    }),
    context.client.readContract({
      abi: ChessGameTableAbi,
      address: tableAddress,
      functionName: "blackPlayer",
      blockNumber,
    }),
    context.client.readContract({
      abi: ChessGameTableAbi,
      address: tableAddress,
      functionName: "totalWhiteContribution",
      blockNumber,
    }),
    context.client.readContract({
      abi: ChessGameTableAbi,
      address: tableAddress,
      functionName: "totalBlackContribution",
      blockNumber,
    }),
  ]);

  await context.db.insert(schema.move).values({
    id: `${tableAddress}-${blockNumber}-${event.log.logIndex}`,
    tableId: tableAddress,
    plyIndex: plyCountAfter,
    mover: event.args.mover,
    fromSquare: event.args.from,
    toSquare: event.args.to,
    promotion: event.args.promotion,
    stakePaid: event.args.stakePaid,
    blockNumber,
    timestamp: event.block.timestamp,
    txHash: event.transaction.hash,
    takenBack: false,
    boardAfter,
    castlingRightsAfter,
    enPassantAfterSquare,
    whiteToMoveAfter,
    halfmoveClockAfter,
    currentStakeAfter,
    potAfter,
  });

  await context.db.update(schema.table, { id: tableAddress }).set({
    plyCount: plyCountAfter,
    pot: potAfter,
    currentStake: currentStakeAfter,
    whiteToMove: whiteToMoveAfter,
    lastMoveTimestamp: event.block.timestamp,
    whitePlayer,
    blackPlayer,
    totalWhiteContribution,
    totalBlackContribution,
  });

  // Crowd only (see ponder.schema.ts's `backer` comment) -- the mover's
  // colour is whichever side was to move BEFORE this move, i.e. the
  // opposite of the post-move `whiteToMoveAfter` flag.
  if (mode === 1) {
    await context.db
      .insert(schema.backer)
      .values({
        id: `${tableAddress}-${event.args.mover}`,
        tableId: tableAddress,
        address: event.args.mover,
        isWhite: !whiteToMoveAfter,
      })
      .onConflictDoNothing();
  }
});

ponder.on("ChessGameTable:GameFinished", async ({ event, context }) => {
  const tableAddress = event.log.address;
  const blockNumber = event.block.number;

  await context.db.insert(schema.gameFinishedEvent).values({
    id: `${tableAddress}-${event.block.number}-${event.log.logIndex}`,
    tableId: tableAddress,
    result: event.args.result,
    triggeredBy: event.args.triggeredBy,
    blockNumber: event.block.number,
    timestamp: event.block.timestamp,
  });

  // _finalize() zeroes `pot` on-chain (it moves into per-address `withdrawable`
  // balances) -- re-read canonical state here instead of assuming, same policy
  // as everywhere else in this file. Without this, `table.pot` would keep
  // showing the last pre-finalization value forever after a game ends.
  const [potAfter, currentStakeAfter] = await Promise.all([
    context.client.readContract({
      abi: ChessGameTableAbi,
      address: tableAddress,
      functionName: "pot",
      blockNumber,
    }),
    context.client.readContract({
      abi: ChessGameTableAbi,
      address: tableAddress,
      functionName: "currentStake",
      blockNumber,
    }),
  ]);

  await context.db.update(schema.table, { id: tableAddress }).set({
    pot: potAfter,
    currentStake: currentStakeAfter,
    status: 1, // Finished
    result: event.args.result,
  });
});

// A takeback (Duel two-party accept, or a Crowd group vote passing --
// both emit this same event) rolls plyCount back by exactly one on-chain.
// The undone move's row is kept and marked `takenBack: true` (not deleted --
// see ponder.schema.ts's `move.id` comment for why this is safe to do
// without colliding with a later move replayed at the same plyIndex): the UI
// can then show "this move happened, then got taken back" instead of the
// move silently vanishing from history.
ponder.on("ChessGameTable:TakebackAccepted", async ({ event, context }) => {
  const tableAddress = event.log.address;
  const blockNumber = event.block.number;

  const [
    plyCountAfter,
    potAfter,
    currentStakeAfter,
    whiteToMoveAfter,
    totalWhiteContribution,
    totalBlackContribution,
  ] = await Promise.all([
    context.client.readContract({
      abi: ChessGameTableAbi,
      address: tableAddress,
      functionName: "plyCount",
      blockNumber,
    }),
    context.client.readContract({
      abi: ChessGameTableAbi,
      address: tableAddress,
      functionName: "pot",
      blockNumber,
    }),
    context.client.readContract({
      abi: ChessGameTableAbi,
      address: tableAddress,
      functionName: "currentStake",
      blockNumber,
    }),
    context.client.readContract({
      abi: ChessGameTableAbi,
      address: tableAddress,
      functionName: "whiteToMove",
      blockNumber,
    }),
    // Only Crowd's group-vote takeback path touches these (see
    // ChessGameTable._applyGroupProposal's refund block) -- for Duel's direct
    // two-party takeback they stay 0 and this read is a harmless no-op.
    context.client.readContract({
      abi: ChessGameTableAbi,
      address: tableAddress,
      functionName: "totalWhiteContribution",
      blockNumber,
    }),
    context.client.readContract({
      abi: ChessGameTableAbi,
      address: tableAddress,
      functionName: "totalBlackContribution",
      blockNumber,
    }),
  ]);

  // plyCountAfter is the ply count AFTER the rollback, so the undone move
  // sat at plyCountAfter + 1 (the ply that no longer exists on-chain).
  await context.db.sql
    .update(schema.move)
    .set({ takenBack: true })
    .where(and(eq(schema.move.tableId, tableAddress), eq(schema.move.plyIndex, plyCountAfter + 1)));

  await context.db.update(schema.table, { id: tableAddress }).set({
    plyCount: plyCountAfter,
    pot: potAfter,
    currentStake: currentStakeAfter,
    whiteToMove: whiteToMoveAfter,
    lastMoveTimestamp: event.block.timestamp,
    totalWhiteContribution,
    totalBlackContribution,
  });
});

// Owner-curated ERC20 allowlist changes -- fixed factory address, not a per-table event, so
// this is a plain handler like the events above rather than needing the factory-clone
// address-discovery pattern ChessGameTable's events rely on.
ponder.on("ChessGameFactory:TokenAllowlistUpdated", async ({ event, context }) => {
  await context.db
    .insert(schema.allowedToken)
    .values({
      id: event.args.token,
      allowed: event.args.allowed,
      updatedAtBlock: event.block.number,
      updatedAtTimestamp: event.block.timestamp,
    })
    .onConflictDoUpdate({
      allowed: event.args.allowed,
      updatedAtBlock: event.block.number,
      updatedAtTimestamp: event.block.timestamp,
    });
});

// Permissionless ELO settlement for a finished Duel table (separate
// ChessEloRegistry contract). `newRating` is authoritative -- it's exactly
// what the registry's own effectiveRating() will return for this player from
// this block onward, so it's stored as-is rather than recomputed.
ponder.on("ChessEloRegistry:RatingUpdated", async ({ event, context }) => {
  await context.db
    .insert(schema.rating)
    .values({
      id: event.args.player,
      value: event.args.newRating,
      updatedAtBlock: event.block.number,
      updatedAtTimestamp: event.block.timestamp,
    })
    .onConflictDoUpdate({
      value: event.args.newRating,
      updatedAtBlock: event.block.number,
      updatedAtTimestamp: event.block.timestamp,
    });
});
