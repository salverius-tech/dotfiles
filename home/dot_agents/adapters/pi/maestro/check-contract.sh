#!/usr/bin/env bash
# Maestro contract guardrail — rejects forbidden patterns in Pi maestro.ts
#
# Usage:
#   ./check-contract.sh [path-to-maestro.ts]

set -euo pipefail
export LC_ALL=C

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

TS_FILE="${1:-}"
if [[ -z "$TS_FILE" ]]; then
  for candidate in \
    "$HOME/.agents/adapters/pi/extensions/maestro.ts" \
    "$SCRIPT_DIR/../extensions/maestro.ts"; do
    if [[ -f "$candidate" ]]; then
      TS_FILE="$candidate"
      break
    fi
  done
fi

if [[ -z "$TS_FILE" || ! -f "$TS_FILE" ]]; then
  echo "ERROR: Pi maestro.ts not found"
  echo "Usage: $0 [path-to-maestro.ts]"
  exit 1
fi

echo "Pi Maestro contract check: $TS_FILE"
echo "===================================="

VIOLATIONS=0

check_forbidden() {
  local pattern="$1"
  local label="$2"
  local matches
  matches=$(grep -nE "$pattern" "$TS_FILE" 2>/dev/null || true)
  if [[ -n "$matches" ]]; then
    echo "  VIOLATION: $label"
    while IFS= read -r match; do
      echo "    $match"
    done <<< "$matches"
    VIOLATIONS=$((VIOLATIONS + 1))
  fi
}

check_required() {
  local pattern="$1"
  local label="$2"
  if ! grep -qE "$pattern" "$TS_FILE" 2>/dev/null; then
    echo "  VIOLATION: missing $label"
    VIOLATIONS=$((VIOLATIONS + 1))
  fi
}

check_required 'export[[:space:]]+default[[:space:]]+function[[:space:]]+[A-Za-z0-9_]*[[:space:]]*\([^)]*ExtensionAPI' "default extension factory"
check_required 'pi\.registerTool[[:space:]]*\(' "pi.registerTool() usage"
check_required 'parameters:[[:space:]]*Type\.Object[[:space:]]*\(' "TypeBox Type.Object parameters"
check_required 'contract_version:[[:space:]]*CONTRACT_VERSION' "contract_version injection"
check_required 'signal' "AbortSignal forwarding"

check_forbidden '^[[:space:]]*export[[:space:]]+const[[:space:]]+maestro_' "Named tool export (Pi tools must be registered with pi.registerTool)"
check_forbidden 'export[[:space:]]+default[[:space:]]*\{' "Default object export (must export extension factory function)"
check_forbidden 'maestro_vector_collections_' "Legacy vector collection tool name"

# Env var access outside getMaestroConfig.
env_lines=$(grep -n 'process\.env' "$TS_FILE" 2>/dev/null || true)
if [[ -n "$env_lines" ]]; then
  func_start=$(grep -n 'function getMaestroConfig' "$TS_FILE" | head -1 | cut -d: -f1)
  if [[ -n "$func_start" ]]; then
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

    while IFS= read -r env_line; do
      linenum=$(echo "$env_line" | cut -d: -f1)
      if [[ -n "$func_end" ]] && [[ $linenum -ge $func_start ]] && [[ $linenum -le $func_end ]]; then
        continue
      fi
      echo "  VIOLATION: process.env outside getMaestroConfig() at line $linenum"
      echo "    $env_line"
      VIOLATIONS=$((VIOLATIONS + 1))
    done <<< "$env_lines"
  else
    echo "  VIOLATION: process.env used but getMaestroConfig() not found"
    VIOLATIONS=$((VIOLATIONS + 1))
  fi
fi

echo ""
if [[ $VIOLATIONS -gt 0 ]]; then
  echo "FAIL: $VIOLATIONS contract violations found"
  exit 1
fi

echo "PASS: No contract violations"
