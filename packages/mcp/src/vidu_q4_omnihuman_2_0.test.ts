import {readFileSync} from "node:fs";
import {describe, expect, it} from "vitest";
import type {Capability} from "@poyoapi/core";
import {forwardMessage} from "./proxy.js";

const catalog = JSON.parse(readFileSync(new URL("../../../artifacts/capability-catalog.json", import.meta.url), "utf8"));

describe("Vidu Q4 与 OmniHuman 2.0 的 MCP 公开工具合同", () => {
  it.each(["vidu-q4", "omnihuman-2.0"])("%s 仅透传公开示例与异步控制参数", async (id) => {
    const model = catalog.items.find((item: Capability) => item.model_id === id) as Capability;
    expect(model.tool_name).toBe(`poyo_${id.replace(/[^a-z0-9]+/g, "_")}`);
    expect(model.input_schema.additionalProperties).toBe(false);
    expect(model.input_schema.properties?.seed).toBeUndefined();
    expect(JSON.stringify(model)).not.toMatch(/fal-ai|vendor_code/);
    for (const example of model.examples) {
      const message = {jsonrpc: "2.0", id: 1, method: "tools/call", params: {
        name: model.tool_name, arguments: {...example, _wait_seconds: 0, _request_source: "skill"},
      }};
      const reply = {jsonrpc: "2.0", id: 1, result: {task_id: "isolated-job", status: "queued"}};
      const fetchMock: typeof fetch = async (url, init) => {
        expect(new URL(String(url)).searchParams.get("models")).toBe(id);
        expect(JSON.parse(String(init?.body))).toEqual(message);
        return new Response(JSON.stringify(reply), {status: 200});
      };
      expect((await forwardMessage(message, {url: "https://example.test/mcp", models: id, apiKey: "isolated-key"}, fetchMock)).response).toEqual(reply);
    }
  });

  it("OmniHuman 的计费使用服务端输出小数时长", () => {
    const model = catalog.items.find((item: Capability) => item.model_id === "omnihuman-2.0") as Capability;
    expect(model.input_schema.properties?.duration).toBeUndefined();
    expect(model.billing.formula).toBe("output_duration * credits_per_second");
    expect(model.billing.credits_per_second).toBe(21);
  });
});
