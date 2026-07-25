# Encyclopedia of Agentic Coding Patterns: Review for Hermes Skills

- Source: https://aipatternbook.com/
- Reviewed: 2026-07-25
- Purpose: identify durable, high-leverage workflows that should become Hermes skills or improvements to existing skills
- Scope: the public encyclopedia structure, introduction/methodology material, and representative entries in the agent-construction, testing, operations, security, and governance sections

## Executive conclusion

The Encyclopedia of Agentic Coding Patterns is most useful as a vocabulary and pattern catalog for building reliable agent workflows. It should not be translated mechanically into hundreds of skills. The site itself argues for progressive disclosure, context discipline, measurement, and deletion; those principles apply to the skill library too.

The best repository-level outcome is a small set of composable skills that enforce complete workflows:

1. Research, Plan, Implement for non-trivial repository changes.
2. Verification Loop for evidence-backed implementation and debugging.
3. Skill Fitness for measuring, versioning, and pruning skills.
4. Incident-to-Eval Synthesis for converting real failures into regression coverage.
5. Bounded Autonomy and approval calibration for safe delegation.
6. Context Engineering and Progressive Disclosure as design rules for all future skills.

Several of these ideas already exist in local form. The goal should be to sharpen and connect them, not create duplicates with new names.

## What the site is

The landing page presents the work as an encyclopedia of self-contained entries rather than a sequential course. At the reviewed snapshot it reported:

- 304 articles
- 223 patterns
- 21 antipatterns
- 60 concepts
- 14 broad sections

The sections move from product judgment and intent through architecture, data, computation, testing, security, human-facing software, operations, socio-technical systems, design heuristics, agentic construction, and agent governance.

This organization is valuable for skill design because it separates concerns that are often collapsed into one oversized coding prompt:

- What should be built?
- What exactly is in scope?
- How should the system be shaped?
- What is the source of truth?
- How will correctness be established?
- What can go wrong or be attacked?
- How will the change ship and evolve?
- What autonomy and feedback boundaries are appropriate?

The site is also explicitly living content. Its methodology page describes an automated loop that researches, writes, edits, reorganizes, evaluates, deploys, and revises the encyclopedia. That makes it a useful case study in agentic content operations, but it also means claims and counts can change. This document records a review snapshot, not a permanent transcription.

## Review method and evidence limits

I inspected the live table of contents and landing page, then read the full main content of representative entries covering:

- Methodology and Meta Report
- Context Engineering
- Codebase Map
- Progressive Disclosure
- Research, Plan, Implement
- Verification Loop
- Worktree Isolation
- Background Agent
- Externalized State
- Orchestrator-Workers
- Bounded Autonomy
- Agent Provenance
- Approval Fatigue
- Incident-to-Eval Synthesis
- Harness Engineering
- Skill Fitness
- AI Smell
- Jagged Frontier
- Prompt Caching
- Steering Loop
- AgentOps

The site contains empirical and comparative claims, including claims attributed to studies and vendor reports. I treat those as claims made by the encyclopedia unless independently verified; they are useful signals for prioritization but should not be copied into a skill as settled fact without checking the underlying source.

## Core ideas worth carrying into Hermes

### 1. The harness is the product surface

The Harness Engineering entry makes a strong practical point: reliable agent behavior depends not only on model selection, but on the configuration around the model. Instruction files, tools, MCP servers, skills, subagents, hooks, and approval policy form an engineered surface.

This maps directly to this repository. `home/dot_hermes/` already manages identity, Hermes-native skills, and bundles. The repo should treat those files as runtime engineering artifacts, with explicit triggers, scopes, verification rules, and maintenance expectations.

Implication: a skill should change agent behavior in a checkable way. Generic advice such as “be careful” or “be thorough” is not enough.

### 2. Context is finite and must be designed

Context Engineering frames agent reliability as a signal-to-noise problem. Its four operations are:

- Write durable context into instruction files, plans, memory, or artifacts.
- Select only the relevant files, symbols, tests, and references.
- Compress resolved history while preserving decisions and state.
- Isolate unrelated work in separate tasks, sessions, or subagents.

Progressive Disclosure turns that into a three-tier loading model:

- A small always-visible index that supports classification.
- A body loaded only when the task matches.
- Supplemental scripts, examples, and references loaded only when needed.

This is especially relevant to Hermes skills. A skill description is not marketing copy; it is a classifier hint. The body should contain the workflow that changes behavior, while bulky examples and reference material should be linked or externalized.

Implication for this repo: avoid a single “do everything safely” skill. Keep descriptions narrowly triggerable and compose skills through bundles when a workflow genuinely needs several capabilities.

### 3. Research must be separated from planning and implementation

