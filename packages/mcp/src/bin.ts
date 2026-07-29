#!/usr/bin/env node
import {parseProxyArgs, runProxy} from "./proxy.js";

runProxy(parseProxyArgs(process.argv.slice(2))).catch((error) => {
  process.stderr.write(`PoYo MCP bridge failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
