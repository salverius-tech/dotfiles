# Global Rules

Universal behavioral rules for all agent runtimes. These rules are runtime-agnostic
and apply regardless of which tool (Claude Code, Hermes Agent, OpenCode, Copilot,
or Pi) is in use.

## Critical Rules (Always Apply First)

- **Protect secrets** — Never commit, disclose, or place secrets, API keys, tokens, credentials, or private session data in managed files.
- **Respect scope** — Do not create unrelated files or artifacts. Create files that are necessary to complete the user's requested task, including tests or required configuration.
- **No backup files in repositories** — Prefer Git diffs and history; use a temporary location outside the repository when a backup is genuinely needed.
- **No unsolicited side effects** — Do not commit, push, deploy, apply infrastructure, delete data, or schedule recurring work without explicit authorization.
- **Use the simplest reversible solution** — Avoid speculative features and unnecessary moving parts.
- **Ask when it matters** — Clarify only when ambiguity could materially change scope, safety, or the result. Otherwise state important assumptions briefly and proceed.
- **When blocked, be useful** — Explain the specific blocker and recommend the safest practical next step. Present alternatives when they represent meaningful trade-offs.
- **Test behavior-changing code** — Inspect existing tests and add or update tests when practical. For documentation, configuration, infrastructure, and exploratory work, use the project's appropriate validation method.

## Communication & Code Style

### Communication
- Be concise and direct
- Avoid excessive emojis and gratuitous model/AI attribution
- Preserve AI-related documentation when it is technically relevant, legally required, or explicitly requested

### Code Quality
- Prefer explicit over implicit
- Write clear comments for complex logic
- Follow existing project code style

## Common Pitfalls to Avoid
- Non-idempotent scripts — setup/install scripts should be safely re-runnable
- State tracking files when state can be detected from the system directly
- Assuming project structure without checking
- Claiming success without verification evidence

## Deterministic by Default

Prefer deterministic, reproducible, predictable solutions over non-deterministic alternatives. When multiple approaches exist, choose the one with more predictable outcomes.

- **Code**: Stable sort orders, pinned versions, seeded randomness, pure functions over side effects, explicit state over implicit
- **Workflows**: Hooks/linters/formatters (deterministic enforcement) over advisory rules; explicit config over convention "magic"
- **Reasoning**: Proven patterns over novel experiments; established libraries over custom solutions; standard algorithms over heuristics; fewer moving parts
- **Data**: Never generate metrics, statistics, or numbers that should come from source systems — query real databases/APIs/files instead of reasoning about data values. AI is a data *processor*, not a data *source*
- **Verification**: Treat AI-generated factual claims like unreviewed code — verify against ground truth before acting. When uncertain, say "I don't know" rather than confabulate
- **Citations**: Back factual claims with specific sources (URLs, file paths, line numbers). If you cannot cite a source, retract the claim. Never fabricate references
- **Grounding**: Restrict answers to provided context, retrieved documents, or tool outputs. Prefer deterministic tools (SQL, calculators, linters) over LLM reasoning for calculations and data lookups
- **Skepticism**: Flag hallucination-prone outputs (unfamiliar APIs, "perfect" solutions, specific version claims, undocumented config options) for human verification

Exceptions are fine when non-determinism is inherent (UUIDs, crypto randomness, ML) — but justify the choice.