Research, Plan, Implement (RPI) is the most directly actionable pattern for repository work. It creates three gates:

1. Research: document what exists, how it connects, what tests cover it, and what assumptions remain. Do not propose changes yet.
2. Plan: turn approved understanding into scoped tasks, success criteria, dependencies, and risks.
3. Implement: execute the approved plan, verify each step, and surface deviations instead of silently improvising.

The key value is making the agent’s mental model reviewable before its solution is accepted. A plan built on a wrong repository map can be polished and still wrong.

Implication for this repo: this should become a dedicated skill or a focused extension to the existing repository workflow. The user profile already favors written plans and dedicated branches for substantial work, so RPI is aligned with established operating preferences rather than being a new burden.

### 4. Verification is a loop, not a final sentence

Verification Loop describes the minimum reliable cycle:

1. Change.
2. Run the narrowest relevant tests, checks, or inspection.
3. Read and classify the result.
4. Correct the change and repeat.

The site emphasizes graduated checks: fast deterministic checks first, then broader integration or manual checks. It also warns that agent-generated tests can agree with incorrect implementation, so existing tests, independent oracles, and manual inspection remain important.

Steering Loop generalizes this as Act → Sense → Decide → Adjust with explicit stopping conditions. Useful controls include a maximum iteration count, progress detection, thrash detection, and escalation when the same failure persists.

Implication for this repo: every implementation skill should define its verification loop and stop conditions. “Run tests” is weaker than naming the command, expected evidence, failure-handling behavior, and completion gate.

### 5. Externalize state before context makes it necessary

Externalized State recommends writing plans, progress markers, and intermediate artifacts to inspectable files. This makes work resumable, reviewable, and shareable across sessions and agents.

The practical pattern is simple:

- Create a plan file for multi-step work.
- Mark each step pending, active, or complete.
- Record failures and deviations where they occur.
- Save intermediate research and generated artifacts instead of holding them only in the context window.

Implication for this repo: plan files under `.hermes/plans/` or an explicitly requested review document are preferable to relying on hidden conversation state. This also supports the repository’s preference for truthful status summaries backed by files and command output.

### 6. Isolation makes parallelism reviewable

Worktree Isolation recommends a separate Git worktree and branch for every concurrent agent or for an agent working while a human continues in the main checkout. Integration then happens through ordinary review and merge boundaries.

Background Agent adds the operating contract: a concrete task, explicit boundary, isolated environment, required verification, and required return artifact. Background work is not trusted work; it is less visible work that must return stronger evidence.

Orchestrator-Workers describes a coordinator that dynamically decomposes a goal, dispatches focused workers, and synthesizes their results. It is distinct from fixed parallelization because the orchestrator determines the subtasks from the request.

Implication for this repo: use isolation for parallel implementation, keep worker prompts narrow, and require verifiable artifacts such as a branch, patch, report, test result, or explicit failure report. Do not treat a confident summary as evidence.

### 7. Autonomy should follow consequence and reversibility

Bounded Autonomy proposes graduated action tiers:

- Full autonomy for low-consequence, reversible actions such as reading, searching, formatting, and running tests.
- Act and notify for reversible work such as writing files, creating branches, installing dependencies, or running builds.
- Propose and wait for high-consequence actions such as shared configuration changes, public API restructuring, or staging deployment.
- Human only for actions such as production pushes, destructive infrastructure changes, access-control changes, or regulated sensitive-data handling.

The important qualifier is that the tier depends on context and blast radius. The same action can be low-risk in a disposable development environment and high-risk in production.

Approval Fatigue is the corresponding antipattern. If every harmless action requires approval, humans start rubber-stamping the consequential ones. Batch review of a coherent diff, automated evaluation, and calibrated autonomy produce fewer but more meaningful human decisions.

Implication for this repo: local skills should explicitly distinguish inspect-only, reversible write, shared-state, and destructive/release actions. This reinforces the existing safe-repository rules: no commit, push, reset, clean, or history rewrite without explicit authorization.

### 8. Skills are dependencies and must earn their context cost

Skill Fitness is the most important pattern for the requested skill-oriented review. It rejects the assumption that a growing skill library automatically creates more capability. A skill consumes context and can be stale, redundant, or actively harmful.

Its proposed disciplines are:

- Scope: load only when the task matches.
- Version: record the project, framework, or convention context in which the guidance is valid.
- Measure lift: compare representative tasks with and without the skill using a real oracle.
- Delete non-paying skills: zero lift is still a context cost.
- Re-measure on a cadence and after relevant project changes.

This is a direct warning against turning the encyclopedia’s 300-plus entries into 300-plus Hermes skills. The repository should prefer a small number of high-fitness workflows over broad topical coverage.

### 9. Convert incidents into permanent evaluation cases

