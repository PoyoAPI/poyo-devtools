import {clearConfig, loadConfig, saveConfig, type PoyoConfig} from "./config.js";

const SERVICE = "poyo.ai";
const ACCOUNT = "api-key";

export type CredentialSource = "keyring" | "config" | "none";

export interface CredentialBackend {
  getPassword(): Promise<string | null>;
  setPassword(value: string): Promise<void>;
  deletePassword(): Promise<void>;
}

export interface StoredCredential {
  apiKey?: string;
  source: CredentialSource;
}

export function systemCredentialBackend(): CredentialBackend {
  async function entry() {
    if (process.env.POYO_DISABLE_KEYRING === "1") throw new Error("system_keyring_disabled");
    const {Entry} = await import("@napi-rs/keyring");
    return new Entry(SERVICE, ACCOUNT);
  }
  return {
    async getPassword() {
      return (await entry()).getPassword() || null;
    },
    async setPassword(value: string) {
      (await entry()).setPassword(value);
    },
    async deletePassword() {
      (await entry()).deletePassword();
    },
  };
}

export async function loadStoredCredential(
  config?: PoyoConfig,
  backend: CredentialBackend = systemCredentialBackend(),
): Promise<StoredCredential> {
  const resolvedConfig = config ?? await loadConfig();
  try {
    const apiKey = await backend.getPassword();
    if (apiKey) return {apiKey, source: "keyring"};
  } catch {
    // Headless Linux sessions and locked keychains fall back to the local config.
  }
  return resolvedConfig.apiKey ? {apiKey: resolvedConfig.apiKey, source: "config"} : {source: "none"};
}

export async function storeApiKey(
  apiKey: string,
  baseUrl?: string,
  backend: CredentialBackend = systemCredentialBackend(),
): Promise<CredentialSource> {
  try {
    await backend.setPassword(apiKey);
    await saveConfig(baseUrl ? {baseUrl} : {});
    return "keyring";
  } catch {
    await saveConfig({apiKey, ...(baseUrl ? {baseUrl} : {})});
    return "config";
  }
}

export async function clearStoredCredential(
  backend: CredentialBackend = systemCredentialBackend(),
): Promise<void> {
  try {
    await backend.deletePassword();
  } catch {
    // Clearing the fallback config must still succeed when no keyring is available.
  }
  await clearConfig();
}
