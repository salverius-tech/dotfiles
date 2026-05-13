import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

type ProjectSignal = {
  name: string;
  skills: string[];
  guidance: string;
};

const ignoredDirs = new Set([
  ".git",
  ".gradle",
  ".idea",
  ".venv",
  ".vs",
  "bin",
  "build",
  "node_modules",
  "obj",
  "__pycache__",
]);

function hasFile(cwd: string, names: string[]): boolean {
  return names.some((name) => existsSync(join(cwd, name)));
}

function hasMatchingFile(cwd: string, matcher: (name: string, fullPath: string) => boolean, depth = 3): boolean {
  const visit = (dir: string, remainingDepth: number): boolean => {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return false;
    }

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      if (matcher(entry, fullPath)) return true;

      if (remainingDepth <= 0 || ignoredDirs.has(entry)) continue;

      let isDirectory = false;
      try {
        isDirectory = statSync(fullPath).isDirectory();
      } catch {
        continue;
      }

      if (isDirectory && visit(fullPath, remainingDepth - 1)) return true;
    }

    return false;
  };

  return visit(cwd, depth);
}

function detectProject(cwd: string): ProjectSignal[] {
  const signals: ProjectSignal[] = [];

  const hasDotnet = hasMatchingFile(cwd, (name) => name.endsWith(".sln") || name.endsWith(".csproj"), 2);
  const hasBlazor = hasMatchingFile(
    cwd,
    (name) => name.endsWith(".razor") || name === "_Imports.razor" || name === "App.razor",
    4,
  );
  const hasPython = hasFile(cwd, ["pyproject.toml", "requirements.txt", "requirements-dev.txt", "setup.py", "tox.ini"]);
  const hasAndroidGradle = hasFile(cwd, ["settings.gradle", "settings.gradle.kts"]);
  const hasAndroidManifest = hasMatchingFile(cwd, (name) => name === "AndroidManifest.xml", 4);

  if (hasDotnet) {
    signals.push({
      name: ".NET/C#",
      skills: ["csharp-workflow", "testing-workflow"],
      guidance: "For .NET/C# changes, load csharp-workflow; prefer dotnet restore/build/test/format and avoid bin/ and obj/.",
    });
  }

  if (hasBlazor) {
    signals.push({
      name: "Blazor",
      skills: ["blazor-expert", "playwright-blazor", "csharp-workflow"],
      guidance:
        "For Blazor components, load blazor-expert; consider state ownership, parameters, validation, accessibility, rendering, and UI test coverage.",
    });
  }

  if (hasPython) {
    signals.push({
      name: "Python",
      skills: ["python-workflow", "python-testing", "testing-workflow"],
      guidance: "For Python changes, load python-workflow; inspect pyproject.toml and use the project package/test runner such as uv run pytest when configured.",
    });
  }

  if (hasAndroidGradle && hasAndroidManifest) {
    signals.push({
      name: "Android",
      skills: ["android-workflow", "testing-workflow"],
      guidance:
        "For Android changes, load android-workflow; use ./gradlew, avoid build/.gradle outputs, and protect signing files, local.properties, and Google service config.",
    });
  }

  return signals;
}

function statusText(signals: ProjectSignal[]): string {
  if (signals.length === 0) return "Project: generic";
  return `Project: ${signals.map((signal) => signal.name).join(" + ")}`;
}

export default function projectDetector(pi: ExtensionAPI) {
  pi.on("session_start", async (_event, ctx) => {
    if (!ctx.hasUI) return;
    ctx.ui.setStatus("project", statusText(detectProject(ctx.cwd)));
  });

  pi.on("before_agent_start", async (event, ctx) => {
    const signals = detectProject(ctx.cwd);
    if (ctx.hasUI) ctx.ui.setStatus("project", statusText(signals));
    if (signals.length === 0) return;

    const skills = Array.from(new Set(signals.flatMap((signal) => signal.skills))).join(", ");
    const guidance = signals.map((signal) => `- ${signal.guidance}`).join("\n");

    return {
      systemPrompt: `${event.systemPrompt}\n\nDetected project workflow hints:\n- Suggested skills: ${skills}\n${guidance}`,
    };
  });
}
