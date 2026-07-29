import {mkdtemp, rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {afterEach, describe, expect, it} from "vitest";
import {loadConfig} from "./config.js";
import {
  clearStoredCredential,
  loadStoredCredential,
  storeApiKey,
  type CredentialBackend,
} from "./credential.js";

const originalConfigHome = process.env.XDG_CONFIG_HOME;
const temporaryDirectories: string[] = [];

afterEach(async () => {
  if (originalConfigHome === undefined) delete process.env.XDG_CONFIG_HOME;
  else process.env.XDG_CONFIG_HOME = originalConfigHome;
  await Promise.all(temporaryDirectories.splice(0).map((path) => rm(path, {recursive: true, force: true})));
});

describe.sequential("credential storage", () => {
  it("uses the system keyring without writing the API key to config", async () => {
    const directory = await isolatedConfigHome();
    let password: string | null = null;
    const backend: CredentialBackend = {
      async getPassword() { return password; },
      async setPassword(value) { password = value; },
      async deletePassword() { password = null; },
    };

    expect(await storeApiKey("sk-keyring", "https://api.test", backend)).toBe("keyring");
    expect(await loadStoredCredential(await loadConfig(), backend)).toEqual({apiKey: "sk-keyring", source: "keyring"});
    expect(await loadConfig()).toEqual({baseUrl: "https://api.test"});
    await clearStoredCredential(backend);
    expect(password).toBeNull();
    expect(directory).toBeTruthy();
  });

  it("falls back to the local config when the keyring is unavailable", async () => {
    await isolatedConfigHome();
    const unavailable: CredentialBackend = {
      async getPassword() { throw new Error("unavailable"); },
      async setPassword() { throw new Error("unavailable"); },
      async deletePassword() { throw new Error("unavailable"); },
    };

    expect(await storeApiKey("sk-fallback", "https://dev-api.test", unavailable)).toBe("config");
    expect(await loadStoredCredential(await loadConfig(), unavailable)).toEqual({apiKey: "sk-fallback", source: "config"});
  });
});

async function isolatedConfigHome(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "poyo-config-"));
  temporaryDirectories.push(directory);
  process.env.XDG_CONFIG_HOME = directory;
  return directory;
}
