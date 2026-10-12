import {describe, expect, it} from "vitest";
import {forwardMessage} from "./proxy.js";

describe("Qwen Image 2.1 MCP bridge", () => {
  it("forwards the typed model call and preserves public inputs", async () => {
    const message = {
      jsonrpc: "2.0", id: 21, method: "tools/call",
      params: {
        name: "poyo_qwen_image_2_1",
        arguments: {
          prompt: "Edit the mask", image_urls: ["https://example.com/image.png"],
          mask_url: "https://example.com/mask.png", resolution: "2K", _request_source: "skill",
        },
      },
    };
    const reply = {jsonrpc: "2.0", id: 21, result: {content: [{type: "text", text: '{"task_id":"qwen21-test","status":"queued"}'}]}};
    const fetchMock: typeof fetch = async (url, init) => {
      expect(new URL(String(url)).searchParams.get("models")).toBe("qwen-image-2.1");
      expect(JSON.parse(String(init?.body))).toEqual(message);
      expect(new Headers(init?.headers).get("MCP-Protocol-Version")).toBe("2025-06-18");
      return new Response(JSON.stringify(reply), {status: 200});
    };
    const result = await forwardMessage(message, {
      url: "https://example.test/mcp", apiKey: "test-key", models: "qwen-image-2.1",
    }, fetchMock, "2025-06-18");
    expect(result.response).toEqual(reply);
  });
});
