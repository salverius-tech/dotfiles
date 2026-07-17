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

## Safety

Do not create recurring jobs, fan-out delivery, or external side effects without
explicit authorization. Never put tokens or credentials in the prompt. Use the
runtime's credential and environment mechanisms.

## Verification

Start with a one-shot run or `hermes cron` inspection before making a job recurring.
Verify the saved job, the most recent run, its output, and its delivery target. Keep
scheduled prompts from recursively creating more scheduled jobs.

When reporting status, distinguish saved, running, completed, failed, and delivered.
