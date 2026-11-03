import {spawnSync} from "node:child_process";
import {basename} from "node:path";
import {setTimeout} from "node:timers/promises";

const tarball = process.argv[2];
const distTag = process.argv[3];
const filename = tarball ? basename(tarball) : "";
const match = filename.match(/^poyoapi-(core|mcp|cli)-((?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?)\.tgz$/);

if (!tarball || !new Set(["beta", "latest"]).has(distTag) || !match) {
  fail("Usage: node scripts/publish-package.mjs <poyoapi-package-version.tgz> <latest|beta>");
}

const name = `@poyoapi/${match[1]}`;
const version = match[2];
const attempts = 3;
let delayMs = 15_000;

if (isPublished(name, version)) {
  process.stdout.write(`${name}@${version} is already on npm. Skipping publish.\n`);
  process.exit(0);
}

for (let attempt = 1; attempt <= attempts; attempt += 1) {
  process.stdout.write(`Publishing ${name}@${version} with provenance (attempt ${attempt}/${attempts}).\n`);
  const result = npm([
    "publish",
    tarball,
    "--access",
    "public",
    "--tag",
    distTag,
    "--provenance",
  ]);
  if (result.status === 0) {
    process.stdout.write(`Published ${name}@${version}.\n`);
    process.exit(0);
  }

  const code = /npm error code (\S+)/.exec(result.output)?.[1] ?? "";
  if (code === "EPUBLISHCONFLICT" && (attempt > 1 || isPublished(name, version))) {
    process.stdout.write(`${name}@${version} is already on npm.\n`);
    process.exit(0);
  }
  const retryable = code === "TLOG_CREATE_ENTRY_ERROR"
    || /error creating (?:tlog|log) entry/.test(result.output);
  if (!retryable || attempt === attempts) {
    fail(`${name}@${version} publish failed${code ? ` with ${code}` : ""}.`);
  }
  process.stdout.write(`${code || "Transparency log"} failed. Retrying with a new signing key in ${delayMs / 1000}s.\n`);
  await setTimeout(delayMs);
  delayMs *= 2;
}

function npm(args) {
  const result = spawnSync("npm", args, {encoding: "utf8"});
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) process.stderr.write(`${result.error.message}\n`);
  return {status: result.status, output};
}

function isPublished(packageName, packageVersion) {
  const result = spawnSync("npm", ["view", `${packageName}@${packageVersion}`, "version"], {encoding: "utf8"});
  return result.status === 0 && result.stdout.trim() === packageVersion;
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}
