import {createInterface} from "node:readline/promises";
import {stdin, stdout} from "node:process";
import {Writable} from "node:stream";
import {
  clearStoredCredential, loadConfig, loadStoredCredential, maskApiKey, storeApiKey,
  PoyoApiError, PoyoClient, type Capability,
} from "@poyoapi/core";
import {runProxy} from "@poyoapi/mcp";
import {parseArgs, numberOption, type ParsedArgs} from "./args.js";
import {buildInput} from "./input.js";
import {renderOutput, type OutputFormat} from "./output.js";

export async function runCli(argv: string[]): Promise<number> {
  const parsed = parseArgs(argv);
  const [command, subcommand, third] = parsed.positionals;
  if (!command || command === "help" || parsed.options.help) return process.stdout.write(HELP), 0;
  if (command === "auth") return authCommand(subcommand, parsed);
  if (command === "mcp") {
    const config = await loadConfig();
    const stored = await loadStoredCredential(config);
    await runProxy({
      url: process.env.POYO_INTERNAL_MCP_URL,
      apiKey: stringOption(parsed, "api-key") ?? process.env.POYO_API_KEY ?? stored.apiKey,
      categories: stringOption(parsed, "categories"),
      models: stringOption(parsed, "models"),
    });
    return 0;
  }
  const config = await loadConfig();
  const publicCommand = command === "models" || command === "describe";
  const stored = publicCommand ? {apiKey: undefined} : await loadStoredCredential(config);
  const client = new PoyoClient({
    baseUrl: process.env.POYO_INTERNAL_BASE_URL,
    apiKey: stringOption(parsed, "api-key") ?? process.env.POYO_API_KEY ?? stored.apiKey,
    source: requestSource(parsed),
  });
  const format = outputFormat(parsed), output = stringOption(parsed, "output");

  if (command === "models") {
    const catalog = await client.catalog(subcommand ? {category: subcommand} : {});
    await renderOutput(catalog.items, format, output);
    return 0;
  }
  if (command === "describe") {
    if (!subcommand) throw new Error("Usage: poyo describe MODEL");
    await renderOutput(await client.capability(subcommand), format, output);
    return 0;
  }
  if (command === "account") return renderOutput(await client.account(), format, output), 0;
  if (command === "task") {
    if (!subcommand || !third || !["get", "wait"].includes(subcommand)) throw new Error("Usage: poyo task get|wait TASK_ID");
    const task = subcommand === "wait" ? await client.waitTask(third, numberOption(parsed.options, "timeout", 90)) : await client.task(third);
    await renderOutput(task, format, output);
    return task.status === "failed" ? 5 : 0;
  }
  if (command === "chat") {
    if (!subcommand) throw new Error("Usage: poyo chat MODEL [--protocol ...] [--stream]");
    const capability = await client.capability(subcommand);
    const input = await buildInput(capability, parsed.options);
    const protocol = stringOption(parsed, "protocol") ?? capability.supported_protocols[0] ?? "openai-chat";
    const stream = parsed.options.stream === true;
    const result = await client.chat(subcommand, protocol, input, stream);
    if (stream) await consumeSse(result as ReadableStream<Uint8Array>, format === "jsonl");
    else await renderOutput(result, format, output);
    return 0;
  }
  if (command === "run" || command === "submit") {
    if (!subcommand) throw new Error(`Usage: poyo ${command} MODEL [--input JSON | --input-file FILE]`);
    const capability = await client.capability(subcommand);
    const input = await buildInput(capability, parsed.options);
    const task = await client.submit(subcommand, input, stringOption(parsed, "callback-url"));
    if (command === "run" || parsed.options.wait === true) {
      const completed = await client.waitTask(task.task_id, numberOption(parsed.options, "timeout", 90));
      await renderOutput(completed, format, output);
      return completed.status === "failed" ? 5 : 0;
    }
    await renderOutput(task, format, output);
    return 0;
  }
  throw new Error(`Unknown command: ${command}`);
}

