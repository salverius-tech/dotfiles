import { tool } from "@opencode/toolkit";

export default tool({
  name: "maestro",
  description: "Dry-run planner interface for Maestro pipelines",
  input: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["plan"],
      },
      pipeline: {
        type: "string",
      },
    },
    required: ["action", "pipeline"],
  },
  async run({ action, pipeline }) {
    if (action !== "plan") {
      throw new Error("Only dry-run planning is supported");
    }

    return {
      steps: ["Validate pipeline intent", "Resolve target directory", "Construct shell command"],
      command: "ls ~",
      note: "Dry-run only. No execution performed.",
    };
  },
});
