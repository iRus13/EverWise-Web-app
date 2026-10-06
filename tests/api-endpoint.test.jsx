import {afterEach, expect, test, vi} from "vitest";
const platform = vi.hoisted(() => ({native: true}));
vi.mock("@capacitor/core", () => ({Capacitor: {isNativePlatform: () => platform.native}}));
afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); platform.native = true; });
test.each(["", "http://example.com", "https://user:password@example.com", "https://example.com/path", "https://example.com?token=secret", "javascript:alert(1)"])("native endpoint rejects unsafe or malformed origin %s", async (origin) => {
  vi.stubEnv("VITE_EVERWISE_API_URL", origin);
  const {apiEndpoint} = await import("../src/utils/apiEndpoint.js");
  expect(apiEndpoint("/api/check-message")).toBe("/api/check-message");
});
test("native HTTPS API preserves the request path without exposing credentials", async () => {
  vi.stubEnv("VITE_EVERWISE_API_URL", "https://api.example.com/");
  const {apiEndpoint} = await import("../src/utils/apiEndpoint.js");
  expect(apiEndpoint("api/check-message")).toBe("https://api.example.com/api/check-message");
});
test("web development retains local API origins", async () => {
  platform.native = false;
  vi.stubEnv("VITE_EVERWISE_API_URL", "http://127.0.0.1:8787");
  const {apiEndpoint} = await import("../src/utils/apiEndpoint.js");
  expect(apiEndpoint("api/check-message")).toBe("http://127.0.0.1:8787/api/check-message");
});
