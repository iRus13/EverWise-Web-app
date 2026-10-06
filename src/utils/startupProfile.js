import { readWithDeadline } from "./readWithDeadline.js";

export function readStartupProfile(read, timeoutMs = 15_000) {
  return readWithDeadline(read, { timeoutMs, message: "Account profile read timed out" });
}
