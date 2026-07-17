---
name: plugin-runtime-verification
description: Install, inspect, enable, load, and verify Hermes plugins and companion services. Use when a Hermes plugin, bridge, gateway integration, or plugin-provided tool is missing or unreliable.
---

# Plugin Runtime Verification

Treat the plugin package, the running Hermes gateway, and any companion service as
separate layers.

## Installation and loading

1. Inspect supported installer options with `hermes plugins --help`.
2. Install or update only with explicit authorization.
3. Verify installed source and enabled state with:

```bash
hermes plugins list --plain --no-bundled
```

4. Inspect the installed `plugin.yaml` and package files under the active Hermes
   home. Do not assume the clone path or plugin name.
5. Restart the gateway from a separate operator shell when required.
6. Verify runtime loading independently with:

```bash
HERMES_PLUGINS_DEBUG=1 hermes tools list
```

Look for the advertised tool, plugin-load messages, and any documented socket or
health endpoint.

## Companion services

A plugin installer does not automatically provision a repository's HTTP API,
Uvicorn process, systemd unit, dependencies, or mobile bridge. Verify each of
these separately. Check listener state, unauthenticated health, authenticated
Diagnostics, service identity, and fresh process/timestamp after a restart without
printing credentials.

## Failure diagnosis

An enabled plugin may still fail during import or registration. Capture the actual
loader traceback before theorizing. For namespace-loaded directory plugins, sibling
imports generally need package-relative form. Check runtime directory ownership and
socket-parent permissions for bridge processes.

## Safety and reporting

Do not bypass Hermes restart safety guards from inside the gateway process tree.
Report installed, enabled, loaded, bridge-ready, and API-ready states separately.
Never claim a plugin is active solely because it appears in an enabled listing.
