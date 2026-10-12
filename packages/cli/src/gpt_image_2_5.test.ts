import {readFileSync} from "node:fs";
import {describe, expect, it} from "vitest";
import type {Capability} from "@poyoapi/core";
import {buildInput} from "./input.js";

const catalog = JSON.parse(readFileSync(new URL("../../../artifacts/capability-catalog.json", import.meta.url), "utf8"));

describe.each(["flare", "sunburst"])("GPT Image 2.5 %s CLI inputs", (variant) => {
  const id = `gpt-image-2.5-${variant}`;
  const capability = catalog.items.find((item: Capability) => item.model_id === id) as Capability;

  it("discovers public flags and preserves user input without adding defaults", async () => {
    expect(capability).toBeDefined();
    await expect(buildInput(capability, {prompt: "A silver robot"})).resolves.toEqual({prompt: "A silver robot"});
    await expect(buildInput(capability, {
      prompt: "Edit the masked area",
      "image-urls": "https://example.com/room.png",
      "mask-url": "https://example.com/mask.png",
      background: "transparent",
      "output-format": "webp",
      resolution: "4K",
      format: "json",
      "request-source": "skill",
    })).resolves.toEqual({
      prompt: "Edit the masked area",
      image_urls: ["https://example.com/room.png"],
      mask_url: "https://example.com/mask.png",
      background: "transparent",
      output_format: "webp",
      resolution: "4K",
    });
  });

  it.each(["n", "num-images", "output-formart", "output-compression", "sync-mode"])("does not expose --%s", async (field) => {
    await expect(buildInput(capability, {prompt: "A robot", [field]: "1"})).rejects.toThrow("Unknown option");
  });
});
