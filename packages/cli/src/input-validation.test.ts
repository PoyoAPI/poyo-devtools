import {readFileSync} from "node:fs";
import {afterEach, describe, expect, it, vi} from "vitest";
import type {Capability} from "@poyoapi/core";
import {buildInput} from "./input.js";
import {exitCodeFor, runCli} from "./cli.js";

// 禁止读取真实凭据；网络由下方桩接管。
vi.mock("@poyoapi/core", async (original) => ({
  ...await original<typeof import("@poyoapi/core")>(),
  loadConfig: async () => ({}),
  loadStoredCredential: async () => ({apiKey: "isolated-test"}),
}));

const catalog = JSON.parse(readFileSync(new URL("../../../artifacts/capability-catalog.json", import.meta.url), "utf8"));
const capability = catalog.items.find((item: Capability) => item.model_id === "h3-max-turbo") as Capability;
afterEach(() => vi.unstubAllGlobals());

describe("strict CLI input types", () => {
  it.each([
    ["true", true], ["false", false], [true, true], [false, false],
  ])("preserves boolean %s", async (value, expected) => {
    await expect(buildInput(capability, {"enable-safety-checker": value})).resolves.toEqual({enable_safety_checker: expected});
  });

  it.each(["0", "5", "15", "-1", "+5", "005", " 5 ", "9007199254740991"])("parses complete integer %s", async (value) => {
    await expect(buildInput(capability, {duration: value})).resolves.toEqual({duration: Number(value)});
  });

  it.each([
    ["enable-safety-checker", "bad"], ["enable-safety-checker", "TRUE"],
    ["enable-safety-checker", "1"], ["enable-safety-checker", "0"], ["enable-safety-checker", ""],
    ["duration", "5.9"], ["duration", "5junk"], ["duration", "1e1"], ["duration", ""],
    ["duration", "0x10"], ["duration", "Infinity"], ["duration", "9007199254740992"],
  ])("rejects --%s %s before any generation submission", async (option, value) => {
    const fetchMock = vi.fn(async (_url: unknown, init?: RequestInit) => {
      if (init?.method === "POST") throw new Error("Unexpected paid submission");
      return new Response(JSON.stringify({code: 200, data: capability}), {status: 200});
    });
    vi.stubGlobal("fetch", fetchMock);
    const error = await runCli(["submit", "h3-max-turbo", "--prompt", "A city", `--${option}`, value]).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain(`Invalid value for --${option}`);
    expect(exitCodeFor(error)).toBe(2);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls.every(([, init]) => init?.method !== "POST")).toBe(true);
  });

  it.each([true, false])("rejects a boolean as an integer flag", async (value) => {
    await expect(buildInput(capability, {duration: value})).rejects.toThrow("--duration");
  });

  it("keeps valid native JSON values and explicit flags without adding defaults", async () => {
    await expect(buildInput(capability, {input: JSON.stringify({prompt: "A city", duration: 5, enable_safety_checker: false})}))
      .resolves.toEqual({prompt: "A city", duration: 5, enable_safety_checker: false});
    await expect(buildInput(capability, {prompt: "A city"})).resolves.toEqual({prompt: "A city"});
  });
});
