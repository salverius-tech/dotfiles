#!/usr/bin/env bash
# Verify canonical maestro.json tool names match Pi maestro.ts registered tools.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ADAPTER_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

SKILL_DIR=""
for candidate in \
  "$ADAPTER_DIR/../../../skills/maestro" \
  "$HOME/.agents/skills/maestro"; do
  if [[ -d "$candidate" ]]; then
    SKILL_DIR="$(cd "$candidate" && pwd)"
    break
  fi
done

if [[ -z "$SKILL_DIR" || ! -f "$SKILL_DIR/maestro.json" ]]; then
  echo "ERROR: maestro.json not found in skills/maestro/"
  exit 1
fi
SCHEMA="$SKILL_DIR/maestro.json"

TS_FILE=""
for candidate in \
  "$ADAPTER_DIR/../extensions/maestro.ts" \
  "$HOME/.agents/adapters/pi/extensions/maestro.ts"; do
  if [[ -f "$candidate" ]]; then
    TS_FILE="$candidate"
    break
  fi
done

if [[ -z "$TS_FILE" ]]; then
  echo "ERROR: Pi maestro.ts not found"
  exit 1
fi

echo "Pi schema sync check"
echo "===================="
echo "  JSON: $SCHEMA"
echo "  TS:   $TS_FILE"
echo ""

python - "$SCHEMA" "$TS_FILE" <<'PY'
import json
import re
import sys
from pathlib import Path

schema_path = Path(sys.argv[1])
ts_path = Path(sys.argv[2])

data = json.loads(schema_path.read_text(encoding="utf-8"))
json_tools = sorted(tool["name"].replace(".", "_") for tool in data.get("tools", []))
ts_text = ts_path.read_text(encoding="utf-8")
ts_tools = sorted(set(re.findall(r'name:\s*"maestro_(\w+)"', ts_text)))

print(f"  JSON tools ({len(json_tools)}): {' '.join(json_tools)}")
print(f"  TS tools ({len(ts_tools)}):   {' '.join(ts_tools)}")
print()

errors = 0
for name in json_tools:
    if name not in ts_tools:
        print(f"  MISSING in Pi TS: {name} (defined in JSON but not registered)")
        errors += 1
for name in ts_tools:
    if name not in json_tools:
        print(f"  MISSING in JSON: maestro_{name} (registered in Pi TS but not in maestro.json)")
        errors += 1
if "maestro_vector_collections_" in ts_text:
    print("  LEGACY NAME FOUND: maestro_vector_collections_*")
    errors += 1

print()
if errors:
    print(f"FAIL: {errors} synchronization errors found")
    sys.exit(1)
print(f"PASS: All Pi tools are in sync ({len(ts_tools)} tools)")
PY
