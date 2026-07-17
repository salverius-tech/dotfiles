---
name: hermes-operations
description: Operate, configure, diagnose, and verify Hermes Agent installations. Use when the user asks about Hermes models, tools, skills, plugins, profiles, configuration, gateways, updates, or runtime health.
---

# Hermes Operations

Use the Hermes CLI and authoritative Hermes documentation to inspect or change the
Hermes installation. Prefer the smallest reversible change and verify each runtime
state independently.

## State model

Distinguish these states:

- installed: files exist on disk;
- enabled: configuration allows the feature;
- loaded: the running process imported or registered it;
- ready: the advertised tool, endpoint, or gateway responds;
- verified: a harmless end-to-end operation succeeds.

Never infer a later state from an earlier one.

## Discovery and diagnosis

Run the narrowest relevant command first:

```bash
hermes doctor
hermes config check
hermes config show
hermes model
hermes tools
hermes skills list
hermes plugins list
hermes gateway status
```

Do not print credentials, tokens, auth files, or private memory. When configuration
is unclear, inspect the documented schema and the active profile before changing it.

## Model and tool changes

Prefer the configured provider and model defaults. Do not hard-code vendor tiers in
instructions. Enable only the toolsets required for the task. After changing model
or tool configuration, run a harmless normal chat or tool listing before claiming
that the runtime is healthy.

## Updates and profiles

Use `hermes update` only with explicit user authorization. Profiles have separate
configuration, memory, sessions, skills, and gateway state; verify the active
profile before inspecting or modifying it.

## Documentation

Use https://hermes-agent.nousresearch.com/docs as the source of truth for commands,
configuration keys, toolsets, skills, plugins, and gateway behavior. If local
behavior differs from documentation, report the observed command output and avoid
inventing configuration keys.
