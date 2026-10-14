import {readFileSync} from "node:fs";
import {mkdtemp, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {describe, expect, it} from "vitest";
import type {Capability} from "@poyoapi/core";
import {buildInput} from "./input.js";

const catalog = JSON.parse(readFileSync(new URL("../../../artifacts/capability-catalog.json", import.meta.url), "utf8"));
const ids = [
  "ideogram-v4.5", "ideogram-v4.5-edit", "elevenlabs-v4-tts", "elevenlabs-v4-turbo-tts",
  "gemini-3.8-flash-lite-tts", "gemini-3.8-flash-tts", "meshy-7.1-text-to-3d",
  "meshy-7.1-image-to-3d", "meshy-7.1-multi-image-to-3d",
];
const capability = (id: string) => catalog.items.find((item: Capability) => item.model_id === id) as Capability;

describe("九个图片、语音及 3D 模型的 CLI 参数发现", () => {
  it.each(ids)("%s 保留公开 JSON 输入且不注入默认值", async (id) => {
    const model = capability(id);
    expect(model).toBeDefined();
    for (const example of model.examples) {
      await expect(buildInput(model, {input: JSON.stringify(example), "request-source": "skill"})).resolves.toEqual(example);
    }
  });

  it("图片和音频选项按 schema 转为正确类型", async () => {
    await expect(buildInput(capability(ids[1]), {
      prompt: "Edit", "image-urls": "https://example.com/image.png", n: "8", size: "auto", "edit-precision": "high",
    })).resolves.toEqual({prompt: "Edit", image_urls: ["https://example.com/image.png"], n: 8, size: "auto", edit_precision: "high"});
    await expect(buildInput(capability(ids[2]), {
      text: "Hi", "output-format": "opus_48000_192", "similarity-boost": "0.75", timestamps: "true",
    })).resolves.toEqual({text: "Hi", output_format: "opus_48000_192", similarity_boost: 0.75, timestamps: true});
  });

  it("双人语音通过 input-file 保留嵌套对象和每轮风格", async () => {
    const model = capability("gemini-3.8-flash-tts");
    const dialogue = model.examples.find((example) => "speakers" in example)!;
    const directory = await mkdtemp(join(tmpdir(), "poyo-dialogue-"));
    try {
      const path = join(directory, "dialogue.json");
      await writeFile(path, JSON.stringify(dialogue));
      await expect(buildInput(model, {"input-file": path})).resolves.toEqual(dialogue);
      await expect(buildInput(model, {
        speakers: JSON.stringify(dialogue.speakers), turns: JSON.stringify(dialogue.turns),
      })).resolves.toEqual(dialogue);
    } finally {
      await rm(directory, {recursive: true, force: true});
    }
  });

  it.each([
    ["ideogram-v4.5", "sync-mode"], ["ideogram-v4.5", "image-size"],
    ["ideogram-v4.5", "seed"], ["ideogram-v4.5", "enable-prompt-expansion"],
    ["ideogram-v4.5-edit", "seed"], ["elevenlabs-v4-tts", "seed"], ["elevenlabs-v4-turbo-tts", "seed"],
    ["gemini-3.8-flash-tts", "output-format"], ["gemini-3.8-flash-lite-tts", "temperature"],
    ["meshy-7.1-multi-image-to-3d", "model-type"],
  ])("%s 不公开无对应能力的 --%s", async (id, field) => {
    await expect(buildInput(capability(id), {[field]: "unsupported"})).rejects.toThrow("Unknown option");
  });
});