Incident-to-Eval Synthesis describes a two-part incident fix:

1. Repair the underlying failure pattern.
2. Encode the reproduced incident as a permanent eval and wire it into the relevant evaluation gate.

The eval should be added while the reproduction is still fresh. The article also recommends tracking incident-derived evals as a maturity signal, while avoiding overfitting the entire suite to historical incidents.

Implication for this repo: when a Hermes workflow causes a real failure, update the relevant skill and add a regression check or fixture where practical. A lesson that exists only in a postmortem or memory is vulnerable to prompt, model, and project changes.

### 10. Provenance and live operations complete the lifecycle

Agent Provenance recommends recording the agent, model, harness, instruction revision, permission mode, tools, and human prompt at artifact creation time. The goal is debugging and auditability, not blame.

AgentOps extends ordinary observability with agent-specific signals:

- Trajectory: ordered tool calls and results.
- Cost: tokens, cached tokens, tool invocations, and model versions.
- Quality: sampled evaluation and first-pass acceptance.
- Autonomy compliance: whether actions stayed within policy.

Implication for this repo: skills that schedule or delegate work should require a durable return artifact and enough metadata to explain what was changed and how it was verified. Do not add secrets or private transcripts to the repository; record safe identifiers and evidence only.

### 11. Use vocabulary to trigger scrutiny, not suspicion

AI Smell is a useful review concept. It names output that looks optimized for plausibility rather than understanding: nonexistent identifiers, decorative symmetry, unsupported references, or error handling that merely appears complete. It is not proof of incorrectness.

Jagged Frontier explains why confidence is a poor proxy for reliability. Agent capability is uneven; a model can succeed at a seemingly difficult task and fail at a simpler neighboring one. The correct response is empirical probing and verification, not blanket trust or blanket distrust.

Implication for this repo: reviews should identify the concrete smell and the check it triggers. For example, “plausible reference” should trigger a lookup against the actual repository or official documentation, not a vague statement that AI output is risky.

## Skill candidates for this repository

### Priority 1: Research, Plan, Implement

Trigger: non-trivial repository changes, unfamiliar code, architecture changes, or work where a wrong assumption is expensive.

Expected behavior:

- Inspect guidance, status, manifests, relevant symbols, callers, tests, and constraints.
- Write a research artifact without proposing changes.
- Pause for review or explicit approval when the task warrants it.
- Produce a scoped implementation plan with completion criteria.
- Implement only against the approved plan; report deviations.
- Finish through the Verification Loop.

Relationship to existing skills: extend `safe-repository-workflow`; do not duplicate its status and no-destructive-side-effect rules.

### Priority 1: Verification Loop

Trigger: implementing, debugging, refactoring, changing configuration, or claiming completion.

Expected behavior:

- Select the fastest meaningful check first.
- Read actual output rather than inferring success.
- Classify failures as code, test, environment, baseline, or scope problems.
- Iterate with a bounded retry budget.
- Stop and escalate on repeated non-progress or a missing oracle.
- Report commands, results, remaining risks, and unverified areas.

Relationship to existing skills: complements `plugin-runtime-verification`, `safe-repository-workflow`, and `evidence-based-research`.

### Priority 1: Skill Fitness

Trigger: creating, reviewing, updating, or pruning Hermes skills and bundles.

Expected behavior:

- Define a precise trigger and non-trigger.
- Identify the context and version assumptions.
- Specify the behavior change and measurable oracle.
- Compare representative work with and without the skill when feasible.
- Record lift, stale assumptions, and known limitations.
- Delete or narrow skills that do not pay for their token cost.

This is the clearest net-new skill suggested by the book because the existing repository has skill authoring conventions, but not a documented fitness and retirement workflow.

### Priority 2: Incident-to-Eval Synthesis

Trigger: a verified bug, failed automation, unsafe agent action, regression, or production incident involving an agent workflow.

Expected behavior:

- Preserve a minimal safe reproduction.
- Fix the underlying class of failure.
- Add a regression test, fixture, eval, or documented verification case.
- Run it through the relevant gate.
- Update the skill or instruction that permitted the failure.

This could initially be a section in `Verification Loop` rather than a separate skill.

### Priority 2: Context Engineering for Hermes Skills

Trigger: authoring or restructuring skills, bundles, instruction files, or references.

Expected behavior:

- Keep descriptions classifier-friendly and short.
- Put always-needed rules in the skill body.
- Move bulky examples and branch-specific details to references.
- Prefer tool-assisted retrieval over repository-wide context dumps.
- Avoid duplicate or contradictory instructions.

This should probably be guidance in the existing skill-authoring workflow, not another always-loaded skill.

### Priority 3: Bounded Autonomy and Delegation Safety

