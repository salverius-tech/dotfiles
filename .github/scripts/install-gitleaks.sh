#!/usr/bin/env bash
set -euo pipefail
exec bash "$(dirname "$0")/install-ci-tool.sh" gitleaks "${1:-$HOME/.local/bin}"
