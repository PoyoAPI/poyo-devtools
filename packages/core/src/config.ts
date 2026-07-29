import {mkdir, readFile, writeFile, rm} from "node:fs/promises";
import {homedir} from "node:os";
import {dirname, join} from "node:path";

export interface PoyoConfig {apiKey?: string; baseUrl?: string}

export function configPath(): string {
  const root = process.env.XDG_CONFIG_HOME || (process.platform === "win32" ? process.env.APPDATA : undefined) || join(homedir(), ".config");
  return join(root, "poyo", "config.json");
}

export async function loadConfig(): Promise<PoyoConfig> {
  try {
    return JSON.parse(await readFile(configPath(), "utf8")) as PoyoConfig;
  } catch {
    return {};
  }
}

export async function saveConfig(config: PoyoConfig): Promise<void> {
  const path = configPath();
  await mkdir(dirname(path), {recursive: true});
  await writeFile(path, `${JSON.stringify(config, null, 2)}\n`, {encoding: "utf8", mode: 0o600});
}

export async function clearConfig(): Promise<void> {
  await rm(configPath(), {force: true});
}

export function maskApiKey(value?: string): string {
  if (!value) return "not configured";
  return value.length <= 12 ? "********" : `${value.slice(0, 6)}鈥?{value.slice(-4)}`;
}
