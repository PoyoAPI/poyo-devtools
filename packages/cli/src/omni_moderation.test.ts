import {readFileSync} from "node:fs";
import {afterEach, describe, expect, it, vi} from "vitest";
import type {Capability} from "@poyoapi/core";
import {buildInput} from "./input.js";
import {runCli} from "./cli.js";

vi.mock("@poyoapi/core", async (original) => ({
  ...await original<typeof import("@poyoapi/core")>(),
  loadConfig: async () => ({}),
  loadStoredCredential: async () => ({apiKey: "isolated-test"}),
}));

const catalog = JSON.parse(readFileSync(new URL("../../../artifacts/capability-catalog.json", import.meta.url), "utf8"));
const capability = catalog.items.find((item: Capability) => item.model_id === "omni-moderation-latest") as Capability;
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("Omni Moderation through the existing CLI generation flow", () => {
  it("discovers the free schema and preserves text and image inputs", async () => {
    expect(capability).toMatchObject({
      service_type: "generate", category: "moderation", execution_mode: "async",
      supports_streaming: false, supports_callback: true,
      billing: {type: "fixed", unit: "request", credits: 0, display: "FREE"},
    });
    expect(Object.keys(capability.input_schema.properties ?? {}).sort()).toEqual(["image_urls", "prompt"]);
    for (const example of capability.examples) {
      await expect(buildInput(capability, {input: JSON.stringify(example)})).resolves.toEqual(example);
    }
    const image_urls = ["https://example.com/image.png"];
    await expect(buildInput(capability, {prompt: "Review this image", "image-urls": JSON.stringify(image_urls)}))
      .resolves.toEqual({prompt: "Review this image", image_urls});
  });

  it("rejects Base64 image values in the discovered schema", () => {
    const pattern = String(capability.input_schema.properties?.image_urls.items?.pattern);
    expect(new RegExp(pattern).test("https://example.com/image.png")).toBe(true);
    expect(new RegExp(pattern).test("data:image/png;base64,aGVsbG8=")).toBe(false);
  });

  it("polls a queued review until the complete flagged result is available at zero credits", async () => {
    vi.useFakeTimers();
    let statusChecks = 0;
    const input = {prompt: "Text to review"};
    const output = {
      id: "modr-isolated", model: "omni-moderation-latest",
      results: [{flagged: true, categories: {violence: true}, category_scores: {violence: 0.91, sexual: 0}, category_applied_input_types: {violence: ["text"]}}],
    };
    const writes: string[] = [];
    vi.spyOn(process.stdout, "write").mockImplementation((chunk) => { writes.push(String(chunk)); return true; });
    const fetchMock = vi.fn(async (url: unknown, init?: RequestInit) => {
      const path = new URL(String(url)).pathname;
      if (path === "/v1/catalog/models/omni-moderation-latest") {
        return new Response(JSON.stringify({code: 200, data: capability}), {status: 200});
      }
      if (path === "/api/generate/submit") {
        expect(init?.method).toBe("POST");
        expect(JSON.parse(String(init?.body))).toEqual({model: capability.model_id, input});
        return new Response(JSON.stringify({code: 200, data: {task_id: "isolated-moderation", status: "not_started", created_time: "2026-10-14T00:00:00"}}), {status: 200});
      }
      if (path === "/api/generate/status/isolated-moderation") {
        statusChecks += 1;
        if (statusChecks === 1) {
          return new Response(JSON.stringify({code: 200, data: {task_id: "isolated-moderation", status: "running", files: [], credits_amount: 0, output: null}}), {status: 200});
        }
        return new Response(JSON.stringify({code: 200, data: {task_id: "isolated-moderation", status: "finished", files: [], credits_amount: 0, created_time: "2026-10-14T00:00:00", progress: 100, error_message: null, output}}), {status: 200});
      }
      throw new Error("Unexpected request: " + path);
    });
    vi.stubGlobal("fetch", fetchMock);
    const completed = expect(runCli(["run", capability.model_id, "--prompt", input.prompt, "--format", "json", "--request-source", "skill"]))
      .resolves.toBe(0);
    await vi.runAllTimersAsync();
    await completed;
    expect(statusChecks).toBe(2);
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(JSON.parse(writes.join(""))).toMatchObject({status: "succeeded", raw_status: "finished", credits_amount: 0, files: [], output});
  });

  it("keeps callback_url outside model input and returns the queued task without polling", async () => {
    const input = {image_urls: ["https://example.com/a.jpg"]};
    const callback_url = "https://example.com/moderation-callback";
    const writes: string[] = [];
    vi.spyOn(process.stdout, "write").mockImplementation((chunk) => { writes.push(String(chunk)); return true; });
    const fetchMock = vi.fn(async (url: unknown, init?: RequestInit) => {
      const path = new URL(String(url)).pathname;
      if (path === "/v1/catalog/models/omni-moderation-latest") {
        return new Response(JSON.stringify({code: 200, data: capability}), {status: 200});
      }
      expect(path).toBe("/api/generate/submit");
      expect(JSON.parse(String(init?.body))).toEqual({model: capability.model_id, input, callback_url});
      return new Response(JSON.stringify({code: 200, data: {task_id: "isolated-callback", status: "not_started", created_time: "2026-10-14T00:00:00"}}), {status: 200});
    });
    vi.stubGlobal("fetch", fetchMock);
    await expect(runCli(["submit", capability.model_id, "--input", JSON.stringify(input), "--callback-url", callback_url, "--format", "json", "--request-source", "skill"]))
      .resolves.toBe(0);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(writes.join(""))).toMatchObject({status: "queued", raw_status: "not_started"});
  });
});