Trigger: background agents, scheduled work, subagents, plugins, external services, or actions with shared-state or destructive consequences.

Expected behavior:

- Classify actions by reversibility and blast radius.
- Isolate concurrent work.
- Require a return artifact and verification evidence.
- Batch low-risk review and reserve interruption for consequential decisions.
- Escalate production, credentials, access control, destructive changes, and regulated data.

This could be folded into `scheduled-task-authoring`, `hermes-operations`, and `safe-repository-workflow` rather than added as a standalone skill.

## Recommended repository shape

Do not create one directory per encyclopedia article. A practical progression is:

1. Strengthen `home/dot_hermes/skills/safe-repository-workflow/SKILL.md` with RPI, isolation, and bounded-action tiers.
2. Add a focused verification workflow if the existing plugin-specific skill is too narrow.
3. Add `home/dot_hermes/skills/skill-fitness/SKILL.md` as the first new skill, because it governs the growth of the library itself.
4. Add incident-derived eval guidance to verification or skill fitness.
5. Use bundles to compose development, operations, and automation workflows rather than making a monolithic universal skill.

A candidate skill should not be added merely because the book names a pattern. It should be added only when all of these are true:

- The pattern recurs in this environment.
- It changes agent behavior beyond general competence.
- Its trigger can be stated precisely.
- Its completion criteria can be verified.
- It does not duplicate a current skill.
- Its maintenance and retirement path are clear.

## Gaps and cautions

### The encyclopedia is broad, not Hermes-specific

Many entries describe general software engineering, product strategy, or organizational design. They are useful mental models, but they should not become Hermes skills unless they translate into a concrete agent procedure.

### The pattern names are not always prescriptions

A pattern can be appropriate in one context and harmful in another. For example, parallelization requires independent tasks and worktree isolation; otherwise it increases coordination cost and conflict risk. Bounded autonomy depends on blast radius, not on a fixed global allow-list.

### Empirical claims need source-level verification

The site reports studies, vendor results, and internal comparisons. Before using a number in a skill or policy, locate and verify the underlying source. Skills should encode durable procedures, not fragile statistics.

### More governance can become bureaucracy

RPI, approval tiers, provenance, evals, and progress artifacts all have costs. Apply the lightest process that protects the risk at hand. A five-line documentation edit should not require a full research gate; an access-control or release change should not skip one.

### Do not use AI smell as an authorship detector

The useful response to a smell is targeted verification. Style markers may suggest model authorship but do not establish correctness or wrongdoing.

### The site itself demonstrates the need for fitness

A self-updating encyclopedia can grow faster than a team can validate every entry. That makes the book valuable as a source of hypotheses, but not as an authority that every named pattern deserves implementation.

## Suggested implementation backlog

1. Audit current Hermes skills for duplicate instructions, broad triggers, stale version assumptions, and missing verification criteria.
2. Add RPI and Verification Loop behavior to the repository’s development workflow, preserving existing safe-repository constraints.
3. Create a skill-fitness ledger or lightweight evaluation convention: target task, with-skill result, without-skill result, oracle, date, and version assumptions.
4. Add incident-to-eval guidance to the workflow used after failures.
5. Review scheduled and delegated work against the five-part background-agent contract: task, boundary, environment, verification, return artifact.
6. Revisit the library after those changes and remove skills that are redundant or unmeasured.

## Source map

Primary source pages reviewed:

- https://aipatternbook.com/
- https://aipatternbook.com/methodology/
- https://aipatternbook.com/meta-report/
- https://aipatternbook.com/context-engineering/
- https://aipatternbook.com/codebase-map/
- https://aipatternbook.com/progressive-disclosure/
- https://aipatternbook.com/research-plan-implement/
- https://aipatternbook.com/verification-loop/
- https://aipatternbook.com/worktree-isolation/
- https://aipatternbook.com/background-agent/
- https://aipatternbook.com/externalized-state/
- https://aipatternbook.com/orchestrator-workers/
- https://aipatternbook.com/bounded-autonomy/
- https://aipatternbook.com/agent-provenance/
- https://aipatternbook.com/approval-fatigue/
- https://aipatternbook.com/incident-to-eval-synthesis/
- https://aipatternbook.com/harness-engineering/
- https://aipatternbook.com/skill/
- https://aipatternbook.com/skill-fitness/
- https://aipatternbook.com/ai-smell/
- https://aipatternbook.com/jagged-frontier/
- https://aipatternbook.com/prompt-caching/
- https://aipatternbook.com/steering-loop/
- https://aipatternbook.com/agentops/

This review intentionally summarizes and applies the source material rather than reproducing the encyclopedia’s articles. The live site remains the authoritative source for the current wording and article relationships.
