#!/usr/bin/env bash
# Maestro validation suite.
# Exercises read-only endpoints and dry-run-capable POST tools against a live server.
# Set MAESTRO_VALIDATE_DESTRUCTIVE=true to create disposable non-Docker resources
# and validate path-parameter/destructive endpoints with cleanup.
# Set MAESTRO_VALIDATE_DOCKER=true to also validate Docker lifecycle endpoints.
#
# Usage:
#   MAESTRO_BASE_URL=http://localhost:8100 MAESTRO_API_KEY=test ./validate-tools.sh
#   MAESTRO_VALIDATE_DESTRUCTIVE=true MAESTRO_BASE_URL=http://localhost:8100 MAESTRO_API_KEY=test ./validate-tools.sh
#   MAESTRO_VALIDATE_DESTRUCTIVE=true MAESTRO_VALIDATE_DOCKER=true MAESTRO_BASE_URL=http://localhost:8100 MAESTRO_API_KEY=test ./validate-tools.sh

set -euo pipefail

BASE_URL="${MAESTRO_BASE_URL:?Set MAESTRO_BASE_URL}"
API_KEY="${MAESTRO_API_KEY:-}"
VALIDATE_DESTRUCTIVE="${MAESTRO_VALIDATE_DESTRUCTIVE:-false}"
VALIDATE_DOCKER="${MAESTRO_VALIDATE_DOCKER:-false}"
VALIDATION_TOKEN="validation_$$_$(date +%s)"

PASS=0
FAIL=0
SKIP=0
ERRORS=""
LAST_BODY=""
LAST_HTTP_CODE=""
CREATED_VECTOR_COLLECTION=""
CREATED_ARTIFACT_ID=""
CREATED_CONTAINER_ID=""
CREATED_TASK_IDS=()

is_true() {
  case "${1,,}" in
    1|true|yes|y|on) return 0 ;;
    *) return 1 ;;
  esac
}

record_failure() {
  local name="$1"
  local detail="$2"

  FAIL=$((FAIL + 1))
  ERRORS="${ERRORS}\n  FAIL  $name: $detail"
  echo "  FAIL  $name"
}

request() {
  local method="$1"
  local path="$2"
  local body="${3:-}"

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

  LAST_HTTP_CODE=$(printf '%s\n' "$response" | tail -1)
  LAST_BODY=$(printf '%s\n' "$response" | sed '$d')
}

json_value() {
  local path="$1"

  python -c '
import json
import sys

path = sys.argv[1].split(".") if sys.argv[1] else []
try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)
value = data
for key in path:
    if isinstance(value, dict) and key in value:
        value = value[key]
    else:
        sys.exit(0)
if value is None:
    sys.exit(0)
if isinstance(value, bool):
    print("true" if value else "false")
elif isinstance(value, (dict, list)):
    print(json.dumps(value, separators=(",", ":")))
else:
    print(value)
' "$path" <<< "$LAST_BODY" 2>/dev/null || true
}

call() {
  local name="$1"
  local method="$2"
  local path="$3"
  local body="${4:-}"

  request "$method" "$path" "$body"

  if [[ "$LAST_HTTP_CODE" =~ ^2[0-9][0-9]$ ]]; then
    local status
    status=$(json_value "status")
    if [[ "$status" == "failed" ]]; then
      record_failure "$name" "HTTP $LAST_HTTP_CODE returned failed envelope: $LAST_BODY"
      return 0
    fi
    PASS=$((PASS + 1))
    echo "  PASS  $name (HTTP $LAST_HTTP_CODE)"
  else
    record_failure "$name" "HTTP $LAST_HTTP_CODE: $LAST_BODY"
  fi
}

skip() {
  SKIP=$((SKIP + 1))
  echo "  SKIP  $1 ($2)"
}

last_response_ok() {
  local status
  status=$(json_value "status")
  [[ "$LAST_HTTP_CODE" =~ ^2[0-9][0-9]$ && "$status" != "failed" ]]
}

cleanup() {
  if [[ -n "$CREATED_CONTAINER_ID" ]]; then
    request POST "/docker/${CREATED_CONTAINER_ID}/stop" || true
    request DELETE "/docker/${CREATED_CONTAINER_ID}" || true
  fi
  if [[ -n "$CREATED_ARTIFACT_ID" ]]; then
    request DELETE "/artifacts/${CREATED_ARTIFACT_ID}" || true
  fi
  for task_id in "${CREATED_TASK_IDS[@]:-}"; do
    if [[ -n "$task_id" ]]; then
      request DELETE "/tasks/${task_id}" || true
    fi
  done
  if [[ -n "$CREATED_VECTOR_COLLECTION" ]]; then
    request DELETE "/vector/collections/${CREATED_VECTOR_COLLECTION}" || true
  fi
}
trap cleanup EXIT

