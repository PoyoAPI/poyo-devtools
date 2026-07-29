export interface ParsedArgs {
  positionals: string[];
  options: Record<string, string | boolean>;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const positionals: string[] = [];
  const options: Record<string, string | boolean> = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith("--")) {
      positionals.push(value);
      continue;
    }
    if (value.startsWith("--no-")) {
      options[value.slice(5)] = false;
      continue;
    }
    const [rawKey, inline] = value.slice(2).split("=", 2);
    const next = argv[index + 1];
    if (inline !== undefined) options[rawKey] = inline;
    else if (next !== undefined && !next.startsWith("--")) options[rawKey] = next, index += 1;
    else options[rawKey] = true;
  }
  return {positionals, options};
}

export function numberOption(options: ParsedArgs["options"], key: string, fallback: number): number {
  const value = options[key];
  if (value === undefined || value === true || value === false) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`--${key} must be a number`);
  return parsed;
}
