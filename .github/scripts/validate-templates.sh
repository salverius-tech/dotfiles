#!/bin/bash
# Validate chezmoi templates by rendering configuration and dry-running an apply.

set -euo pipefail

cd "$(dirname "$0")/../.."

echo "Validating chezmoi configuration..."

if [ ! -f "home/.chezmoi.toml.tmpl" ]; then
    echo "ERROR: home/.chezmoi.toml.tmpl not found"
    exit 1
fi

if [ ! -d "home" ]; then
    echo "ERROR: home directory not found"
    exit 1
fi

if ! command -v chezmoi >/dev/null 2>&1; then
    echo "ERROR: chezmoi is required for template validation"
    exit 1
fi

tmpl_count=$(find home -name "*.tmpl" | wc -l)
echo "Found $tmpl_count template files"

for file in home/dot_bashrc.tmpl home/dot_gitconfig.tmpl home/dot_pi/agent/settings.json.tmpl; do
    if [ ! -f "$file" ]; then
        echo "ERROR: Critical template missing: $file"
        exit 1
    fi
done

echo "Rendering chezmoi config template..."
chezmoi execute-template --init --file home/.chezmoi.toml.tmpl >/dev/null

echo "Dry-running chezmoi apply into temporary destination..."
tmp_dest=$(mktemp -d)
trap 'rm -rf "$tmp_dest"' EXIT
chezmoi apply --source . --destination "$tmp_dest" --dry-run --force >/dev/null

echo "Template validation completed successfully"
