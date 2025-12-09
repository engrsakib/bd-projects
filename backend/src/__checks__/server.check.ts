import { ApiCheck, AssertionBuilder, Frequency } from "checkly/constructs";

const serverStatusCheck = new ApiCheck("server-status-check", {
  name: "Server Status Health Check",
  locations: ["ap-south-1"],
  frequency: Frequency.EVERY_2M,
  request: {
    method: "GET",
    url: "http://localhost:5005/health-check",
    assertions: [AssertionBuilder.statusCode().equals(200)],
  },
});
