const { tool } = require("@opencode/toolkit");

module.exports = tool({
  name: "maestro",
  description: "Dry-run planner interface for Maestro pipelines",
  input: {
    type: "object",
    properties: {
      action: { type: "string" },
      pipeline: { type: "string" },
    },
    required: ["action", "pipeline"],
  },
  async run({ action, pipeline }) {
    return {
      note: "Maestro tool loaded successfully",
      action,
      pipeline,
    };
  },
});
