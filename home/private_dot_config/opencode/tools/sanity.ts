// ~/.config/opencode/tools/sanity.ts
import { tool } from "@opencode-ai/plugin";
import { z } from "zod";

export const sanity_ping = tool({
  description: "Sanity check tool",
  args: z.object({}),
  async execute(_args, _context) {
    return "ok";
  },
});
