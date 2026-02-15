#!/bin/bash
# Verify internal documentation links

set -e

echo "Checking documentation links..."

# Check for broken internal links in markdown files
for file in README.md CLAUDE.md home/dot_claude/commands/README.md; do
    if [ -f "$file" ]; then
        while IFS= read -r line; do
            if [[ "$line" =~ \]\(([^)]+)\) ]]; then
                target="${BASH_REMATCH[1]}"
                # Skip external URLs and anchors
                [[ "$target" == http* ]] && continue
                [[ "$target" == \#* ]] && continue
                
                if [ ! -f "$target" ] && [ ! -d "$target" ]; then
                    echo "❌ Broken link in $file: $target"
                    exit 1
                fi
            fi
        done < "$file"
    fi
done

echo "✅ All documentation links valid"
