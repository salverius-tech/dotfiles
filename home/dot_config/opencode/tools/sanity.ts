// ~/.config/opencode/tools/sanity.ts
import { tool } from "@opencode-ai/plugin";

export const ping = tool({
  description: "Sanity check tool",
  execute() {
    return "ok";
  },
});
