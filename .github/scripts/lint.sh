#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
files=(.github/scripts/pre-commit)
while IFS= read -r -d '' file; do
    files+=("$file")
done < <(find home .github -type f \( -name '*.sh' -o -name '*.sh.tmpl' \) \
    -not -path 'home/dot_claude/tools/*' -print0)
shellcheck -x "${files[@]}"
