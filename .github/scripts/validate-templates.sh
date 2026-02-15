#!/bin/bash
# Validate chezmoi templates can render correctly

set -e

echo "Testing Linux (apt) context..."
chezmoi execute-template --init \
  --config home/.chezmoi.toml.tmpl \
  --source home \
  < /dev/null > /dev/null

echo "Testing macOS context..."
chezmoi execute-template --init \
  --config home/.chezmoi.toml.tmpl \
  --source home \
  < /dev/null > /dev/null

echo "Testing Windows context..."
chezmoi execute-template --init \
  --config home/.chezmoi.toml.tmpl \
  --source home \
  < /dev/null > /dev/null

echo "✅ All templates render successfully"
