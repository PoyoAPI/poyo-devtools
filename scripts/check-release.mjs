import {readFile} from "node:fs/promises";

const packagePaths = [
  "packages/core/package.json",
  "packages/mcp/package.json",
  "packages/cli/package.json",
];
const packages = await Promise.all(
  packagePaths.map(async (path) => JSON.parse(await readFile(path, "utf8"))),
);
const versions = new Set(packages.map((item) => item.version));
if (versions.size !== 1) throw new Error("All PoYo packages must use the same version");

const [version] = versions;
const distTag = process.env.NPM_DIST_TAG;
if (!new Set(["beta", "latest"]).has(distTag)) throw new Error("NPM_DIST_TAG must be beta or latest");
if (distTag === "beta" && !version.includes("-")) throw new Error("The beta dist-tag requires a prerelease version");
if (distTag === "latest" && version.includes("-")) throw new Error("The latest dist-tag requires a stable version");

const expected = `publish:${version}:${distTag}`;
if (process.env.RELEASE_CONFIRMATION !== expected) {
  throw new Error(`Release confirmation must exactly match ${expected}`);
}

process.stdout.write(`Validated ${packages.length} packages for ${version} with dist-tag ${distTag}.\n`);
