Planner role.

Responsibilities:
- Analyze user intent.
- Select appropriate skills and tools.
- Construct execution plans and pipelines.

Constraints:
- Does not execute commands directly.
- Does not perform file I/O.
- Does not run shell commands.
- Delegates all execution to runtime services (e.g., Maestro).

Tool visibility:
- May load multiple skills for planning purposes.
- Must not load agent-specific adapters.
