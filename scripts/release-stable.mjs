import {readFile, writeFile} from "node:fs/promises";
import {spawnSync} from "node:child_process";

const packagePaths = [
  "packages/core/package.json",
  "packages/mcp/package.json",
  "packages/cli/package.json",
];
const version = process.argv.slice(2).find((argument) => argument !== "--");

if (!version || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)) {
  fail("Usage: pnpm run release:stable -- <version> (for example 0.1.0)");
}

const initialStatus = git(["status", "--porcelain"]);
if (initialStatus) {
  fail("The working tree must be clean before preparing a stable release.");
}

const packages = await Promise.all(packagePaths.map(async (path) => {
  const source = await readFile(path, "utf8");
  const currentVersion = JSON.parse(source).version;
  if (typeof currentVersion !== "string") fail(`Could not read the version in ${path}`);
  return {path, source, currentVersion};
}));
const currentVersions = new Set(packages.map((item) => item.currentVersion));
if (currentVersions.size !== 1) fail("All PoYo packages must have the same current version.");
if (currentVersions.has(version)) fail(`All PoYo packages are already at version ${version}.`);

for (const {path, source} of packages) {
  const updated = source.replace(/("version"\s*:\s*")[^"]+(")/, `$1${version}$2`);
  await writeFile(path, updated, "utf8");
}

const releaseEnv = {
  ...process.env,
  POYO_INTERNAL_BASE_URL: "https://api.poyo.ai",
  NPM_DIST_TAG: "latest",
  RELEASE_CONFIRMATION: `publish:${version}:latest`,
};

runPnpm(["exec", "tsx", "scripts/sync-catalog.ts"], releaseEnv);
runPnpm(["exec", "tsx", "scripts/generate-skill-references.ts"], releaseEnv);
runPnpm(["-r", "build"], releaseEnv);
runPnpm(["-r", "typecheck"], releaseEnv);
runPnpm(["exec", "vitest", "run", "packages"], releaseEnv);
run(process.execPath, ["scripts/check-skill-coverage.mjs"], releaseEnv);
run(process.execPath, ["scripts/check-release.mjs"], releaseEnv);

run("git", [
  "add",
  "--",
  ...packagePaths,
  "artifacts",
  "skills/poyo-ai-models/references",
]);
run("git", ["diff", "--cached", "--check"]);

const staged = git(["diff", "--cached", "--name-only"]);
if (!staged) fail("Release preparation produced no changes.");

run("git", ["commit", "-m", `Release ${version}`]);
process.stdout.write(
  `Prepared stable release ${version}. Push the commit, then run publish.yml with ` +
  `dist_tag=latest and confirmation=publish:${version}:latest.\n`,
);

function runPnpm(args, env) {
  const pnpmScript = process.env.npm_execpath;
  if (pnpmScript) {
    run(process.execPath, [pnpmScript, ...args], env);
    return;
  }
  run(process.platform === "win32" ? "corepack.cmd" : "corepack", ["pnpm", ...args], env);
}

function git(args) {
  const result = spawnSync("git", args, {encoding: "utf8"});
  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout);
    process.exit(result.status ?? 1);
  }
  return result.stdout.trim();
}

function run(command, args, env = process.env) {
  const result = spawnSync(command, args, {env, stdio: "inherit"});
  if (result.error) throw result.error;
  if (result.status !== 0) {
    fail(`${command} ${args.join(" ")} failed with exit code ${result.status ?? 1}`);
  }
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}
