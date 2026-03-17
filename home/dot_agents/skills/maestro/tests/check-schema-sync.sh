#!/usr/bin/env bash
# Verify maestro.json tool count and names match maestro.ts exports
#
# Usage:
#   ./check-schema-sync.sh
#
# Exit codes:
#   0 — schemas are in sync
#   1 — mismatch detected

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Resolve paths — handle both source (dot_) and deployed (~/) layouts
if [[ -f "$SKILL_DIR/maestro.json" ]]; then
  SCHEMA="$SKILL_DIR/maestro.json"
else
  echo "ERROR: maestro.json not found in $SKILL_DIR"
  exit 1
fi

# Find maestro.ts — check common locations
TS_FILE=""
for candidate in \
  "$HOME/.config/opencode/tools/maestro.ts" \
  "$(cd "$SKILL_DIR/../../../private_dot_config/opencode/tools" 2>/dev/null && pwd)/maestro.ts" \
  "$(cd "$SKILL_DIR/../../.." 2>/dev/null && pwd)/private_dot_config/opencode/tools/maestro.ts"; do
  if [[ -f "$candidate" ]]; then
    TS_FILE="$candidate"
    break
  fi
done

if [[ -z "$TS_FILE" ]]; then
  echo "WARNING: maestro.ts not found — skipping TS export sync check"
  echo "  Checked: ~/.config/opencode/tools/maestro.ts"
  echo "  Checked: relative private_dot_config path"
  exit 0
fi

echo "Schema sync check"
echo "================="
echo "  JSON: $SCHEMA"
echo "  TS:   $TS_FILE"
echo ""

# Extract tool names from maestro.json
json_tools=$(grep -oP '"name"\s*:\s*"\K[^"]+' "$SCHEMA" | grep -v '^maestro$' | sort)
json_count=$(echo "$json_tools" | wc -l)

# Extract exported tool names from maestro.ts (export const maestro_xxx = tool({)
ts_tools=$(grep -oP 'export const maestro_\K\w+' "$TS_FILE" | sort)
ts_count=$(echo "$ts_tools" | wc -l)

echo "  JSON tools ($json_count): $(echo "$json_tools" | tr '\n' ' ')"
echo "  TS exports ($ts_count):   $(echo "$ts_tools" | tr '\n' ' ')"
echo ""

# Normalize JSON names: replace dots with underscores to match TS naming
json_normalized=$(echo "$json_tools" | sed 's/\./_/g' | sort)

ERRORS=0

# Check for tools in JSON but not in TS
while IFS= read -r tool_name; do
  if ! echo "$ts_tools" | grep -qx "$tool_name"; then
    echo "  MISSING in TS: $tool_name (defined in JSON but not exported from maestro.ts)"
    ERRORS=$((ERRORS + 1))
  fi
done <<< "$json_normalized"

# Check for tools in TS but not in JSON
while IFS= read -r tool_name; do
  if ! echo "$json_normalized" | grep -qx "$tool_name"; then
    echo "  MISSING in JSON: maestro_$tool_name (exported from maestro.ts but not in maestro.json)"
    ERRORS=$((ERRORS + 1))
  fi
done <<< "$ts_tools"

echo ""
if [[ $ERRORS -gt 0 ]]; then
  echo "FAIL: $ERRORS synchronization errors found"
  exit 1
fi

echo "PASS: All tools are in sync ($ts_count tools)"
