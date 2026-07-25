# Agentic Skill Workflows Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Turn the aipatternbook review into a small, composable, measurable Hermes workflow system without creating one skill per encyclopedia article.

**Architecture:** Strengthen the existing repository-safety workflow with Research → Plan → Implement and Verification Loop behavior. Add one new `skill-fitness` skill for skill-library governance. Extend scheduled automation guidance with bounded-autonomy and background-agent contracts. Compose the result through existing bundles and a focused skill-governance bundle. Defer runtime-level provenance, AgentOps instrumentation, and automated lift measurement until a concrete runtime or evaluation harness exists.

**Tech Stack:** Markdown Hermes skills, YAML skill bundles, chezmoi-managed source files, Makefile validation, `hermes skills check`/`audit` when available.

---

## Current context and constraints

- Repository: `C:\Dev\dotfiles`, a chezmoi-managed cross-platform dotfiles repository.
- Hermes source tree: `home/dot_hermes/`.
- Existing relevant skills:
  - `home/dot_hermes/skills/safe-repository-workflow/SKILL.md`
  - `home/dot_hermes/skills/evidence-based-research/SKILL.md`
  - `home/dot_hermes/skills/scheduled-task-authoring/SKILL.md`
  - `home/dot_hermes/skills/plugin-runtime-verification/SKILL.md`
  - `home/dot_hermes/skills/hermes-operations/SKILL.md`
  - `home/dot_hermes/skills/dotfiles-maintenance/SKILL.md`
- Existing bundles:
  - `home/dot_hermes/skill-bundles/development.yaml`
  - `home/dot_hermes/skill-bundles/automation.yaml`
  - `home/dot_hermes/skill-bundles/hermes-ops.yaml`
  - `home/dot_hermes/skill-bundles/dotfiles-maintenance.yaml`
- The review artifact is currently untracked at `home/dot_hermes/AI_PATTERN_BOOK_REVIEW.md`; preserve it and include it in the eventual implementation branch.
- Do not commit, push, deploy, or apply chezmoi as part of planning. Implementation must start from a dedicated non-`main` branch.
- Do not manage secrets, auth files, session databases, runtime caches, or credentials.

## Scope decisions

### In scope for the first implementation wave

1. Add a focused `skill-fitness` skill.
2. Extend `safe-repository-workflow` with RPI, Verification Loop, bounded retry/escalation, and isolation guidance.
3. Extend `scheduled-task-authoring` with the five-part background-agent contract and consequence-based autonomy tiers.
4. Add a `skill-governance` bundle that composes skill fitness with evidence-based research.
5. Update Hermes documentation to expose the new workflow and explain when to use it.
6. Validate frontmatter, bundle references, documentation links, templates, secrets, and existing repository checks.

### Explicitly deferred

- Runtime provenance capture for model, prompt, toolset, permission mode, and artifact authorship.
- Full AgentOps tracing, cost/quality dashboards, and production feedback sensors.
- Automated with-skill/without-skill benchmark execution. The first wave should define the measurement contract and ledger format, but not invent a fake oracle.
- A separate skill for every book pattern, including worktree isolation, AI smell, prompt caching, and orchestration. These remain guidance within the workflows until repeated repository use proves a separate skill is warranted.

## Implementation sequence

### Task 1: Create the implementation branch and establish the baseline

**Objective:** Ensure all implementation work is isolated from `main` and begins from a recorded clean verification baseline.

**Files:**
- No source files should change in this task.

**Steps:**

1. Confirm the current branch and status with `git status --short --branch`.
2. Create a dedicated branch for this work, for example `feat/agentic-skill-workflows`.
3. Ensure the existing review document remains present and is intentionally included in the branch.
4. Run `make test` and record the baseline result in the implementation session or plan handoff.

**Completion criteria:** The implementation branch is not `main`, the review document is preserved, and the baseline command result is known before edits begin.

### Task 2: Define the `skill-fitness` skill contract

**Objective:** Add a reusable workflow for deciding whether a Hermes skill deserves to exist, remain enabled, or be retired.

**Files:**
- Create: `home/dot_hermes/skills/skill-fitness/SKILL.md`

**Required content:**

- Frontmatter matching repository skill conventions.
- Trigger focused on creating, reviewing, updating, versioning, measuring, or pruning Hermes skills and bundles.
- Non-triggers for ordinary task execution where skill governance is not the user’s goal.
- A compact process covering:
  - define trigger and non-trigger;
  - identify context/version assumptions;
  - state the behavior change;
  - choose a real oracle and representative task;
  - compare with-skill and without-skill behavior when feasible;
  - record evidence, limitations, and re-measurement conditions;
  - narrow, update, or remove skills that do not pay for context cost.
- A lightweight measurement record format, such as:
  - skill name/version;
  - target task;
  - repository/project version;
  - oracle/checks used;
  - with-skill result;
  - without-skill result;
  - observed lift or regression;
  - date and follow-up trigger.
- Explicit warnings that a skill can be stale, redundant, or harmful; “it reads well” is not evidence.
- Verification checklist for frontmatter, trigger specificity, duplication, version assumptions, and evidence.

