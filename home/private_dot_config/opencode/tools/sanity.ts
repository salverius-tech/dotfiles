// ~/.config/opencode/tools/sanity.ts
import { tool } from "@opencode-ai/plugin";

const z = tool.schema;

export const sanity_ping = tool({
  description: "Sanity check tool",
  args: {},
  async execute(_args, _context) {
    return "ok";
  },
});
