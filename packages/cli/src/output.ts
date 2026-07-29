import {writeFile} from "node:fs/promises";

export type OutputFormat = "json" | "jsonl" | "csv" | "table";

export async function renderOutput(value: unknown, format: OutputFormat, output?: string): Promise<void> {
  const text = serialize(value, format);
  if (output) await writeFile(output, text.endsWith("\n") ? text : `${text}\n`, "utf8");
  else process.stdout.write(text.endsWith("\n") ? text : `${text}\n`);
}

export function serialize(value: unknown, format: OutputFormat): string {
  if (format === "json") return JSON.stringify(value, null, 2);
  const rows = rowsFrom(value);
  if (format === "jsonl") return rows.map((row) => JSON.stringify(row)).join("\n");
  if (format === "csv") return toCsv(rows);
  return toTable(rows);
}

function rowsFrom(value: unknown): Array<Record<string, unknown>> {
  const candidate = typeof value === "object" && value !== null && "items" in value
    ? (value as {items: unknown}).items
    : value;
  if (Array.isArray(candidate)) return candidate.map((item) => isObject(item) ? item : {value: item});
  return [isObject(candidate) ? candidate : {value: candidate}];
}

function toCsv(rows: Array<Record<string, unknown>>): string {
  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const escape = (value: unknown) => {
    const text = typeof value === "object" && value !== null ? JSON.stringify(value) : String(value ?? "");
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [headers.join(","), ...rows.map((row) => headers.map((key) => escape(row[key])).join(","))].join("\n");
}

function toTable(rows: Array<Record<string, unknown>>): string {
  if (!rows.length) return "No results";
  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const values = rows.map((row) => headers.map((key) => compact(row[key])));
  const widths = headers.map((header, index) => Math.min(60, Math.max(header.length, ...values.map((row) => row[index].length))));
  const line = (cells: string[]) => cells.map((cell, index) => cell.slice(0, widths[index]).padEnd(widths[index])).join("  ").trimEnd();
  return [line(headers), line(widths.map((width) => "-".repeat(width))), ...values.map(line)].join("\n");
}

function compact(value: unknown): string {
  if (typeof value === "object" && value !== null) return JSON.stringify(value);
  return String(value ?? "");
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
