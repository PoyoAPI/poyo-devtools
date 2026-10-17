import {readFileSync} from "node:fs";
import {describe, expect, it} from "vitest";
import type {Capability} from "@poyoapi/core";
import {buildInput} from "./input.js";

const catalog = JSON.parse(readFileSync(new URL("../../../artifacts/capability-catalog.json", import.meta.url), "utf8"));
const capability = (id: string) => catalog.items.find((item: Capability) => item.model_id === id) as Capability;

describe("Vidu Q4 与 OmniHuman 2.0 的动态 CLI 合同", () => {
  it.each(["vidu-q4", "omnihuman-2.0"])("%s 原样保留公开示例且不补默认值", async (id) => {
    const model = capability(id);
    expect(model).toBeDefined();
    for (const example of model.examples) {
      await expect(buildInput(model, {input: JSON.stringify(example), "request-source": "skill"})).resolves.toEqual(example);
    }
  });

  it("Vidu 的文本、首帧、参考模式只发送用户选择字段", async () => {
    const model = capability("vidu-q4");
    await expect(buildInput(model, {prompt: "A fox"})).resolves.toEqual({prompt: "A fox"});
    await expect(buildInput(model, {"image-urls": "https://example.com/start.png", duration: "6"}))
      .resolves.toEqual({image_urls: ["https://example.com/start.png"], duration: 6});
    await expect(buildInput(model, {prompt: "A character", "reference-image-urls": "https://example.com/a.png,https://example.com/b.png",
      "reference-audio-urls": "https://example.com/mood.mp3", "generate-audio": "true", "enable-safety-checker": "false"}))
      .resolves.toEqual({prompt: "A character", reference_image_urls: ["https://example.com/a.png", "https://example.com/b.png"],
        reference_audio_urls: ["https://example.com/mood.mp3"], generate_audio: true, enable_safety_checker: false});
  });

  it("公开媒体地址合同拒绝 data URI", () => {
    for (const [id, field] of [["vidu-q4", "image_urls"], ["vidu-q4", "reference_image_urls"],
      ["vidu-q4", "reference_audio_urls"], ["omnihuman-2.0", "image_urls"], ["omnihuman-2.0", "audio_url"]]) {
      const property = capability(id).input_schema.properties![field];
      const schema = property.type === "array" ? property.items! : property;
      const pattern = new RegExp(String(schema.pattern));
      expect(pattern.test("https://example.com/media")).toBe(true);
      expect(pattern.test("http://example.com/media")).toBe(true);
      expect(pattern.test("data:image/png;base64,AA==")).toBe(false);
      expect(pattern.test("data:audio/mpeg;base64,AA==")).toBe(false);
    }
  });

  it.each([["vidu-q4", "seed"], ["vidu-q4", "image-url"], ["vidu-q4", "channel-cost-usd"],
    ["omnihuman-2.0", "duration"], ["omnihuman-2.0", "output-duration"], ["omnihuman-2.0", "seed"],
    ["omnihuman-2.0", "resolution"]])("%s 拒绝未公开的 --%s", async (id, field) => {
    await expect(buildInput(capability(id), {[field]: "1"})).rejects.toThrow("Unknown option");
  });
});
