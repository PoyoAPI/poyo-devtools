import {readFileSync} from "node:fs";
import {describe, expect, it} from "vitest";
import type {Capability} from "@poyoapi/core";
import {buildInput} from "./input.js";

const catalog = JSON.parse(readFileSync(new URL("../../../artifacts/capability-catalog.json", import.meta.url), "utf8"));
const capability = catalog.items.find((item: Capability) => item.model_id === "h3-max") as Capability;

describe("H3 Max dynamic CLI inputs", () => {
  it("preserves explicit fields without adding defaults", async () => {
    await expect(buildInput(capability, {prompt: "A sunrise"})).resolves.toEqual({prompt: "A sunrise"});
    await expect(buildInput(capability, {
      prompt: "Image 1 follows Video 1", duration: "10", resolution: "768p",
      "reference-image-urls": "https://example.com/a.jpg",
      "reference-video-urls": '["https://example.com/a.mp4"]',
      "reference-audio-urls": "https://example.com/a.wav", "request-source": "skill",
    })).resolves.toEqual({prompt: "Image 1 follows Video 1", duration: 10, resolution: "768p",
      reference_image_urls: ["https://example.com/a.jpg"], reference_video_urls: ["https://example.com/a.mp4"],
      reference_audio_urls: ["https://example.com/a.wav"]});
    await expect(buildInput(capability, {prompt: "Animate", "image-urls": "https://example.com/first.jpg,https://example.com/last.jpg"}))
      .resolves.toEqual({prompt: "Animate", image_urls: ["https://example.com/first.jpg", "https://example.com/last.jpg"]});
  });

  it.each(["reference-tokens", "channel-cost-usd", "prompt-expansion-mode", "seed"])("rejects unsupported --%s", async (field) => {
    await expect(buildInput(capability, {prompt: "A sunrise", [field]: "1"})).rejects.toThrow("Unknown option");
  });

  it.each([true, false])("converts --enable-safety-checker %s to a boolean", async (enabled) => {
    await expect(buildInput(capability, {prompt: "A sunrise", "enable-safety-checker": String(enabled)}))
      .resolves.toEqual({prompt: "A sunrise", enable_safety_checker: enabled});
  });
});
