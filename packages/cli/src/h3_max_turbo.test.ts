import {readFileSync} from "node:fs";
import {describe, expect, it, vi} from "vitest";
import {PoyoClient, type Capability} from "@poyoapi/core";
import {remoteUrl} from "../../mcp/src/proxy.js";
import {buildInput} from "./input.js";

const catalog = JSON.parse(readFileSync(new URL("../../../artifacts/capability-catalog.json", import.meta.url), "utf8"));
const capability = catalog.items.find((item: Capability) => item.model_id === "h3-max-turbo") as Capability;

describe("H3 Max Turbo", () => {
  it("discovers basic flags without injecting defaults", async () => {
    expect(capability.tool_name).toBe("poyo_h3_max_turbo");
    await expect(buildInput(capability, {prompt: "A coastal city"})).resolves.toEqual({prompt: "A coastal city"});
    await expect(buildInput(capability, {
      prompt: "Daylight turns into sunset",
      "image-urls": '["https://example.com/start.jpg","https://example.com/end.jpg"]',
      resolution: "1080p",
      duration: "10",
      "callback-url": "https://example.com/callback",
    })).resolves.toEqual({
      prompt: "Daylight turns into sunset",
      image_urls: ["https://example.com/start.jpg", "https://example.com/end.jpg"],
      resolution: "1080p",
      duration: 10,
    });
  });

  it.each(["seed", "target-audio-url", "reference-image-urls", "prompt-expansion-mode", "sync-mode"])("rejects --%s", async (field) => {
    await expect(buildInput(capability, {[field]: "1"})).rejects.toThrow("Unknown option");
  });

  it.each([true, false])("converts --enable-safety-checker %s to a boolean", async (enabled) => {
    await expect(buildInput(capability, {prompt: "A coastal city", "enable-safety-checker": String(enabled)}))
      .resolves.toEqual({prompt: "A coastal city", enable_safety_checker: enabled});
  });

  it("describes and submits through the existing client", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({code: 200, data: capability})))
      .mockResolvedValueOnce(new Response(JSON.stringify({code: 200, data: {task_id: "h3-task", status: "not_started"}})));
    const client = new PoyoClient({baseUrl: "https://example.test", apiKey: "test-key", fetch: fetchMock});
    expect(await client.capability("h3-max-turbo")).toEqual(capability);
    const input = await buildInput(capability, {prompt: "A coastal city", "image-urls": "[]", "enable-safety-checker": "false"});
    const result = await client.submit("h3-max-turbo", input, "https://example.com/callback");
    expect(result.task_id).toBe("h3-task");
    expect(String(fetchMock.mock.calls[0][0])).toBe("https://example.test/v1/catalog/models/h3-max-turbo");
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({
      model: "h3-max-turbo", input: {prompt: "A coastal city", image_urls: [], enable_safety_checker: false}, callback_url: "https://example.com/callback",
    });
    expect(remoteUrl({url: "https://example.test/mcp", models: "h3-max-turbo"}).searchParams.get("models")).toBe("h3-max-turbo");
  });
});
