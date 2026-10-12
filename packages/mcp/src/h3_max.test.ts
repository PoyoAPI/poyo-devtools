import {describe, expect, it, vi} from "vitest";
import {forwardMessage} from "./proxy.js";

describe("H3 Max hosted MCP forwarding", () => {
  it.each(["h3-max", "h3-max-turbo"])("forwards %s safety checker without injecting billing values", async (model) => {
    const message = {jsonrpc: "2.0", id: 1, method: "tools/call", params: {
      name: model === "h3-max" ? "poyo_h3_max" : "poyo_h3_max_turbo", arguments: {prompt: "A sunrise", enable_safety_checker: false, _request_source: "skill"},
    }};
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({jsonrpc: "2.0", id: 1, result: {task_id: "job-1"}})));
    await forwardMessage(message, {url: "https://example.test/mcp", models: model, apiKey: "test-key"}, fetchMock);
    expect(String(fetchMock.mock.calls[0][0])).toBe(`https://example.test/mcp?models=${model}`);
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual(message);
  });
});
