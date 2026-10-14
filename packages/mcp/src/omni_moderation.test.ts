import {readFileSync} from "node:fs";
import {describe, expect, it} from "vitest";
import type {Capability} from "@poyoapi/core";
import {forwardMessage} from "./proxy.js";

const catalog = JSON.parse(readFileSync(new URL("../../../artifacts/capability-catalog.json", import.meta.url), "utf8"));
const capability = catalog.items.find((item: Capability) => item.model_id === "omni-moderation-latest") as Capability;

describe("Omni Moderation through the dynamic MCP proxy", () => {
  it("exposes the server's model schema without a local model registration", async () => {
    expect(capability.supports_callback).toBe(true);
    expect(capability.input_schema.properties).not.toHaveProperty("callback_url");
    const message = {jsonrpc: "2.0", id: 1, method: "tools/list", params: {}};
    const reply = {jsonrpc: "2.0", id: 1, result: {tools: [{name: capability.tool_name, description: capability.description, inputSchema: capability.input_schema}]}};
    const fetchMock: typeof fetch = async (url, init) => {
      expect(new URL(String(url)).searchParams.get("models")).toBe(capability.model_id);
      expect(JSON.parse(String(init?.body))).toEqual(message);
      return new Response(JSON.stringify(reply), {status: 200});
    };
    const result = await forwardMessage(message, {url: "https://example.test/mcp", apiKey: "isolated-test", models: capability.model_id}, fetchMock);
    expect(result.response).toEqual(reply);
  });

  it("preserves fixed zero-credit pricing", async () => {
    const message = {jsonrpc: "2.0", id: 2, method: "tools/call", params: {name: "poyo_get_pricing", arguments: {model: capability.model_id}}};
    const reply = {jsonrpc: "2.0", id: 2, result: {content: [{type: "text", text: JSON.stringify(capability.billing)}], structuredContent: capability.billing}};
    const fetchMock: typeof fetch = async (_url, init) => {
      expect(JSON.parse(String(init?.body))).toEqual(message);
      return new Response(JSON.stringify(reply), {status: 200});
    };
    const result = await forwardMessage(message, {url: "https://example.test/mcp", apiKey: "isolated-test"}, fetchMock);
    expect(result.response).toEqual(reply);
    expect(capability.billing).toMatchObject({type: "fixed", credits: 0, display: "FREE"});
  });

  it.each(capability.examples)("preserves model inputs and a successful flagged result", async (example) => {
    const message = {
      jsonrpc: "2.0", id: 3, method: "tools/call",
      params: {name: capability.tool_name, arguments: {...example, _request_source: "skill"}},
    };
    const task = {
      task_id: "isolated-moderation", status: "succeeded", credits_amount: 0, files: [],
      output: {id: "modr-isolated", model: capability.model_id, results: [{flagged: true, categories: {violence: true}, category_scores: {violence: 0.91, sexual: 0}, category_applied_input_types: {violence: ["text"]}}]},
    };
    const reply = {jsonrpc: "2.0", id: 3, result: {content: [{type: "text", text: JSON.stringify(task)}], structuredContent: task}};
    const fetchMock: typeof fetch = async (_url, init) => {
      expect(JSON.parse(String(init?.body))).toEqual(message);
      return new Response(JSON.stringify(reply), {status: 200});
    };
    const result = await forwardMessage(message, {url: "https://example.test/mcp", apiKey: "isolated-test", models: capability.model_id}, fetchMock);
    expect(result.response).toEqual(reply);
  });

  it("forwards an outer callback and preserves queued, running, and completed reviews", async () => {
    const input = {image_urls: ["https://example.com/a.jpg"]};
    const messages = [
      {jsonrpc: "2.0", id: 4, method: "tools/call", params: {name: "poyo_submit_job", arguments: {model: capability.model_id, input, callback_url: "https://example.com/moderation-callback", _request_source: "skill"}}},
      {jsonrpc: "2.0", id: 5, method: "tools/call", params: {name: "poyo_check_job", arguments: {task_id: "isolated-background"}}},
      {jsonrpc: "2.0", id: 6, method: "tools/call", params: {name: "poyo_check_job", arguments: {task_id: "isolated-background"}}},
    ];
    const output = {id: "modr-background", model: capability.model_id, results: [{flagged: true, categories: {violence: true}, category_scores: {violence: 0.91, sexual: 0}, category_applied_input_types: {violence: ["image"]}}]};
    const results = [
      {code: 200, data: {task_id: "isolated-background", status: "not_started"}},
      {task_id: "isolated-background", status: "running", credits_amount: 0, output: null},
      {task_id: "isolated-background", status: "succeeded", credits_amount: 0, files: [], output},
    ];
    let calls = 0;
    const fetchMock: typeof fetch = async (url, init) => {
      expect(new URL(String(url)).searchParams.has("models")).toBe(false);
      expect(JSON.parse(String(init?.body))).toEqual(messages[calls]);
      const reply = {jsonrpc: "2.0", id: messages[calls].id, result: {content: [{type: "text", text: JSON.stringify(results[calls])}], structuredContent: results[calls]}};
      calls += 1;
      return new Response(JSON.stringify(reply), {status: 200});
    };
    for (let index = 0; index < messages.length; index += 1) {
      const result = await forwardMessage(messages[index], {url: "https://example.test/mcp", apiKey: "isolated-test"}, fetchMock);
      expect(result.response).toMatchObject({result: {structuredContent: results[index]}});
    }
    expect(calls).toBe(3);
  });
});
