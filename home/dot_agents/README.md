# ~/.agents - Agent Configuration Root

This directory is the root for agent roles, skills, adapters, and runtime configurations.

## Structure

- **roles/** - Agent role definitions (planner, coding, research, etc.)
- **skills/** - Specialized skills (e.g., Maestro)
- **adapters/** - AI assistant adapters (Claude, OpenCode, etc.)
- **intents/** - High-level task definitions
- **runtime/** - Execution environment (pipelines, loaders)
- **docs/** - Architecture and documentation

## Purpose

This directory provides a vendor-agnostic foundation for AI agent configuration. It allows multiple AI assistants to share common roles and skills while maintaining clean separation between different agent types.

## Design Goals

- **Discoverable**: Clear directory structure makes AI instructions easy to find
- **Composable**: Roles and skills can be combined flexibly
- **Agnostic**: Works with any AI assistant that reads markdown
- **Minimal**: Only load what's explicitly requested

## Not Automatic

Agents must NOT automatically load everything under ~/.agents. This structure is for curated, role-based loading only. Individual agents choose which roles, skills, and adapters to activate.
