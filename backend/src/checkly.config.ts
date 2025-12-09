import { defineConfig } from "checkly";
import { Frequency } from "checkly/constructs";

export default defineConfig({
  projectName: "API Monitoring",
  logicalId: "api-monitoring-1",
  repoUrl: "https://github.com/Zaagsystem/restuarant-server",
  checks: {
    activated: true,
    muted: false,
    runtimeId: "2022.10",
    frequency: Frequency.EVERY_5M,
    locations: ["ap-south-1"],
    tags: ["api", "monitoring"],
    checkMatch: "**/__checks__/**/*.check.ts",
    ignoreDirectoriesMatch: ["node_modules", "dist"],
    browserChecks: {
      frequency: Frequency.EVERY_10M,
      testMatch: "",
    },
  },
  cli: {
    runLocation: "ap-south-1",
  },
});
