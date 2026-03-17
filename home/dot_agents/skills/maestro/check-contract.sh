#!/usr/bin/env bash
# Maestro contract guardrail — rejects forbidden patterns in maestro.ts
#
# Usage:
#   ./check-contract.sh [path-to-maestro.ts]
#
# Exit codes:
#   0 — no violations
#   1 — violations found

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Resolve maestro.ts path
TS_FILE="${1:-}"
if [[ -z "$TS_FILE" ]]; then
  for candidate in \
    "$HOME/.config/opencode/tools/maestro.ts" \
    "$SCRIPT_DIR/../../../private_dot_config/opencode/tools/maestro.ts"; do
    if [[ -f "$candidate" ]]; then
      TS_FILE="$candidate"
      break
    fi
  done
fi

if [[ -z "$TS_FILE" || ! -f "$TS_FILE" ]]; then
  echo "ERROR: maestro.ts not found"
  echo "Usage: $0 [path-to-maestro.ts]"
  exit 1
fi

echo "Contract check: $TS_FILE"
echo "========================="

VIOLATIONS=0

check_forbidden() {
  local pattern="$1"
  local label="$2"
  local matches
  matches=$(grep -nP "$pattern" "$TS_FILE" 2>/dev/null || true)
  if [[ -n "$matches" ]]; then
    echo "  VIOLATION: $label"
    echo "$matches" | sed 's/^/    /'
    VIOLATIONS=$((VIOLATIONS + 1))
  fi
}

# Legacy API fields
check_forbidden '\bhandler\s*[:({]' "Legacy 'handler' field"
check_forbidden '\binputSchema\s*:' "Legacy 'inputSchema' field"
check_forbidden '^\s*schema\s*:' "Legacy 'schema' field"
check_forbidden '\bargsSchema\s*:' "Legacy 'argsSchema' field"

# JSON-schema conversion helpers
check_forbidden '\bjsonSchemaToZodShape\b' "JSON-schema helper 'jsonSchemaToZodShape'"
check_forbidden '\bzodForType\b' "JSON-schema helper 'zodForType'"
check_forbidden '\bJsonSchemaProp\b' "JSON-schema helper 'JsonSchemaProp'"

# Forbidden export patterns
check_forbidden '^\s*export\s+default\b' "Default export (must use named exports)"

# Double-wrapped args (fromPlugin wraps in z.object — passing z.object causes schema._zod.def error)
check_forbidden 'args:\s*[sz]\.object\(' "Double-wrapped args (use plain shape, not z.object/s.object)"

# Direct zod import (must use tool.schema to get the same Zod instance)
check_forbidden 'import\s*\{[^}]*\bz\b[^}]*\}\s*from\s*"zod"' "Direct zod import (use const z = tool.schema instead)"

# Env var access outside getMaestroConfig
# Match process.env that is NOT inside the getMaestroConfig function
# Strategy: find all process.env lines, then exclude those within getMaestroConfig
env_lines=$(grep -n 'process\.env' "$TS_FILE" 2>/dev/null || true)
if [[ -n "$env_lines" ]]; then
  # Find getMaestroConfig function boundaries
  func_start=$(grep -n 'function getMaestroConfig' "$TS_FILE" | head -1 | cut -d: -f1)
  if [[ -n "$func_start" ]]; then
    # Find closing brace — count braces from function start
    func_end=""
    depth=0
    started=false
    while IFS= read -r line; do
      linenum=$(echo "$line" | cut -d: -f1)
      if [[ $linenum -lt $func_start ]]; then continue; fi
      opens=$(echo "$line" | { grep -o '{' || true; } | wc -l)
      closes=$(echo "$line" | { grep -o '}' || true; } | wc -l)
      depth=$((depth + opens - closes))
      if [[ $opens -gt 0 ]]; then started=true; fi
      if $started && [[ $depth -le 0 ]]; then
        func_end=$linenum
        break
      fi
    done < <(grep -n '.' "$TS_FILE")

    # Check if any process.env lines are outside the function
    while IFS= read -r env_line; do
      linenum=$(echo "$env_line" | cut -d: -f1)
      if [[ -n "$func_end" ]] && [[ $linenum -ge $func_start ]] && [[ $linenum -le $func_end ]]; then
        continue  # Inside getMaestroConfig — allowed
      fi
      echo "  VIOLATION: process.env outside getMaestroConfig() at line $linenum"
      echo "    $env_line"
      VIOLATIONS=$((VIOLATIONS + 1))
    done <<< "$env_lines"
  else
    echo "  VIOLATION: process.env used but getMaestroConfig() not found"
    echo "$env_lines" | sed 's/^/    /'
    VIOLATIONS=$((VIOLATIONS + 1))
  fi
fi

echo ""
if [[ $VIOLATIONS -gt 0 ]]; then
  echo "FAIL: $VIOLATIONS contract violations found"
  exit 1
fi

echo "PASS: No contract violations"
