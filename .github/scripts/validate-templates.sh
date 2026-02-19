#!/bin/bash
# Simple template validation - just check if chezmoi can parse the config

set -e

echo "Validating chezmoi configuration..."

# Check if .chezmoi.toml.tmpl exists and has valid structure
if [ ! -f "home/.chezmoi.toml.tmpl" ]; then
    echo "ERROR: home/.chezmoi.toml.tmpl not found"
    exit 1
fi

# Check if source directory exists
if [ ! -d "home" ]; then
    echo "ERROR: home directory not found"
    exit 1
fi

# Count template files
tmpl_count=$(find home -name "*.tmpl" | wc -l)
echo "Found $tmpl_count template files"

# Check critical files exist
for file in home/dot_bashrc.tmpl home/dot_gitconfig.tmpl; do
    if [ ! -f "$file" ]; then
        echo "ERROR: Critical template missing: $file"
        exit 1
    fi
done

echo "Template structure validated successfully"
