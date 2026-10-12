import {readFileSync} from "node:fs";
import {describe, expect, it} from "vitest";
import {PoyoClient, type Capability} from "@poyoapi/core";
import {parseArgs} from "./args.js";
import {buildInput} from "./input.js";

const catalog = JSON.parse(readFileSync(new URL("../../../artifacts/capability-catalog.json", import.meta.url), "utf8"));
const capability = catalog.items.find((item: Capability) => item.model_id === "qwen-image-2.1") as Capability;

describe("Qwen Image 2.1 CLI", () => {
  it("preserves only explicit input and converts public flags", async () => {
    expect(capability).toBeDefined();
    await expect(buildInput(capability, {prompt: "A corgi"})).resolves.toEqual({prompt: "A corgi"});
    const parsed = parseArgs([
      "run", "qwen-image-2.1", "--prompt", "Combine references", "--image-urls",
      "https://example.com/a.png,https://example.com/b.webp", "--size", "auto",
      "--resolution", "2K", "--no-prompt-extend", "--no-enable-safety-checker",
      "--seed", "0", "--format", "json", "--request-source", "skill",
    ]);
    await expect(buildInput(capability, parsed.options)).resolves.toEqual({
      prompt: "Combine references", image_urls: ["https://example.com/a.png", "https://example.com/b.webp"],
      size: "auto", resolution: "2K", prompt_extend: false, enable_safety_checker: false, seed: 0,
    });
  });

  it("supports transparent assets, masks and an empty reference array", async () => {
    await expect(buildInput(capability, {
      prompt: "A sticker", background: "transparent", "output-format": "webp", "image-urls": "[]",
    })).resolves.toEqual({prompt: "A sticker", background: "transparent", output_format: "webp", image_urls: []});
    await expect(buildInput(capability, {
      prompt: "Edit the white region", "image-urls": "https://example.com/a.png", "mask-url": "https://example.com/mask.png",
    })).resolves.toEqual({prompt: "Edit the white region", image_urls: ["https://example.com/a.png"], mask_url: "https://example.com/mask.png"});
  });

  it.each(["negative-prompt", "aspect-ratio", "enhance-prompt", "nsfw-checker", "n"])("rejects --%s", async (field) => {
    await expect(buildInput(capability, {prompt: "A corgi", [field]: "1"})).rejects.toThrow("Unknown option");
  });

  it("discovers the schema and submits the selected model without defaults", async () => {
    const calls: Array<{url: string; body?: string}> = [];
    const client = new PoyoClient({
      baseUrl: "https://example.test", apiKey: "test-key",
      fetch: async (url, init) => {
        calls.push({url: String(url), body: init?.body as string | undefined});
        const data = init?.method === "POST" ? {task_id: "qwen21-test", status: "not_started"} : capability;
        return new Response(JSON.stringify({code: 200, data}), {status: 200});
      },
    });
    const discovered = await client.capability("qwen-image-2.1");
    const input = await buildInput(discovered, {prompt: "A corgi"});
    await expect(client.submit(discovered.model_id, input)).resolves.toMatchObject({task_id: "qwen21-test", status: "queued"});
    expect(calls[0].url).toBe("https://example.test/v1/catalog/models/qwen-image-2.1");
    expect(JSON.parse(calls[1].body!)).toEqual({model: "qwen-image-2.1", input: {prompt: "A corgi"}});
  });
});