async function consumeSse(stream: ReadableStream<Uint8Array>, jsonl: boolean): Promise<void> {
  const reader = stream.getReader(), decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const {done, value} = await reader.read();
    buffer += decoder.decode(value, {stream: !done});
    const chunks = buffer.split(/\r?\n\r?\n/);
    buffer = chunks.pop() ?? "";
    for (const chunk of chunks) {
      const data = chunk.split(/\r?\n/).filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trim()).join("\n");
      if (!data || data === "[DONE]") continue;
      if (jsonl) process.stdout.write(`${data}\n`);
      else process.stdout.write(extractText(data));
    }
    if (done) break;
  }
  if (!jsonl) process.stdout.write("\n");
}

function extractText(data: string): string {
  try {
    const value = JSON.parse(data);
    return value.choices?.[0]?.delta?.content
      ?? value.delta?.text
      ?? value.delta?.text_delta
      ?? value.candidates?.[0]?.content?.parts?.map((part: {text?: string}) => part.text ?? "").join("")
      ?? value.response?.output?.flatMap((item: {content?: Array<{text?: string}>}) => item.content ?? []).map((item: {text?: string}) => item.text ?? "").join("")
      ?? "";
  } catch { return data; }
}

async function authCommand(action: string | undefined, parsed: ParsedArgs): Promise<number> {
  const config = await loadConfig();
  if (action === "status") {
    const stored = process.env.POYO_API_KEY ? {apiKey: process.env.POYO_API_KEY, source: "environment"} : await loadStoredCredential(config);
    process.stdout.write(`${maskApiKey(stored.apiKey)} (${stored.source})\n`);
    return 0;
  }
  if (action === "clear") return clearStoredCredential().then(() => (process.stdout.write("PoYo credentials cleared.\n"), 0));
  if (action !== "login") throw new Error("Usage: poyo auth login|status|clear");
  let apiKey = stringOption(parsed, "api-key") ?? process.env.POYO_API_KEY;
  if (!apiKey) {
    stdout.write("PoYo API key: ");
    const silent = new Writable({write(_chunk, _encoding, callback) { callback(); }});
    const terminal = createInterface({input: stdin, output: silent, terminal: Boolean(stdin.isTTY)});
    apiKey = (await terminal.question("")).trim(); terminal.close(); stdout.write("\n");
  }
  if (!apiKey) throw new Error("API key cannot be empty");
  const source = await storeApiKey(apiKey);
  process.stdout.write(`Saved ${maskApiKey(apiKey)} using ${source}.\n`);
  return 0;
}

function outputFormat(parsed: ParsedArgs): OutputFormat {
  const value = stringOption(parsed, "format") ?? "table";
  if (!["json", "jsonl", "csv", "table"].includes(value)) throw new Error(`Unsupported format: ${value}`);
  return value as OutputFormat;
}
function stringOption(parsed: ParsedArgs, name: string): string | undefined {
  const value = parsed.options[name]; return typeof value === "string" ? value : undefined;
}
function requestSource(parsed: ParsedArgs): "cli" | "skill-cli" {
  const value = (stringOption(parsed, "request-source") ?? process.env.POYO_REQUEST_SOURCE ?? "cli").toLowerCase();
  if (value === "cli") return "cli";
  if (value === "skill" || value === "skill-cli") return "skill-cli";
  throw new Error("--request-source must be cli or skill");
}
export function exitCodeFor(error: unknown): number {
  if (error instanceof PoyoApiError) {
    if ([401, 403].includes(error.status)) return 3;
    if (error.status === 402) return 4;
    if (error.status === 408) return 6;
    if (error.status === 429) return 7;
    return 5;
  }
  return 2;
}

const HELP = `PoYo CLI

Usage:
  poyo auth login|status|clear
  poyo models [category]
  poyo describe MODEL
  poyo chat MODEL [--protocol openai-chat|openai-responses|anthropic|gemini] [--stream]
  poyo run MODEL [--input JSON | --input-file FILE]
  poyo submit MODEL [--input JSON | --input-file FILE]
  poyo task get|wait TASK_ID
  poyo account
  poyo mcp [--categories LIST | --models LIST]
`;
