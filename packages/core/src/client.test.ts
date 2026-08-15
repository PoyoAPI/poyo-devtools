import {describe, expect, it} from "vitest";
import {PoyoClient} from "./client.js";

describe("PoyoClient", () => {
  it("reads the model catalog envelope", async () => {
    const data = {schema_version: "v1-test", items: [], next_cursor: null, has_more: false};
    const client = new PoyoClient({
      fetch: async () => new Response(JSON.stringify({code: 200, data}), {status: 200}) as never,
    });
    await expect(client.catalog()).resolves.toEqual(data);
  });

  it("normalizes finished tasks", async () => {
    const client = new PoyoClient({
      apiKey: "sk-test",
      fetch: async () => new Response(JSON.stringify({data: {task_id: "t1", status: "finished"}}), {status: 200}) as never,
    });
    await expect(client.task("t1")).resolves.toMatchObject({status: "succeeded", raw_status: "finished"});
  });

  it("sends idempotency keys for paid non-streaming calls", async () => {
    const headers: Headers[] = [];
    const client = new PoyoClient({
      apiKey: "sk-test",
      fetch: async (_input, init) => {
        headers.push(new Headers(init?.headers));
        return new Response(JSON.stringify({data: {task_id: "t1", status: "queued"}}), {status: 200}) as never;
      },
    });
    await client.submit("image-model", {prompt: "hello"}, undefined, "generate-1");
    expect(headers[0].get("idempotency-key")).toBe("generate-1");
  });
});
