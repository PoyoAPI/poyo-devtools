import {describe, expect, it} from "vitest";
import type {Capability} from "@poyoapi/core";
import {buildInput} from "./input.js";

const capability = {
  model_id: "example-model",
  input_schema: {
    type: "object",
    properties: {
      prompt: {type: "string"},
      duration: {type: "integer"},
      sound: {type: "boolean"},
      image_urls: {type: "array", items: {type: "string"}},
    },
  },
} as Capability;

describe("buildInput", () => {
  it("expands schema flags and keeps control flags out of model input", async () => {
    await expect(buildInput(capability, {
      prompt: "hello",
      duration: "5",
      sound: "true",
      "image-urls": "https://example.com/a.png,https://example.com/b.png",
      "idempotency-key": "request-1",
    })).resolves.toEqual({
      prompt: "hello",
      duration: 5,
      sound: true,
      image_urls: ["https://example.com/a.png", "https://example.com/b.png"],
    });
  });

  it("rejects flags that are not in the selected model schema", async () => {
    await expect(buildInput(capability, {quality: "high"})).rejects.toThrow(
      "Unknown option --quality for example-model",
    );
  });
});