validate_vector_delete_collection() {
  if ! is_true "$VALIDATE_DESTRUCTIVE"; then
    skip "maestro_vector_delete_collection" "set MAESTRO_VALIDATE_DESTRUCTIVE=true to create and delete a disposable collection"
    return
  fi

  CREATED_VECTOR_COLLECTION="${VALIDATION_TOKEN}_vector"
  call "maestro_vector_create_collection_live" POST "/vector/collections" \
    "{\"contract_version\":\"1.0\",\"name\":\"${CREATED_VECTOR_COLLECTION}\",\"vector_size\":1,\"if_not_exists\":true}"
  if ! last_response_ok; then
    return
  fi
  call "maestro_vector_delete_collection" DELETE "/vector/collections/${CREATED_VECTOR_COLLECTION}"
  CREATED_VECTOR_COLLECTION=""
}

validate_artifact_resource() {
  if ! is_true "$VALIDATE_DESTRUCTIVE"; then
    skip "maestro_artifact_get" "set MAESTRO_VALIDATE_DESTRUCTIVE=true to create and read a disposable artifact"
    skip "maestro_artifact_delete" "set MAESTRO_VALIDATE_DESTRUCTIVE=true to delete a disposable artifact"
    return
  fi

  call "maestro_artifact_put_live" POST "/artifacts/put" \
    "{\"contract_version\":\"1.0\",\"content\":\"validation artifact\",\"filename\":\"${VALIDATION_TOKEN}.txt\",\"metadata\":{\"purpose\":\"validation\"},\"ttl_seconds\":3600}"
  if ! last_response_ok; then
    return
  fi
  CREATED_ARTIFACT_ID=$(json_value "result.id")
  if [[ -z "$CREATED_ARTIFACT_ID" ]]; then
    record_failure "maestro_artifact_put_live" "response did not include result.id: $LAST_BODY"
    return
  fi

  call "maestro_artifact_get" GET "/artifacts/${CREATED_ARTIFACT_ID}"
  call "maestro_artifact_delete" DELETE "/artifacts/${CREATED_ARTIFACT_ID}"
  CREATED_ARTIFACT_ID=""
}

validate_task_resources() {
  if ! is_true "$VALIDATE_DESTRUCTIVE"; then
    skip "maestro_tasks_get" "set MAESTRO_VALIDATE_DESTRUCTIVE=true to create and inspect a disposable task"
    skip "maestro_tasks_logs" "set MAESTRO_VALIDATE_DESTRUCTIVE=true to inspect disposable task logs"
    skip "maestro_tasks_cancel" "set MAESTRO_VALIDATE_DESTRUCTIVE=true to cancel a disposable task"
    skip "maestro_tasks_retry" "set MAESTRO_VALIDATE_DESTRUCTIVE=true to retry a disposable task"
    skip "maestro_tasks_delete" "set MAESTRO_VALIDATE_DESTRUCTIVE=true to delete disposable tasks"
    return
  fi

  call "maestro_tasks_submit_live" POST "/tasks" \
    '{"contract_version":"1.0","tool":"rerank","params":{"query":"metrics","documents":[{"text":"prometheus metrics"}]}}'
  if ! last_response_ok; then
    return
  fi
  local task_id
  task_id=$(json_value "task_id")
  if [[ -z "$task_id" ]]; then
    record_failure "maestro_tasks_submit_live" "response did not include task_id: $LAST_BODY"
    return
  fi
  CREATED_TASK_IDS+=("$task_id")

  call "maestro_tasks_get" GET "/tasks/${task_id}"
  call "maestro_tasks_logs" GET "/tasks/${task_id}/logs"
  call "maestro_tasks_cancel" POST "/tasks/${task_id}/cancel"
  call "maestro_tasks_retry" POST "/tasks/${task_id}/retry"

  local retry_task_id
  retry_task_id=$(json_value "task_id")
  if [[ -n "$retry_task_id" ]]; then
    CREATED_TASK_IDS+=("$retry_task_id")
  fi

  call "maestro_tasks_delete" DELETE "/tasks/${task_id}"
  if [[ -n "$retry_task_id" ]]; then
    call "maestro_tasks_delete_retry" DELETE "/tasks/${retry_task_id}"
  fi
  CREATED_TASK_IDS=()
}

