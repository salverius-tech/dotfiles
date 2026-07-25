---
name: scheduled-task-authoring
description: Design and verify Hermes cron jobs and recurring automation. Use when creating, editing, reviewing, pausing, or debugging scheduled Hermes tasks.
---

# Scheduled Task Authoring

Hermes cron jobs run in fresh sessions without the current conversation. Make every
scheduled prompt self-contained.

## Before creating a job

Define:

- exact task and output format;
- working directory or project context;
- required tools and skills;
- schedule and timezone assumptions;
- delivery target or intentional local-only storage;
- retry, idempotency, and failure behavior;
- secrets and credentials required at runtime.

A cron task cannot ask the user a clarification question. Resolve required inputs
before scheduling it.

For unattended or background work, define the full operating contract:

- **Task:** one concrete outcome, not a broad improvement goal;
- **Boundary:** allowed files, services, commands, and risk level;
- **Environment:** isolated worktree, branch, container, or working directory;
- **Verification:** exact checks required before returning;
- **Return artifact:** report, patch, branch, draft PR, reproduction, or explicit
  failure report containing files, checks, failures, and remaining risks.

## Bounded autonomy

Classify actions by consequence, reversibility, and blast radius rather than treating
all actions uniformly:

- **Autonomous:** read-only inspection, search, formatting, and local tests.
- **Act and notify:** reversible file writes, branches, dependency installs, and
  local builds.
- **Propose and wait:** shared configuration, public API changes, staging deploys,
  migrations, or other hard-to-reverse actions.
- **Human only:** production destruction or release, access-control changes,
  credential handling, regulated sensitive data, and equivalent high-risk actions.

Batch coherent review where possible. Requiring approval for every harmless action
creates approval fatigue and makes consequential approvals less attentive.

## Safety

Do not create recurring jobs, fan-out delivery, or external side effects without
explicit authorization. Never put tokens or credentials in the prompt. Use the
runtime's credential and environment mechanisms.

## Verification

Start with a one-shot run or `hermes cron` inspection before making a job recurring.
Verify the saved job, the most recent run, its output, and its delivery target. Keep
scheduled prompts from recursively creating more scheduled jobs.

When reporting status, distinguish saved, running, completed, failed, and delivered.
For recurring work, also verify idempotency, retry behavior, and that a failed run
cannot silently produce a false success report.
