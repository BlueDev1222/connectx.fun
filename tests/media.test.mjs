import { test } from "node:test";
import assert from "node:assert/strict";
import { validateMedia, MAX_MEDIA_BYTES } from "../src/lib/media-validation.ts";
test("uploads reject spoofed MIME, extension mismatches and oversized content", () => {
  const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);
  assert.equal(validateMedia(png, "image/png", "build.png"), "png");
  assert.throws(() => validateMedia(png, "image/jpeg", "build.jpg"));
  assert.throws(() => validateMedia(png, "image/png", "build.html"));
  assert.throws(() =>
    validateMedia(
      new Uint8Array(MAX_MEDIA_BYTES + 1),
      "image/png",
      "build.png",
    ),
  );
  assert.throws(() =>
    validateMedia(
      new TextEncoder().encode("<script>alert(1)</script>"),
      "image/png",
      "build.png",
    ),
  );
});
