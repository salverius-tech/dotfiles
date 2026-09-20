#!/usr/bin/env bash
# Render with isolated configuration/state; never execute installation scripts.
set -euo pipefail
cd "$(dirname "$0")/../.."
source_dir=$PWD
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
export HOME="$tmp/home"
export XDG_CONFIG_HOME="$tmp/config"
export XDG_CACHE_HOME="$tmp/cache"
export XDG_DATA_HOME="$tmp/data"
export CHEZMOI_GIT_NAME=DotfilesTest
export CHEZMOI_GIT_EMAIL=dotfiles-test@example.invalid
mkdir -p "$HOME"
args=(--source "$source_dir" --destination "$HOME" --config "$tmp/chezmoi.toml"
      --cache "$tmp/cache" --persistent-state "$tmp/state.boltdb" --no-tty)

# Generating the config explicitly avoids init creating a Git repository when
# this script runs against the pre-commit hook's exported index.
chezmoi "${args[@]}" execute-template --init --file home/.chezmoi.toml.tmpl > "$tmp/generated.toml"
mv "$tmp/generated.toml" "$tmp/chezmoi.toml"
chezmoi "${args[@]}" apply --dry-run --force > /dev/null

# Syntax-check every package-manager branch, without installing anything.
for manager in apt apk dnf pacman zypper brew nix; do
    chezmoi "${args[@]}" execute-template --override-data "{\"package_manager\":\"$manager\"}" \
        --file home/run_onchange_before_install-packages.sh.tmpl > "$tmp/packages.sh"
    grep -q "Installing packages for $manager" "$tmp/packages.sh"
    bash -n "$tmp/packages.sh"
done

if [[ "${1:-}" == --deploy ]]; then
    chezmoi "${args[@]}" apply --exclude scripts --force
    chezmoi "${args[@]}" managed --include files --path-style relative --nul-path-separator > "$tmp/managed-files"
    node .github/scripts/check-deployment.mjs "$HOME" "$tmp/managed-files"
    chezmoi "${args[@]}" verify --exclude scripts
    chezmoi "${args[@]}" apply --exclude scripts --force
    chezmoi "${args[@]}" verify --exclude scripts
    chezmoi "${args[@]}" diff --exclude scripts > "$tmp/second-apply.diff"
    if [[ -s "$tmp/second-apply.diff" ]]; then
        echo 'Deployment is not idempotent' >&2
        exit 1
    fi
fi

# PowerShell parsing is required in CI, optional for local Linux/macOS checks.
if command -v pwsh >/dev/null 2>&1; then
    mkdir -p "$tmp/powershell"
    while IFS= read -r -d '' file; do
        chezmoi "${args[@]}" execute-template --file "$file" > "$tmp/powershell/$(basename "${file%.tmpl}")"
    done < <(find home -name '*.ps1.tmpl' -print0)
    pwsh -NoProfile -File .github/scripts/check-powershell.ps1 "$tmp/powershell"
elif [[ "${CI:-}" == true ]]; then
    echo 'pwsh is required for CI validation' >&2
    exit 1
fi
echo 'Template validation passed (installation scripts were not executed)'
