import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Compare two strings without leaking length or contents through timing.
 * Both values are hashed to a fixed-size digest before `timingSafeEqual`.
 */
export function timingSafeStringEqual(provided: string, expected: string) {
  const key = "cheflucas-secret-compare";
  const left = createHmac("sha256", key).update(provided, "utf8").digest();
  const right = createHmac("sha256", key).update(expected, "utf8").digest();
  return timingSafeEqual(left, right);
}
