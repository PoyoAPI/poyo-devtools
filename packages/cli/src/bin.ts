#!/usr/bin/env node
import {exitCodeFor, runCli} from "./cli.js";

runCli(process.argv.slice(2))
  .then((code) => { process.exitCode = code; })
  .catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = exitCodeFor(error);
  });