**Completion criteria:** The skill is independently actionable, does not duplicate `evidence-based-research`, and makes retirement/narrowing a first-class outcome.

### Task 3: Strengthen `safe-repository-workflow` with RPI and Verification Loop

**Objective:** Make the repository’s primary coding workflow enforce understanding before planning and evidence before completion.

**Files:**
- Modify: `home/dot_hermes/skills/safe-repository-workflow/SKILL.md`

**Required changes:**

1. Add a “When to use Research → Plan → Implement” section for non-trivial or unfamiliar work.
2. Define the three phases:
   - Research documents facts, symbols, callers, tests, constraints, and unknowns without proposing edits.
   - Plan records scope, files, dependencies, success criteria, risks, and deviations to report.
   - Implement follows the approved plan and stops when the repository contradicts the research.
3. Add an explicit Verification Loop:
   - change;
   - run the narrowest meaningful check;
   - inspect actual output;
   - classify failure;
   - correct and repeat with a bounded retry budget.
4. Require escalation for repeated non-progress, missing test oracles, baseline failures, destructive scope, or unverified claims.
5. Add worktree isolation guidance for concurrent agents or human/agent parallel work.
6. Preserve all existing safety rules around commits, pushes, resets, cleans, history rewrites, secrets, generated outputs, and deployment.
7. Include a final evidence report checklist: files changed, commands run, real results, residual risks, and unverified layers.

**Completion criteria:** The skill changes agent behavior beyond “inspect and test,” while preserving the current no-unauthorized-Git-side-effects contract.

### Task 4: Extend scheduled automation with bounded autonomy

**Objective:** Make unattended Hermes jobs and background work return bounded, reviewable, verifiable artifacts.

**Files:**
- Modify: `home/dot_hermes/skills/scheduled-task-authoring/SKILL.md`

**Required changes:**

1. Add the five-part background-agent contract:
   - concrete task;
   - explicit boundary;
   - isolated environment or working directory;
   - required verification;
   - required return artifact.
2. Add consequence/reversibility tiers:
   - autonomous for read-only and low-risk reversible work;
   - act-and-notify for ordinary reversible writes;
   - propose-and-wait for shared, high-consequence, or hard-to-reverse actions;
   - human-only for production destruction, access control, credentials, regulated data, or equivalent risk.
3. State that scheduled tasks cannot ask clarifying questions and must resolve required inputs before scheduling.
4. Require idempotency and retry behavior for recurring work.
5. Distinguish saved, running, completed, failed, and delivered states in verification reports.
6. Add approval-fatigue guidance: batch coherent review and avoid approval gates for harmless repetitive actions.

**Completion criteria:** A future scheduled-task author can determine what may run unattended, what must stop for review, and what evidence must be returned.

### Task 5: Add the skill-governance bundle

**Objective:** Provide a discoverable composition for maintaining the Hermes skill library.

**Files:**
- Create: `home/dot_hermes/skill-bundles/skill-governance.yaml`
- Modify: `home/dot_hermes/README.md`

**Bundle requirements:**

- Name: `skill-governance`.
- Description: audit, measure, update, and prune Hermes skills safely.
- Skills:
  - `skill-fitness`
  - `evidence-based-research`
- Instruction should require authoritative source inspection, explicit evidence, no fabricated lift, and safe handling of stale or redundant skills.

**README requirements:**

- Add the new bundle to the available bundle list.
- Add `skill-fitness` to the skills overview.
- Explain that the repository intentionally favors a small set of high-fitness workflows over broad article-to-skill conversion.
- Preserve the existing distinction between source-managed configuration and runtime state.

**Completion criteria:** The bundle references only repository-managed skills, appears in the README, and can be inspected with the documented Hermes bundle commands after deployment.

### Task 6: Review overlap and tighten progressive disclosure

**Objective:** Remove duplicated or overly broad instructions introduced by the new workflows.

**Files:**
- Review and modify only if necessary:
  - `home/dot_hermes/skills/evidence-based-research/SKILL.md`
  - `home/dot_hermes/skills/dotfiles-maintenance/SKILL.md`
  - `home/dot_hermes/skills/hermes-operations/SKILL.md`
  - `home/dot_hermes/skills/plugin-runtime-verification/SKILL.md`
  - `home/dot_hermes/skill-bundles/development.yaml`
  - `home/dot_hermes/skill-bundles/automation.yaml`
  - `home/dot_hermes/skill-bundles/hermes-ops.yaml`
  - `home/dot_hermes/skill-bundles/dotfiles-maintenance.yaml`

**Review rules:**

- Keep each rule in one authoritative skill where possible.
- Do not make every bundle load every new skill.
- Keep ordinary development focused on repository work; use `skill-governance` only for skill-library work.
- Keep plugin runtime verification focused on installed/enabled/loaded/ready evidence rather than duplicating general verification prose.
- Ensure descriptions identify precise triggers within the visible prefix.

**Completion criteria:** No contradictory instructions, redundant universal checklists, or broad always-loaded guidance is introduced.

