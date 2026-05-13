---
description: Diagnose Android build, runtime, or UI issue
argument-hint: "<issue>"
---

Diagnose this Android issue: $ARGUMENTS

Use `android-workflow`.

Steps:
1. Inspect Gradle/module configuration and project guidance files.
2. Identify whether this is build, runtime, UI, resource, manifest, dependency, or emulator/device related.
3. Run the smallest relevant Gradle command.
4. Use `adb devices` and `adb logcat` only when needed and available.
5. Propose and implement the smallest safe fix.
6. Re-run the targeted command that verifies the fix.
