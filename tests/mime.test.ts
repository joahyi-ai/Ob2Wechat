import { describe, expect, it } from "vitest";
import { imageMimeFromPath, normalizeImageMime } from "../src/media/mime";

describe("image MIME detection", () => {
  it("detects common image extensions with query strings", () => {
    expect(imageMimeFromPath("photo.JPG?size=large")).toBe("image/jpeg");
    expect(imageMimeFromPath("diagram.svg#view")).toBe("image/svg+xml");
    expect(imageMimeFromPath("cover.webp")).toBe("image/webp");
  });

  it("prefers valid response content types", () => {
    expect(normalizeImageMime("image/png; charset=binary", "unknown.bin")).toBe("image/png");
    expect(normalizeImageMime("text/plain", "photo.gif")).toBe("image/gif");
  });
});
