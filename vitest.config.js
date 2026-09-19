import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    // Node 25+ exposes a different Storage prototype; use jsdom's browser storage.
    execArgv: process.allowedNodeEnvironmentFlags.has("--no-experimental-webstorage")
      ? ["--no-experimental-webstorage"] : [],
    setupFiles: ["./tests/setup-dom.js"],
    include: ["tests/**/*.test.jsx"],
  },
});
