import {mkdir, readFile, writeFile} from "node:fs/promises";
import {resolve} from "node:path";

interface Capability {
  model_id: string;
  category: string;
  service_type: string;
  description: string;
  billing: Record<string, unknown>;
  supported_protocols: string[];
}
interface Catalog {schema_version: string; items: Capability[]}

const artifact = resolve("artifacts/capability-catalog.json");
const raw = JSON.parse(await readFile(artifact, "utf8")) as Catalog | {code: number; data: Catalog};
const catalog = "data" in raw ? raw.data : raw;
const grouped = new Map<string, Capability[]>();
for (const item of catalog.items) grouped.set(item.category, [...(grouped.get(item.category) ?? []), item]);
const output = resolve("skills/poyo-ai-models/references");
await mkdir(output, {recursive: true});
for (const [category, items] of grouped) {
  const lines = [
    `# ${category}`,
    "",
    `Generated from PoYo Catalog \`${catalog.schema_version}\`. Always call describe before execution.`,
    "",
    "| Model | Type | Protocols | Description |",
    "|---|---|---|---|",
    ...items.sort((a, b) => a.model_id.localeCompare(b.model_id)).map(
      (item) => `| \`${item.model_id}\` | ${item.service_type} | ${item.supported_protocols.join(", ")} | ${item.description.replace(/\|/g, "\\|")} |`,
    ),
    "",
  ];
  await writeFile(resolve(output, `${category}.md`), lines.join("\n"), "utf8");
}
