#!/bin/bash
# Verify internal documentation links

set -e

echo "Checking documentation links..."

# Simple link checker using grep and sed
for file in README.md CLAUDE.md home/dot_claude/commands/README.md; do
    if [ -f "$file" ]; then
        # Extract markdown links [text](url)
        grep -oE '\[([^]]+)\]\(([^)]+)\)' "$file" | while read -r match; do
            # Extract URL from (url)
            url=$(echo "$match" | sed 's/.*\](\([^)]*\)).*/\1/')
            
            # Skip external URLs and anchors
            case "$url" in
                http*) continue ;;
                \#*) continue ;;
            esac
            
            # Check if file/directory exists
            if [ ! -f "$url" ] && [ ! -d "$url" ]; then
                echo "Broken link in $file: $url"
                exit 1
            fi
        done
    fi
done

echo "All documentation links valid"
