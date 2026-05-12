---
description: Review and improve agent rules/instructions for clarity and low context overhead
argument-hint: "[file-or-scope]"
---

Review the agent ruleset or instructions for: $ARGUMENTS

Analyze for:
- Contradictions or duplicate rules
- Rules that are too vague to follow
- Excessive context footprint
- Missing tool-use guidance
- Missing safety/security constraints
- Opportunities to split global, adapter-specific, and project-specific rules

Produce concrete edits or a proposed replacement. Preserve important intent while making the rules more deterministic and concise.