validate_docker_resources() {
  if ! is_true "$VALIDATE_DOCKER"; then
    skip "maestro_docker_status" "set MAESTRO_VALIDATE_DOCKER=true to create and inspect a disposable container"
    skip "maestro_docker_logs" "set MAESTRO_VALIDATE_DOCKER=true to inspect disposable container logs"
    skip "maestro_docker_exec" "set MAESTRO_VALIDATE_DOCKER=true to exec in a disposable container"
    skip "maestro_docker_stop" "set MAESTRO_VALIDATE_DOCKER=true to stop a disposable container"
    skip "maestro_docker_remove" "set MAESTRO_VALIDATE_DOCKER=true to remove a disposable container"
    return
  fi

  call "maestro_docker_run_live" POST "/docker/run" \
    "{\"contract_version\":\"1.0\",\"image\":\"alpine:latest\",\"command\":\"sh -c 'while true; do echo validation; sleep 5; done'\",\"detach\":true,\"remove\":false,\"name\":\"${VALIDATION_TOKEN}\"}"
  if ! last_response_ok; then
    return
  fi
  CREATED_CONTAINER_ID=$(json_value "result.container_id")
  if [[ -z "$CREATED_CONTAINER_ID" ]]; then
    record_failure "maestro_docker_run_live" "response did not include result.container_id: $LAST_BODY"
    return
  fi

  call "maestro_docker_status" GET "/docker/${CREATED_CONTAINER_ID}/status"
  call "maestro_docker_logs" GET "/docker/${CREATED_CONTAINER_ID}/logs?tail=10"
  call "maestro_docker_exec" POST "/docker/${CREATED_CONTAINER_ID}/exec" \
    '{"contract_version":"1.0","command":"echo exec-validation"}'
  call "maestro_docker_stop" POST "/docker/${CREATED_CONTAINER_ID}/stop"
  call "maestro_docker_remove" DELETE "/docker/${CREATED_CONTAINER_ID}"
  CREATED_CONTAINER_ID=""
}

echo "Maestro Tool Validation Suite"
echo "=============================="
echo "Target: $BASE_URL"
echo "Auth:   $([[ -n "$API_KEY" ]] && echo X-API-Key || echo anonymous)"
echo "Mode:   $([[ $(is_true "$VALIDATE_DESTRUCTIVE" && echo true || echo false) == true ]] && echo destructive-resource-validation || echo safe-contract-validation)"
echo "Docker: $([[ $(is_true "$VALIDATE_DOCKER" && echo true || echo false) == true ]] && echo lifecycle-validation || echo skipped)"
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
call "maestro_rerank" POST "/rerank" \
  '{"contract_version":"1.0","query":"metrics","documents":[{"id":"a","text":"prometheus metrics"}],"top_k":1,"dry_run":true}'
call "maestro_text_chunk" POST "/text/chunk" \
  '{"contract_version":"1.0","text":"alpha beta gamma","strategy":"words","chunk_size":2,"overlap":1,"dry_run":true}'
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
validate_vector_delete_collection

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

# Artifact, audit, and async task endpoints.
call "maestro_artifact_put" POST "/artifacts/put" \
  '{"contract_version":"1.0","content":"validation artifact","filename":"validation.txt","dry_run":true}'
call "maestro_artifact_list" GET "/artifacts?limit=1"
validate_artifact_resource
call "maestro_artifact_cleanup_expired" POST "/artifacts/cleanup-expired" \
  '{"contract_version":"1.0","dry_run":true}'
call "maestro_audit_list" GET "/audit?limit=1"
call "maestro_tasks_submit" POST "/tasks" \
  '{"contract_version":"1.0","tool":"rerank","params":{"query":"metrics","documents":[{"text":"prometheus metrics"}]},"dry_run":true}'
call "maestro_tasks_list" GET "/tasks?limit=1"
validate_task_resources
call "maestro_tasks_cleanup" POST "/tasks/cleanup" \
  '{"contract_version":"1.0","statuses":["planned","completed","failed","canceled"],"dry_run":true}'

# Docker endpoints.
call "maestro_docker_run" POST "/docker/run" \
  '{"contract_version":"1.0","image":"alpine:latest","command":"echo test","detach":false,"dry_run":true}'
validate_docker_resources

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
