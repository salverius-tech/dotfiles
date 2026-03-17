# Agent System Architecture

## Overview

The `.agents/` directory provides a unified, vendor-agnostic knowledge base for multiple
agent runtimes (Claude Code, OpenCode, GitHub Copilot). Knowledge is authored once as
portable `knowledge.md` files and loaded by each runtime through thin adapter loaders.

## Directory Structure

```
~/.agents/
├── global/
│   └── rules.md                    Universal behavioral rules
├── skills/                         Portable knowledge (51 skills)
│   ├── git-workflow/
│   │   ├── knowledge.md            Canonical knowledge (runtime-agnostic)
│   │   └── README.md               Skill documentation
│   ├── python-workflow/
│   └── ...
├── adapters/                       Runtime-specific integration
│   ├── claude/
│   │   ├── adapter.md              Claude bootstrap + tool preferences
│   │   ├── README.md
│   │   └── skills/                 51 Claude thin loaders (SKILL.md)
│   ├── opencode/
│   │   ├── adapter.md              OpenCode bootstrap + skill discovery
│   │   ├── README.md
│   │   ├── skills/                 51 OpenCode thin loaders (SKILL.md)
│   │   ├── maestro/                Maestro tool contract + checks
│   │   └── planner.json            Role-adapter binding
│   └── copilot/
│       ├── adapter.md              Copilot limitations + per-project setup
│       └── skills/                 2 Copilot-specific loaders
├── roles/                          Behavioral contracts
│   ├── coding/role.md
│   ├── planner/role.md
│   └── research/role.md
├── docs/
│   └── architecture.md             This file
├── manifest.json                   Version + global rules pointer
└── README.md                       Authoritative architecture rules
```

## Knowledge Flow

```
knowledge.md (portable, single source)
    │
    ├── adapters/claude/skills/*/SKILL.md    → Claude Code
    ├── adapters/opencode/skills/*/SKILL.md  → OpenCode
    └── adapters/copilot/skills/*/SKILL.md   → Copilot (where applicable)
```

Each thin loader is a ~6-10 line SKILL.md containing:
1. YAML frontmatter (name, description)
2. A "Read" instruction pointing to the canonical `knowledge.md`
3. Optional runtime-specific notes

## Bootstrap Chains

### Claude Code
```
~/.claude/CLAUDE.md
  → reads ~/.agents/global/rules.md
  → reads ~/.agents/adapters/claude/adapter.md
  → Claude discovers skills at ~/.agents/adapters/claude/skills/*/SKILL.md
  → Each SKILL.md reads ~/.agents/skills/*/knowledge.md
```

### OpenCode
```
~/.config/opencode/AGENTS.md
  → reads ~/.agents/global/rules.md
  → reads ~/.agents/adapters/opencode/adapter.md
  → OpenCode discovers skills at ~/.agents/adapters/opencode/skills/*/SKILL.md
  → Each SKILL.md reads ~/.agents/skills/*/knowledge.md
```

### GitHub Copilot
```
.github/copilot-instructions.md (per-project, manually maintained)
  → May inline content from ~/.agents/skills/*/knowledge.md
  → No global bootstrap (Copilot limitation)
```

## Design Principles

**Single source of truth:** Each skill has exactly one `knowledge.md`. Runtime adapters
point to it but never redefine the content.

**Explicit loading:** Nothing auto-loads from `.agents/`. All loading happens through
adapter thin loaders or explicit "Read" instructions in bootstrap files.

**Strict separation of concerns:**
- `global/` — Universal rules (shared across all runtimes)
- `skills/` — Portable knowledge (runtime-agnostic)
- `adapters/` — Runtime-specific glue (thin loaders, tool configs)
- `roles/` — Behavioral contracts (what an agent does)

**Path disambiguation:** Thin loaders include the note "the path is `~/.agents`, not
`~/.claude`" because models tend to substitute `.claude` due to training data bias.

## Components

### Global Rules (`global/rules.md`)
Universal behavioral rules extracted from runtime-specific configs. Covers security,
communication style, code quality, determinism, and common pitfalls. Imported by every
runtime's bootstrap file.

### Skills (`skills/*/knowledge.md`)
51 portable skills covering workflows (git, python, typescript, etc.), frameworks
(React, Django, Rails, etc.), and cross-cutting concerns (testing, documentation,
security). Each skill directory contains:
- `knowledge.md` — The canonical knowledge content
- `README.md` — Skill documentation and metadata
- Optional assets (templates, resources)

### Adapters (`adapters/*/`)
Three vendor adapters:
- **Claude** — 51 thin loaders + 5 Claude-only skills in `~/.claude/skills/`
- **OpenCode** — 51 thin loaders + Maestro integration + planner config
- **Copilot** — 2 thin loaders + per-project template approach

### Roles (`roles/*/role.md`)
Behavioral contracts defining agent personas (coding, planner, research).
Roles reference skills but don't contain tool implementations.

### Manifest (`manifest.json`)
Version tracking and global rules pointer for the `.agents/` system.
