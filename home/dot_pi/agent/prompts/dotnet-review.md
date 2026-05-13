---
description: Review .NET/C# changes for correctness, style, and test coverage
argument-hint: "[focus]"
---

Review the current .NET/C# changes.

Focus: $ARGUMENTS

Use `csharp-workflow` when needed.

Check:
- Nullable reference type correctness
- Async/await misuse
- LINQ inefficiencies
- Dependency injection lifetime issues
- EF Core migration or query risks if applicable
- API contract changes
- Test coverage
- Formatting and analyzer issues

Inspect relevant diffs before making recommendations or changes.
