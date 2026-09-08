#!/usr/bin/env bash
# Detects Ponder's recurring "historical state ... is not available" stuck-loop failure mode
# (see CONTRACT_ACTIONS.md / vault notes on the archive-node limitation of the public RPC) and
# auto-recovers by bumping START_BLOCK to a fresh point near the current chain head, wiping the
# local PGlite DB, and restarting -- the same manual fix repeated throughout this project's early
# days, now automated. Runs as root via a systemd timer, independent of the blockchess-indexer
# service's own (deliberately sandboxed, non-root) user.
#
# Does NOT touch blockchess-lobby -- that service discovers everything fresh from logs on its own
# and has never needed this kind of intervention.

set -euo pipefail

ENV_FILE="/opt/blockchess-indexer/.env.local"
PONDER_DIR="/opt/blockchess-indexer/.ponder"
SERVICE="blockchess-indexer"
RPC_URL="https://polygon-bor-rpc.publicnode.com"
CHECK_WINDOW="2 minutes ago"   # how far back to look for the error signature
SAFETY_MARGIN=200              # blocks back from current head for the new START_BLOCK
COOLDOWN_FILE="/var/run/blockchess-indexer-watchdog.last"
COOLDOWN_SECONDS=300           # don't fire again within 5 minutes of the previous fix

log() { echo "[$(date -Is)] $*"; }

# Cooldown: avoid flapping if the error signature is still in the log window right after a fix.
if [ -f "$COOLDOWN_FILE" ]; then
  last=$(cat "$COOLDOWN_FILE")
  now=$(date +%s)
  if [ $((now - last)) -lt "$COOLDOWN_SECONDS" ]; then
    exit 0
  fi
fi

if ! journalctl -u "$SERVICE" --since "$CHECK_WINDOW" --no-pager 2>/dev/null \
     | grep -q "historical state .* is not available"; then
  exit 0
fi

log "detected historical-state stuck loop in $SERVICE, auto-recovering"

LATEST_HEX=$(curl -s -X POST "$RPC_URL" -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  | grep -oP '"result"\s*:\s*"\K0x[0-9a-fA-F]+')

if [ -z "$LATEST_HEX" ]; then
  log "could not fetch latest block number from RPC, aborting this run (will retry next tick)"
  exit 1
fi

LATEST=$((LATEST_HEX))
NEW_START=$((LATEST - SAFETY_MARGIN))
OLD_START=$(grep '^START_BLOCK=' "$ENV_FILE" | cut -d= -f2- || echo "unknown")

log "bumping START_BLOCK: $OLD_START -> $NEW_START (latest=$LATEST, margin=$SAFETY_MARGIN)"

sed -i "s/^START_BLOCK=.*/START_BLOCK=$NEW_START/" "$ENV_FILE"

systemctl stop "$SERVICE"
rm -rf "$PONDER_DIR"
systemctl start "$SERVICE"

date +%s > "$COOLDOWN_FILE"
log "recovery complete, $SERVICE restarted from block $NEW_START"
