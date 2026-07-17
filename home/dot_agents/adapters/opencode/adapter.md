# OpenCode Adapter

How OpenCode connects to the shared `.agents/` knowledge base.

## Bootstrap chain

1. `~/.config/opencode/AGENTS.md` — OpenCode's global entrypoint.
2. `~/.agents/global/rules.md` — runtime-neutral behavioral rules.
3. This file — OpenCode-specific discovery, tools, and integration guidance.

## Skill discovery

OpenCode may discover skills from these locations, depending on its configuration:

1. `.opencode/skills/` — project-local
2. `~/.config/opencode/skills/` — user-global
3. `.claude/skills/` — Claude compatibility paths
4. `~/.agents/skills/` — shared portable skills
5. `~/.agents/adapters/opencode/skills/` — OpenCode-specific loaders

Use the paths supported by the installed OpenCode version. Do not assume a loader
is active merely because it exists in the repository; verify the configured
instructions and skill search paths.

## OpenCode resources

- `~/.config/opencode/AGENTS.md` — global OpenCode instructions
- `~/.config/opencode/agents/` — global agent definitions
- `.opencode/agents/` — project agent definitions
- `~/.opencode/commands/` — global commands, when configured
- `~/.config/opencode/tools/` — custom tool plugins
- `~/.agents/skills/` — shared portable skill knowledge

OpenCode reads `AGENTS.md` as its primary instruction format. It may also read
Claude-compatible paths unless `OPENCODE_DISABLE_CLAUDE_CODE=1` is set.

## Tool and workflow guidance

- Prefer OpenCode-native file and search tools for inspection and targeted edits.
- Use shell commands for execution, project-provided tooling, and operations that
  require a shell.
- Run independent read-only work in parallel when the runtime supports it.
- Keep dependent operations sequential and avoid concurrent mutations to the same
  files unless ownership is explicit.
- Use subagents for isolated or parallel work, not as a default for every task.
- Verify outputs with real tool results before reporting success.

## Maestro integration

This repository contains OpenCode-specific Maestro contracts and tool integration
under the adapter's `maestro/` resources when deployed. Tool names and available
capabilities are runtime- and server-dependent. Check the active manifest or
`/capabilities` response rather than assuming a fixed tool count or permission set.
Scoped API keys may expose fewer capabilities.

When using Maestro:

- use canonical `maestro_` tool names;
- treat shell, Docker, memory, and other privileged capabilities as server-controlled;
- do not treat an installed integration as proof that its runtime service is loaded;
- verify the tool, gateway/plugin state, and any companion service separately.

## Configuration and model selection

Use the configured provider and model defaults unless the user explicitly requests
otherwise. Select capability or reasoning effort according to task risk and ease of
verification; do not hard-code Opus/Sonnet/Haiku, GPT, or other vendor tiers into
shared workflow instructions.
