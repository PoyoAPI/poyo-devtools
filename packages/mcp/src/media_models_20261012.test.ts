import {readFileSync} from "node:fs";
import {describe, expect, it} from "vitest";
import type {Capability} from "@poyoapi/core";
import {forwardMessage} from "./proxy.js";

const catalog = JSON.parse(readFileSync(new URL("../../../artifacts/capability-catalog.json", import.meta.url), "utf8"));
const ids = [
  "ideogram-v4.5", "ideogram-v4.5-edit", "elevenlabs-v4-tts", "elevenlabs-v4-turbo-tts",
  "gemini-3.8-flash-lite-tts", "gemini-3.8-flash-tts", "meshy-7.1-text-to-3d",
  "meshy-7.1-image-to-3d", "meshy-7.1-multi-image-to-3d",
];

describe("九个模型的 MCP 动态工具转发", () => {
  it.each(ids)("%s 原样转发公开输入和嵌套数组", async (id) => {
    const model = catalog.items.find((item: Capability) => item.model_id === id) as Capability;
    for (const example of model.examples) {
      const message = {
        jsonrpc: "2.0", id: 1, method: "tools/call",
        params: {name: model.tool_name, arguments: {...example, _request_source: "skill", _wait_seconds: 0}},
      };
      const reply = {jsonrpc: "2.0", id: 1, result: {content: [{type: "text", text: '{"task_id":"isolated","status":"queued"}'}]}};
      const fetchMock: typeof fetch = async (url, init) => {
        expect(new URL(String(url)).searchParams.get("models")).toBe(id);
        expect(JSON.parse(String(init?.body))).toEqual(message);
        return new Response(JSON.stringify(reply), {status: 200});
      };
      const result = await forwardMessage(message, {url: "https://example.test/mcp", apiKey: "test-key", models: id}, fetchMock);
      expect(result.response).toEqual(reply);
    }
  });
});
