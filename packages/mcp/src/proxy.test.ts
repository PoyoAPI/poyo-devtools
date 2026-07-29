import {describe, expect, it} from "vitest";
import {remoteUrl} from "./proxy.js";

describe("remoteUrl", () => {
  it("applies category and model filters", () => {
    expect(remoteUrl({url: "https://example.test/mcp", categories: "image"}).searchParams.get("categories")).toBe("image");
    expect(remoteUrl({url: "https://example.test/mcp", models: "foo/bar"}).searchParams.get("models")).toBe("foo/bar");
  });
  it("rejects mixed filters", () => {
    expect(() => remoteUrl({categories: "image", models: "foo"})).toThrow(/either categories or models/i);
  });
});
