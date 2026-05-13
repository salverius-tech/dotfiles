#!/usr/bin/env bash
# Maestro validation suite.
# Exercises read-only endpoints and dry-run-capable POST tools against a live server.
# Destructive path-parameter Docker/collection DELETE actions are intentionally not executed.
#
# Usage:
#   MAESTRO_BASE_URL=http://localhost:8100 MAESTRO_API_KEY=test ./validate-tools.sh

set -euo pipefail

BASE_URL="${MAESTRO_BASE_URL:?Set MAESTRO_BASE_URL}"
API_KEY="${MAESTRO_API_KEY:-}"

PASS=0
FAIL=0
SKIP=0
ERRORS=""

call() {
  local name="$1"
  local method="$2"
  local path="$3"
  local body="${4:-}"

  local args=(-s -w "\n%{http_code}" -X "$method" "${BASE_URL}${path}")
  args+=(-H "Content-Type: application/json")
  if [[ -n "$API_KEY" ]]; then
    args+=(-H "X-API-Key: ${API_KEY}")
  fi
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

skip() {
  SKIP=$((SKIP + 1))
  echo "  SKIP  $1 ($2)"
}

echo "Maestro Tool Validation Suite"
echo "=============================="
echo "Target: $BASE_URL"
echo "Auth:   $([[ -n "$API_KEY" ]] && echo X-API-Key || echo anonymous)"
echo ""

# Service/read-only endpoints.
call "maestro_health" GET "/health"
call "maestro_health_detailed" GET "/health/detailed"
call "maestro_capabilities" GET "/capabilities"
call "maestro_manifest" GET "/manifest"
call "maestro_metrics" GET "/metrics"
call "maestro_metrics_prometheus" GET "/metrics/prometheus"

# Dry-run-capable execution endpoints.
call "maestro_run" POST "/run" \
  '{"contract_version":"1.0","command":"echo test","dry_run":true}'
call "maestro_llm" POST "/llm" \
  '{"contract_version":"1.0","model":"test","prompt":"hello","dry_run":true}'
call "maestro_embed" POST "/embed" \
  '{"contract_version":"1.0","input":"hello","dry_run":true}'
call "maestro_pipeline" POST "/pipeline" \
  '{"contract_version":"1.0","steps":[{"action":"run","params":{"command":"echo test"}}],"dry_run":true}'

# Vector endpoints.
call "maestro_vector_upsert" POST "/vector/upsert" \
  '{"contract_version":"1.0","collection":"test","points":[],"dry_run":true}'
call "maestro_vector_search" POST "/vector/search" \
  '{"contract_version":"1.0","collection":"test","vector":[0.1],"limit":1,"dry_run":true}'
call "maestro_vector_delete" POST "/vector/delete" \
  '{"contract_version":"1.0","collection":"test","ids":[],"dry_run":true}'
call "maestro_vector_list_collections" GET "/vector/collections"
call "maestro_vector_create_collection" POST "/vector/collections" \
  '{"contract_version":"1.0","name":"_validation_test","vector_size":768,"if_not_exists":true,"dry_run":true}'
skip "maestro_vector_delete_collection" "destructive DELETE; validate manually when safe"

# Memory endpoints.
call "maestro_memory_put" POST "/memory/put" \
  '{"contract_version":"1.0","namespace":"validation","kind":"fact","text":"dry run","dry_run":true}'
call "maestro_memory_get" POST "/memory/get" \
  '{"contract_version":"1.0","namespace":"validation","id":"dry-run","dry_run":true}'
call "maestro_memory_search" POST "/memory/search" \
  '{"contract_version":"1.0","namespace":"validation","query":"dry run","limit":1,"dry_run":true}'
call "maestro_memory_list" POST "/memory/list" \
  '{"contract_version":"1.0","namespace":"validation","limit":1,"dry_run":true}'
call "maestro_memory_delete" POST "/memory/delete" \
  '{"contract_version":"1.0","namespace":"validation","id":"dry-run","dry_run":true}'

# File endpoints.
call "maestro_file_read" POST "/file/read" \
  '{"contract_version":"1.0","path":"validation.txt","dry_run":true}'
call "maestro_file_write" POST "/file/write" \
  '{"contract_version":"1.0","path":"validation.txt","content":"x","dry_run":true}'

# Docker endpoints.
call "maestro_docker_run" POST "/docker/run" \
  '{"contract_version":"1.0","image":"alpine:latest","command":"echo test","detach":false,"dry_run":true}'
skip "maestro_docker_status" "requires a real container id"
skip "maestro_docker_logs" "requires a real container id"
skip "maestro_docker_exec" "requires a real container id"
skip "maestro_docker_stop" "requires a real container id and mutates state"
skip "maestro_docker_remove" "requires a real container id and mutates state"

echo ""
echo "=============================="
echo "Results: $PASS passed, $FAIL failed, $SKIP skipped"

if [[ $FAIL -gt 0 ]]; then
  echo ""
  echo "Failures:"
  echo -e "$ERRORS"
  exit 1
fi

echo "Validation completed."
