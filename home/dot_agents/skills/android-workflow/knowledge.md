The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119.

# Android Projects Workflow

Guidelines for working with Android applications using Gradle, Kotlin or Java, Jetpack libraries, and emulator/device tooling.

## Tool Grid

| Task | Tool | Command |
|------|------|---------|
| Inspect tasks | Gradle wrapper | `./gradlew tasks` |
| Unit tests | Gradle wrapper | `./gradlew test` |
| Lint | Gradle wrapper | `./gradlew lint` |
| Debug build | Gradle wrapper | `./gradlew assembleDebug` |
| Instrumented tests | Gradle wrapper | `./gradlew connectedAndroidTest` |
| Dependency insight | Gradle wrapper | `./gradlew :app:dependencyInsight --dependency <name> --configuration <config>` |
| Device list | adb | `adb devices` |
| Logs | adb | `adb logcat` |

## Project Discovery

Before changing Android code, inspect the project structure:

- `settings.gradle` or `settings.gradle.kts`
- Root `build.gradle` or `build.gradle.kts`
- Module `build.gradle` or `build.gradle.kts`, commonly `app/build.gradle.kts`
- `gradle/libs.versions.toml` when version catalogs are used
- `gradle.properties`
- `AndroidManifest.xml`
- Existing package and source set layout under `src/main`, `src/test`, and `src/androidTest`

MUST use the project's Gradle wrapper (`./gradlew`) when it exists. MUST NOT assume a globally installed `gradle` command.

## Generated Files and Directories

MUST NOT edit generated or build output paths:

- `.gradle/`
- `build/`
- `app/build/`
- `captures/`
- `.idea/` unless the user explicitly asks for IDE metadata changes
- Generated source directories such as `build/generated/`

If a generated file is wrong, change the source configuration that produces it.

## Secrets and Signing Safety

MUST NOT create, edit, or commit signing material or local secrets unless the user explicitly asks and the file is already designed for safe source control.

Treat these as sensitive:

- `*.jks`
- `*.keystore`
- `key.properties`
- `local.properties`
- `google-services.json`
- `GoogleService-Info.plist`
- files containing signing passwords, store passwords, API keys, tokens, or service account data

For Firebase/Google services changes, inspect whether the repository already commits `google-services.json`. If it is absent or ignored, do not add it.

## Kotlin and Java Conventions

- SHOULD prefer Kotlin for new Android code when the project already uses Kotlin.
- SHOULD follow the project's existing package naming and architecture.
- SHOULD prefer immutable values (`val`) over mutable variables (`var`) in Kotlin.
- SHOULD keep Android framework dependencies out of pure domain/business logic where practical.
- MUST keep UI-thread and background-thread behavior explicit.
- MUST handle lifecycle-aware work with appropriate APIs such as `ViewModel`, `viewModelScope`, `repeatOnLifecycle`, or WorkManager depending on context.

## Jetpack Compose

When working in Compose:

- SHOULD keep composables small and focused.
- SHOULD hoist state to the lowest stable owner that needs it.
- SHOULD pass state and events down rather than sharing mutable global state.
- SHOULD use stable keys in lazy lists.
- SHOULD preserve accessibility semantics, labels, roles, and touch target sizes.
- MUST avoid launching side effects directly from composable body; use `LaunchedEffect`, `DisposableEffect`, `rememberCoroutineScope`, or ViewModel logic as appropriate.
- SHOULD preview components when the project already uses previews.

## XML Views and Resources

When working with XML layouts/resources:

- MUST keep resource names consistent with project naming conventions.
- SHOULD avoid hard-coded user-facing strings; use `strings.xml` unless the project convention differs.
- SHOULD avoid hard-coded dimensions; use resource dimensions when the project already does.
- MUST consider night mode, localization, and accessibility when changing UI resources.

## Manifest and Permissions

When editing `AndroidManifest.xml`:

- MUST justify new permissions.
- SHOULD prefer the narrowest permission that satisfies the feature.
- MUST consider runtime permission flows for dangerous permissions.
- MUST verify exported components have explicit `android:exported` where required.
- SHOULD avoid adding broad intent filters unless needed.

## Dependencies and Gradle

- MUST inspect the existing dependency management pattern before adding dependencies.
- SHOULD use version catalogs (`libs.versions.toml`) when the project already uses them.
- SHOULD avoid changing Android Gradle Plugin, Kotlin, Gradle, or compile SDK versions as part of unrelated work.
- MUST keep dependency changes minimal and explain why each new dependency is needed.
- SHOULD run a targeted build or test after Gradle changes.

## Testing Strategy

Prefer the smallest useful feedback loop:

1. Compile or run targeted unit tests when possible.
2. Run module/unit tests with `./gradlew test`.
3. Run lint with `./gradlew lint` for UI, manifest, resource, or dependency changes.
4. Run `./gradlew assembleDebug` when build integration matters.
5. Run `./gradlew connectedAndroidTest` only when an emulator/device is available and the user expects instrumented verification.

For Compose UI tests, prefer stable semantics-based selectors over fragile text or hierarchy-only selectors when possible.

## Debugging

- Use `adb devices` to verify emulator/device availability before device commands.
- Use focused `adb logcat` filters when practical instead of dumping excessive logs.
- Capture the failing command and relevant error lines before editing.
- For build failures, inspect the first meaningful compiler/Gradle error rather than only the final summary.

## Common Commands

```bash
./gradlew test
./gradlew lint
./gradlew assembleDebug
./gradlew connectedAndroidTest
adb devices
adb logcat
```

On Windows Git Bash, keep using the project wrapper command style (`./gradlew`) when it works; otherwise use `./gradlew.bat` only if the shell requires it.
