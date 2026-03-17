#!/usr/bin/env bash
# Maestro dry-run validation suite
# Exercises all 13 tools via dry-run to verify the tool suite is functional.
#
# Usage:
#   MAESTRO_BASE_URL=http://localhost:8100 MAESTRO_API_KEY=test ./validate-tools.sh
#
# Exit codes:
#   0 — all tools pass
#   1 — one or more tools failed

set -euo pipefail

BASE_URL="${MAESTRO_BASE_URL:?Set MAESTRO_BASE_URL}"
API_KEY="${MAESTRO_API_KEY:?Set MAESTRO_API_KEY}"

PASS=0
FAIL=0
ERRORS=""

call() {
  local name="$1"
  local method="$2"
  local path="$3"
  local body="${4:-}"

  local args=(-s -w "\n%{http_code}" -X "$method" "${BASE_URL}${path}")
  args+=(-H "Content-Type: application/json")
  args+=(-H "X-API-Key: ${API_KEY}")
  if [[ -n "$body" ]]; then
    args+=(-d "$body")
  fi

  local response
  response=$(curl "${args[@]}" 2>&1) || true

  local http_code
  http_code=$(echo "$response" | tail -1)
  local body_text
  body_text=$(echo "$response" | sed '$d')

  if [[ "$http_code" =~ ^2[0-9][0-9]$ ]]; then
    PASS=$((PASS + 1))
    echo "  PASS  $name (HTTP $http_code)"
  else
    FAIL=$((FAIL + 1))
    ERRORS="${ERRORS}\n  FAIL  $name (HTTP $http_code): $body_text"
    echo "  FAIL  $name (HTTP $http_code)"
  fi
}

echo "Maestro Tool Validation Suite"
echo "=============================="
echo "Target: $BASE_URL"
echo ""

# 1. Health (GET, no body)
call "maestro_health" GET "/health"

# 2. Run (dry-run)
call "maestro_run" POST "/run" \
  '{"contract_version":"1.0","command":"echo test","dry_run":true}'

# 3. Pipeline (dry-run)
call "maestro_pipeline" POST "/pipeline" \
  '{"contract_version":"1.0","steps":[{"action":"run","params":{"command":"echo test"}}],"dry_run":true}'

# 4. LLM (dry-run)
call "maestro_llm" POST "/llm" \
  '{"contract_version":"1.0","model":"test","prompt":"hello","dry_run":true}'

# 5. Embed (dry-run)
call "maestro_embed" POST "/embed" \
  '{"contract_version":"1.0","input":"hello","dry_run":true}'

# 6. Vector upsert (dry-run)
call "maestro_vector_upsert" POST "/vector/upsert" \
  '{"contract_version":"1.0","collection":"test","points":[],"dry_run":true}'

# 7. Vector search (dry-run)
call "maestro_vector_search" POST "/vector/search" \
  '{"contract_version":"1.0","collection":"test","vector":[0.1],"limit":1,"dry_run":true}'

# 8. Vector delete (dry-run)
call "maestro_vector_delete" POST "/vector/delete" \
  '{"contract_version":"1.0","collection":"test","ids":[],"dry_run":true}'

# 9. File read (dry-run)
call "maestro_file_read" POST "/file/read" \
  '{"contract_version":"1.0","path":"/etc/hosts","dry_run":true}'

# 10. File write (dry-run)
call "maestro_file_write" POST "/file/write" \
  '{"contract_version":"1.0","path":"/tmp/maestro-test","content":"x","dry_run":true}'

# 11. Vector collections list (GET)
call "maestro_vector_collections_list" GET "/vector/collections"

# 12. Vector collections create (POST)
call "maestro_vector_collections_create" POST "/vector/collections" \
  '{"contract_version":"1.0","name":"_validation_test","vector_size":768,"if_not_exists":true}'

# 13. Vector collections delete (DELETE)
call "maestro_vector_collections_delete" DELETE "/vector/collections/_validation_test"

echo ""
echo "=============================="
echo "Results: $PASS passed, $FAIL failed (13 total)"

if [[ $FAIL -gt 0 ]]; then
  echo ""
  echo "Failures:"
  echo -e "$ERRORS"
  exit 1
fi

echo "All tools validated."
