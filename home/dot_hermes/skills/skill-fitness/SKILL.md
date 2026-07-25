---
name: skill-fitness
description: Use when creating, reviewing, measuring, updating, or pruning Hermes skills and bundles.
---

# Skill Fitness

Treat each skill as a context dependency that must earn and retain its place. A skill
should change agent behavior in a repeatable way, apply only to work it can help, and
remain aligned with the project and tool versions it describes.

## When to use

Use this skill when:

- creating a new Hermes skill or bundle;
- reviewing whether an existing skill is useful, stale, redundant, or harmful;
- changing a skill's trigger, instructions, references, or version assumptions;
- deciding whether a skill should be narrowed, merged, deprecated, or removed.

Do not use it for ordinary task execution merely because a task happens to load a
skill. Use the workflow skill relevant to the task instead.

## Fitness workflow

### 1. Define the contract

State the target behavior in one sentence. Then record:

- precise trigger conditions;
- explicit non-triggers;
- expected behavior change;
- likely users, repositories, or environments;
- related skills and bundles that may overlap.

If the trigger cannot be stated precisely, narrow the proposed skill before writing
it. A broad description that loads everywhere is a context tax.

### 2. Inspect the current library

Read neighboring skills and bundles before adding anything. Search for duplicated
rules, overlapping triggers, contradictory safety guidance, and existing verification
procedures. Prefer extending one authoritative skill over creating a second source of
truth.

For in-repository skills, verify the target path is under `home/dot_hermes/skills/`
and that runtime state is not being added to the repository.

### 3. Record version assumptions

Identify the project, framework, CLI, platform, or convention the skill describes.
Record assumptions that can make the guidance stale. Examples include:

- Hermes command or configuration behavior;
- chezmoi layout or validation commands;
- a project test command or package-manager convention;
- a versioned API, schema, or deployment process.

When a dependency or convention changes, re-check the skill rather than assuming its
previous guidance remains correct.

### 4. Choose an oracle

Use the strongest available evidence for the target behavior:

- an existing test, linter, type checker, or validation script;
- a repeatable command with a defined expected result;
- a documented runtime discovery or health check;
- a human review rubric when no automation can judge the outcome.

Do not claim a skill has lift because its prose looks useful. If there is no credible
oracle, state that limitation and use a narrower qualitative review until one exists.

### 5. Measure marginal lift when practical

For a representative task, compare the same task with and without the skill while
holding the repository, task input, model, and relevant tools as stable as practical.
Score both runs with the same oracle. Record:

```text
skill: <name>
skill version: <version or commit context>
target task: <representative task>
project/version context: <context>
oracle: <tests, checks, or rubric>
with skill: <observed result>
without skill: <observed result>
observed lift: <difference, or not measured>
limitations: <coverage and confounders>
reviewed: <YYYY-MM-DD>
remeasure when: <dependency, convention, or workflow change>
```

A flat result is evidence to narrow, merge, or retire the skill; it is not proof that
the skill can never help on an untested long tail. A negative result is a regression
signal and should be investigated before the skill remains shared.

### 6. Maintain or retire

Keep a skill when its trigger is precise, its guidance is current, and evidence shows
that it improves or protects the target workflow. Otherwise choose the smallest safe
change:

1. narrow the trigger if it loads too broadly;
2. remove duplicated or stale instructions;
3. update version-specific guidance and re-measure;
4. merge it into a better authoritative skill;
5. remove it when it has no defensible return.

Do not preserve a skill solely because it took effort to write. Deletion is a valid
maintenance result.

## Progressive disclosure rules

- Keep the description classifier-friendly and put the trigger early.
- Keep always-needed behavior in `SKILL.md`.
- Move large examples, schemas, scripts, and branch-specific references into linked
  files that load only when needed.
- Prefer tool-assisted inspection over dumping an entire repository into context.
- Keep each rule in one authoritative location; do not repeat universal safety prose
  across every skill.

## Common pitfalls

1. **Advice mistaken for evidence:** “This reads well” is not a lift measurement.
2. **Unscoped loading:** A skill that applies to every prompt must justify its cost.
3. **Silent staleness:** Version assumptions are not rechecked after project changes.
4. **Weak oracle:** A generated output and its generated test can agree while both are
   wrong. Anchor evaluation in independent checks where possible.
5. **Library sediment:** Adding skills without retiring dead ones makes discovery and
   context quality worse.
6. **False precision:** Do not invent percentages or benchmark results when the task
   has not been measured.

## Verification checklist

- [ ] The skill has a precise trigger and explicit non-trigger.
- [ ] Neighboring skills and bundles were inspected for overlap.
- [ ] Version and environment assumptions are documented.
- [ ] Expected behavior change is concrete and checkable.
- [ ] A real oracle is named, or the lack of one is explicit.
- [ ] With-skill/without-skill measurement is recorded when feasible.
- [ ] The skill body is progressively disclosed and free of duplicate no-op prose.
- [ ] The final decision is keep, narrow, update, merge, or remove, with rationale.
