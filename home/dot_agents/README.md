# .agents/ — Unified Agent Intelligence System

This directory is the canonical source of truth for all agent‑related logic on this machine.
It provides a clean, deterministic, vendor‑agnostic foundation for multi‑agent orchestration, tool execution, and role‑based behavior.

The goal of this system is to ensure:

- Predictable agent behavior
- Strict separation of concerns
- Reproducible configuration across machines
- Minimal context footprint for each agent
- Clean integration with OpenCode, Claude, Copilot, Pi, and future runtimes

Nothing inside this directory is automatically loaded by any agent.
All loading is explicit and role‑based.

## Directory Structure

```
~/.agents/
├── roles/
├── skills/
├── adapters/
├── intents/
├── runtime/
├── docs/
└── README.md
```

Each directory has a specific, non‑overlapping purpose.

### roles/ — Behavioral Contracts

Each subdirectory defines a single agent role.

Example:

```
roles/
  planner/
    role.md
    tools/
  coder/
    role.md
    tools/
  researcher/
    role.md
    tools/
```

**Contents:**

- `role.md` — the behavioral contract (purpose, boundaries, allowed tools)
- `tools/` — symlinks or references to the skills this role is allowed to use

**Rules:**

- Roles must not contain tool implementations
- Roles must not contain environment variable logic
- Roles define what an agent does, not how tools work

### skills/ — Tool Definitions

Each subdirectory defines a reusable skill (tool).

Example:

```
skills/
  maestro/
  filesystem/
  embeddings/
  vectorstore/
```

**Contents:**

- `skill.ts` or `skill.json` — the tool definition
- `README.md` — description, API, and usage
- Optional helper files

**Rules:**

- Skills must be agent‑agnostic
- Skills must not reference roles
- Skills must not access environment variables at module load time
- Skills must declare required environment variables in their description
- Skills must use the modern OpenCode tool API (`input`, `execute`)

### adapters/ — Agent‑Specific Glue

Adapters connect roles + skills to specific runtimes.

Example:

```
adapters/
  opencode/
  claude/
  copilot/
  pi/
```

**Contents:**

- Environment variable bindings
- Tool registration logic
- Runtime‑specific quirks

**Rules:**

- Adapters must not contain tool definitions
- Adapters must not contain role instructions
- Adapters must not contain business logic
- Adapters load only the tools required by the runtime

### intents/ — Optional Intent Schemas

This directory contains high‑level intent definitions used by planners or classifiers.

Example:

```
intents/
  classify.json
  routing.json
```

**Rules:**

- Intents describe what the user wants
- Intents must not contain tool logic
- Intents must not contain role behavior

### runtime/ — Execution Artifacts

This directory stores ephemeral or generated data.

Example:

```
runtime/
  logs/
  cache/
  pipelines/
```

**Rules:**

- Nothing in this directory is committed to version control
- Nothing in this directory is agent‑facing
- This directory may be safely cleared at any time

### docs/ — Human‑Readable Documentation

This directory contains architectural documentation, migration notes, and design decisions.

Example:

```
docs/
  architecture.md
  migrations.md
  roles.md
  skills.md
```

**Rules:**

- Documentation only
- No executable code
- No secrets

## Environment Variables

Tools may require environment variables (e.g., Maestro).
These must be set outside the `.agents` directory (e.g., via shell, system settings, or dotfiles templates).

Tools must declare required variables in their description:

```
Requires MAESTRO_URL and MAESTRO_API_KEY to be set in the environment.
```

Tools must resolve environment variables inside their `execute()` function.

## Design Principles

**Explicit loading:**
Nothing auto‑loads. Roles explicitly load only the tools they need.

**Strict separation of concerns:**

- Roles = behavior
- Skills = tools
- Adapters = runtime glue
- Intents = classification
- Runtime = ephemeral state

**Deterministic behavior:**
Each agent sees only the instructions and tools intended for its role.

**Vendor‑agnostic:**
The system works across OpenCode, Claude, Copilot, Pi, and future runtimes.

**Reproducible:**
The same `.agents` directory works identically across machines.

## Migration Notes

All legacy agent instructions (e.g., `.claude`, `.opencode/commands`) should be migrated here.

- Skills should be moved into `skills/` and referenced by roles.
- Adapters should load tools from `skills/` and roles from `roles/`.
- Environment variables should be set outside this directory.

See `docs/migrations.md` for detailed steps.

## Status

This directory is the authoritative home for:

- Agent roles
- Tool definitions
- Adapters
- Intents
- Runtime artifacts
- Documentation

All future agent‑related development must occur here.
