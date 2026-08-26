// Loads the generated site once and exposes memoized views the checks share:
// file inventory, HTML tag scans, element ids, study routes, reader manifest.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import caseStudyCatalog from "../../src/_data/caseStudyCatalog.js";
import { scanTags } from "./html.mjs";

export const STUDY_PAGE_PATTERN = /^case-studies\/([^/]+)\/index\.html$/;

function walkFiles(root, prefix = "") {
  const files = [];
  for (const entry of readdirSync(join(root, prefix), { withFileTypes: true })) {
    const rel = prefix === "" ? entry.name : `${prefix}/${entry.name}`;
    if (entry.isDirectory()) {
      files.push(...walkFiles(root, rel));
    } else if (entry.isFile()) {
      files.push(rel);
    }
  }
  return files;
}

function readOrigin(rootDir) {
  const configPath = join(rootDir, "src", "_data", "site.json");
  const config = JSON.parse(readFileSync(configPath, "utf8"));
  if (typeof config.origin !== "string" || !/^https:\/\/[^/]+$/.test(config.origin)) {
    throw new Error(`${configPath}: origin must be an absolute https URL without a trailing slash`);
  }
  return config.origin;
}

function parseReaderManifest(site) {
  const scripts = site
    .tagsOf("index.html")
    .filter((tag) => tag.name === "script" && tag.attrs.has("data-reader-manifest"));
  if (scripts.length !== 1) {
    return { error: `expected exactly one [data-reader-manifest] script, found ${scripts.length}` };
  }
  try {
    const entries = JSON.parse(scripts[0].body);
    if (!Array.isArray(entries)) {
      return { error: "manifest JSON is not an array" };
    }
    return { entries };
  } catch (error) {
    return { error: `manifest JSON does not parse: ${error.message}` };
  }
}

export function loadSite(rootDir, siteDir) {
  const files = walkFiles(siteDir).sort();
  const fileSet = new Set(files);
  const htmlFiles = files.filter((file) => file.endsWith(".html"));
  const generatedStudyRoutes = files
    .map((file) => STUDY_PAGE_PATTERN.exec(file))
    .filter((match) => match !== null)
    .map((match) => `/case-studies/${match[1]}/`);
  const studyRoutes = caseStudyCatalog.map(({ folder }) => `/case-studies/${folder}/`);
  const legacyStudyRedirects = caseStudyCatalog
    .filter(({ legacyFolder }) => legacyFolder)
    .map(({ folder, legacyFolder }) => ({
      route: `/case-studies/${legacyFolder}/`,
      target: `/case-studies/${folder}/`,
    }));
  const legacyStudyRoutes = legacyStudyRedirects.map(({ route }) => route);
  const studyRouteById = new Map(
    caseStudyCatalog.map(({ folder, id }) => [id, `/case-studies/${folder}/`]),
  );

  const rawCache = new Map();
  const tagsCache = new Map();
  const idsCache = new Map();

  const site = {
    siteDir,
    origin: readOrigin(rootDir),
    files,
    fileSet,
    htmlFiles,
    generatedStudyRoutes,
    legacyStudyRedirects,
    legacyStudyRoutes,
    studyRouteById,
    studyRoutes,
    rawOf(file) {
      if (!rawCache.has(file)) {
        rawCache.set(file, readFileSync(join(siteDir, file), "utf8"));
      }
      return rawCache.get(file);
    },
    tagsOf(file) {
      if (!tagsCache.has(file)) {
        tagsCache.set(file, [...scanTags(site.rawOf(file), file)]);
      }
      return tagsCache.get(file);
    },
    idsOf(file) {
      if (!idsCache.has(file)) {
        const ids = new Set();
        for (const tag of site.tagsOf(file)) {
          const id = tag.attrs.get("id");
          if (id !== undefined && id !== "") {
            ids.add(id);
          }
        }
        idsCache.set(file, ids);
      }
      return idsCache.get(file);
    },
    readerManifest() {
      if (site._manifest === undefined) {
        site._manifest = parseReaderManifest(site);
      }
      return site._manifest;
    },
  };
  return site;
}

// Maps a route ("/", "/case-studies/x/") or file path to the file that
// serves it, or null when nothing in the output would answer the request.
export function routeToFile(site, path) {
  if (path.endsWith("/")) {
    const candidate = `${path.slice(1)}index.html`;
    return site.fileSet.has(candidate) ? candidate : null;
  }
  const direct = path.slice(1);
  if (site.fileSet.has(direct)) {
    return direct;
  }
  const asDirectory = `${direct}/index.html`;
  return site.fileSet.has(asDirectory) ? asDirectory : null;
}
