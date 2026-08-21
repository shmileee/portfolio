#!/usr/bin/env node
// Deterministic static verifier for the generated portfolio output.
// Node built-ins only. `npm run verify:build` rebuilds with Eleventy first;
// pass --site-dir <path> to verify a copied output root (mutation QA)
// without rebuilding the source output.

import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { CRAWL_CHECKS } from "./verify/checks-crawl.mjs";
import { STRUCTURE_CHECKS } from "./verify/checks-structure.mjs";
import { loadSite } from "./verify/context.mjs";

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHECKS = [...STRUCTURE_CHECKS, ...CRAWL_CHECKS];

function resolveSiteDir() {
  const { values } = parseArgs({ options: { "site-dir": { type: "string" } } });
  return values["site-dir"] === undefined ? resolve(ROOT_DIR, "_site") : resolve(values["site-dir"]);
}

function run() {
  let siteDir;
  try {
    siteDir = resolveSiteDir();
  } catch (error) {
    console.error(`verify:build usage error: ${error.message} (supported: --site-dir <path>)`);
    return 2;
  }
  if (!existsSync(siteDir)) {
    console.error(`verify:build: site directory not found: ${siteDir}`);
    return 2;
  }
  let site;
  try {
    site = loadSite(ROOT_DIR, siteDir);
  } catch (error) {
    console.error(`verify:build: cannot load site output: ${error.message}`);
    return 2;
  }

  console.log(`verify:build checking ${siteDir}`);
  let failed = 0;
  for (const [name, check] of CHECKS) {
    let result;
    try {
      result = check(site);
    } catch (error) {
      result = { ok: false, detail: `${error.name}: ${error.message}` };
    }
    if (!result.ok) {
      failed += 1;
    }
    console.log(`${result.ok ? "ok  " : "FAIL"} ${name.padEnd(19)} ${result.detail}`);
  }

  const passed = CHECKS.length - failed;
  if (failed === 0) {
    console.log(`verify:build passed: ${passed}/${CHECKS.length} checks`);
    return 0;
  }
  console.log(`verify:build failed: ${passed}/${CHECKS.length} checks passed, ${failed} failed`);
  return 1;
}

process.exitCode = run();
