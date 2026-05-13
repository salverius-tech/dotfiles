import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const destructiveBashPatterns = [
  /\brm\s+-[^\n]*r[^\n]*f\b/,
  /\bgit\s+reset\s+--hard\b/,
  /\bgit\s+clean\s+-[^\n]*[fxd]/,
  /\bsudo\s+(rm|dd|mkfs|shutdown|reboot|poweroff)\b/,
  /\bchmod\s+-R\s+777\b/,
  /\bchown\s+-R\b/,
];

const sensitivePathPatterns = [
  /(^|[\\/])\.env(\.|$)/,
  /(^|[\\/])\.ssh([\\/]|$)/,
  /(^|[\\/])id_(rsa|dsa|ecdsa|ed25519)(\.|$)/,
  /(^|[\\/])\.credentials\.json$/,
  /(^|[\\/])\.pypirc$/,
  /(^|[\\/])pip\.conf$/,
  /(^|[\\/])nuget\.config$/i,
  /(^|[\\/])appsettings\.(production|prod)\.json$/i,
  /(^|[\\/])secrets?\.json$/i,
  /(^|[\\/])key\.properties$/,
  /(^|[\\/])local\.properties$/,
  /(^|[\\/])google-services\.json$/,
  /(^|[\\/])GoogleService-Info\.plist$/,
  /\.(jks|keystore)$/i,
  /(^|[\\/])credentials(\.|$)/i,
  /(^|[\\/])secrets?(\.|$)/i,
];

const generatedPathPatterns = [
  /(^|[\\/])bin([\\/]|$)/,
  /(^|[\\/])obj([\\/]|$)/,
  /(^|[\\/])\.vs([\\/]|$)/,
  /(^|[\\/])\.idea([\\/]|$)/,
  /(^|[\\/])\.gradle([\\/]|$)/,
  /(^|[\\/])build([\\/]|$)/,
  /(^|[\\/])captures([\\/]|$)/,
  /(^|[\\/])\.venv([\\/]|$)/,
  /(^|[\\/])__pycache__([\\/]|$)/,
  /(^|[\\/])\.pytest_cache([\\/]|$)/,
  /(^|[\\/])node_modules([\\/]|$)/,
];

function pathMatchesAny(path: string | undefined, patterns: RegExp[]): boolean {
  if (!path) return false;
  return patterns.some((pattern) => pattern.test(path));
}

export default function damageControl(pi: ExtensionAPI) {
  pi.on("tool_call", async (event, ctx) => {
    if (event.toolName === "bash") {
      const command = String((event.input as { command?: unknown }).command ?? "");
      if (destructiveBashPatterns.some((pattern) => pattern.test(command))) {
        if (!ctx.hasUI) {
          return { block: true, reason: "Blocked potentially destructive shell command in non-interactive mode." };
        }
        const ok = await ctx.ui.confirm("Potentially destructive command", `Allow this command?\n\n${command}`);
        if (!ok) return { block: true, reason: "User rejected potentially destructive shell command." };
      }
    }

    if (["write", "edit"].includes(event.toolName)) {
      const path = String((event.input as { path?: unknown }).path ?? "");
      if (pathMatchesAny(path, sensitivePathPatterns)) {
        return { block: true, reason: `Refusing to modify sensitive path: ${path}` };
      }
      if (pathMatchesAny(path, generatedPathPatterns)) {
        return { block: true, reason: `Refusing to modify generated/dependency path: ${path}` };
      }
    }
  });
}
