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
  /(^|[\\/])credentials(\.|$)/i,
  /(^|[\\/])secrets?(\.|$)/i,
];

function pathLooksSensitive(path: string | undefined): boolean {
  if (!path) return false;
  return sensitivePathPatterns.some((pattern) => pattern.test(path));
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
      if (pathLooksSensitive(path)) {
        return { block: true, reason: `Refusing to modify sensitive path: ${path}` };
      }
    }
  });
}