### Task 7: Validate skill and bundle structure

**Objective:** Catch format, naming, reference, and documentation errors before runtime deployment.

**Files:**
- No new source changes unless validation reveals a defect.

**Checks:**

1. Parse every changed `SKILL.md` frontmatter as YAML.
2. Confirm frontmatter starts at byte zero, includes `name` and `description`, and has non-empty body.
3. Confirm names are lowercase/hyphenated and descriptions are within the repository’s skill-authoring constraints.
4. Confirm every bundle skill reference resolves to a managed skill directory.
5. Run `hermes skills check` and `hermes skills audit` if the current environment provides them.
6. Inspect the final diff and verify only intended Hermes source files changed.

**Completion criteria:** All changed skill and bundle files pass structural checks, or any unavailable runtime command is explicitly reported rather than assumed successful.

### Task 8: Run repository verification and deployment preview

**Objective:** Prove the implementation is compatible with the dotfiles repository and can be safely deployed later.

**Files:**
- No source changes expected.

**Commands:**

```bash
make test
make all
chezmoi diff
```

If the environment supports it, additionally run:

```bash
chezmoi execute-template < home/dot_hermes/skills/skill-fitness/SKILL.md
hermes skills list
hermes bundles list
hermes bundles show skill-governance
```

**Verification requirements:**

- Shell linting, template validation, secret scanning, and documentation-link checks pass.
- `chezmoi diff` shows only intended managed files and no runtime-state files.
- Skill and bundle discovery is verified separately from source-file presence.
- Any missing prerequisite or baseline failure is reported with command output and not relabeled as an implementation failure.

**Completion criteria:** The changed source is validated and a deployment preview has been inspected without applying it.

### Task 9: Evaluate the first wave and capture follow-up work

**Objective:** Decide whether the new workflows have enough fitness to keep and identify evidence-backed follow-ups.

**Files:**
- Candidate follow-up artifacts only; do not add speculative runtime infrastructure.

**Steps:**

1. Select one representative repository-change task and one skill-maintenance task.
2. Exercise the relevant workflows and record whether they caused the intended behavior: research before proposal, bounded verification, explicit evidence, and safe escalation.
3. Record friction and false positives.
4. Decide whether any skill should be narrowed, merged, or removed.
5. Create follow-up issues or a later plan for incident-derived evals only when a real failure or missing oracle exists.

**Completion criteria:** Each first-wave skill has a concrete observed-use review and a stated next measurement or retirement decision; no claimed lift is invented without a real oracle.

## Expected changed-file summary

First-wave implementation should normally touch:

- `home/dot_hermes/skills/skill-fitness/SKILL.md` (new)
- `home/dot_hermes/skills/safe-repository-workflow/SKILL.md`
- `home/dot_hermes/skills/scheduled-task-authoring/SKILL.md`
- `home/dot_hermes/skill-bundles/skill-governance.yaml` (new)
- `home/dot_hermes/README.md`
- `home/dot_hermes/AI_PATTERN_BOOK_REVIEW.md` (the existing review artifact, if it is being included on the implementation branch)

Other skill and bundle files should change only if the overlap review identifies a concrete contradiction or duplicate.

## Risks and tradeoffs

- **Process overhead:** RPI and extra verification can slow trivial edits. Use the trigger boundary and keep lightweight tasks on the existing short path.
- **False measurement confidence:** with/without comparisons are only as good as their oracle and representative task. Record limitations and do not treat a flat benchmark as proof of universal uselessness.
- **Skill sediment:** adding rules without pruning can increase context cost. Prefer replacing duplicated prose over appending it.
- **Branch and worktree complexity:** isolation improves safety for parallel work but adds integration effort. Use it when tasks overlap or run concurrently, not for every one-file edit.
- **Runtime mismatch:** source files can exist without being deployed or discovered. Keep source validation, chezmoi preview, and runtime discovery as separate checks.
- **Unverified book claims:** use the reviewed site as a source of patterns and hypotheses; independently verify external statistics before encoding them as policy.

## Final acceptance checklist

- [ ] Implementation occurred on a dedicated non-`main` branch.
- [ ] `skill-fitness` has precise triggers, a measurable evidence contract, and retirement guidance.
- [ ] Repository workflow includes RPI, Verification Loop, bounded retry, escalation, and isolation guidance.
- [ ] Scheduled automation includes task/boundary/environment/verification/artifact requirements and autonomy tiers.
- [ ] `skill-governance` bundle references valid managed skills and is documented.
- [ ] Existing skills do not contain contradictory or duplicated universal rules.
- [ ] Changed skill frontmatter and bundle references validate.
- [ ] `make test` passes.
- [ ] `make all` passes.
- [ ] `chezmoi diff` has been inspected and no deployment was performed without authorization.
- [ ] Runtime discovery is verified where available; unavailable checks are explicitly reported.
- [ ] No secrets, credentials, runtime state, or generated caches were added.
- [ ] Final report lists exact files, verification commands/results, residual risks, and deferred work.
