import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const caseStudiesDirectory = join(root, "src", "content", "case-studies");

test("case-study identity and display order have one source of truth", async () => {
  // Given the authored case-study directories
  const folders = (await readdir(caseStudiesDirectory, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  // When their names and frontmatter are inspected
  const numberedFolders = folders.filter((folder) => /^\d+-/.test(folder));
  const identityFrontmatter = [];
  for (const folder of folders) {
    const source = await readFile(join(caseStudiesDirectory, folder, "index.md"), "utf8");
    if (/^(number|slug):/m.test(source)) identityFrontmatter.push(folder);
  }

  // Then folders and content remain independent of display numbering
  assert.deepEqual(numberedFolders, []);
  assert.deepEqual(identityFrontmatter, []);

  const { default: caseStudyCatalog } = await import("../src/_data/caseStudyCatalog.js");
  const { getCaseStudyCatalogEntry } = await import("../src/lib/case-study-catalog.js");
  assert.equal(caseStudyCatalog.length, folders.length);
  assert.deepEqual(
    caseStudyCatalog.map(({ folder }) => folder).sort(),
    folders,
  );
  assert.equal(new Set(caseStudyCatalog.map(({ id }) => id)).size, caseStudyCatalog.length);
  assert.equal(new Set(caseStudyCatalog.map(({ folder }) => folder)).size, caseStudyCatalog.length);
  for (const [index, entry] of caseStudyCatalog.entries()) {
    assert.deepEqual(getCaseStudyCatalogEntry(entry.folder), {
      ...entry,
      number: index + 1,
    });
  }
});

test("catalog definitions cannot collide with routes or legacy hashes", async () => {
  // Given one valid catalog definition
  const { createCaseStudyCatalog } = await import("../src/_data/caseStudyCatalog.js");
  const definition = (overrides = {}) => ({
    id: "valid-study",
    folder: "valid-study",
    legacyFolder: "01-valid-study",
    ...overrides,
  });

  // When malformed namespaces or duplicate aliases are supplied
  const invalidCatalogs = [
    ["numeric id", [definition({ id: "3" })], /id must/],
    ["non-URL id", [definition({ id: "New_Study" })], /id must/],
    ["numbered canonical folder", [definition({ folder: "01-valid-study" })], /folder must/],
    ["malformed legacy folder", [definition({ legacyFolder: "valid-study" })], /legacyFolder must/],
    [
      "duplicate legacy number",
      [definition(), definition({ id: "other-study", folder: "other-study", legacyFolder: "1-other-study" })],
      /duplicate legacy number/,
    ],
  ];

  // Then each invalid catalog is rejected before Eleventy or the reader can consume it
  for (const [name, entries, expectedError] of invalidCatalogs) {
    assert.throws(() => createCaseStudyCatalog(entries), expectedError, name);
  }
});

test("arc links use stable case-study ids", async () => {
  // Given the authored arc beats
  const arcDirectory = join(root, "src", "content", "arc");
  const arcFiles = (await readdir(arcDirectory)).filter((file) => file.endsWith(".md"));

  // When every arc link target is collected
  const linkedIds = [];
  const numberedLinks = [];
  for (const file of arcFiles) {
    const source = await readFile(join(arcDirectory, file), "utf8");
    linkedIds.push(...[...source.matchAll(/^\s+- study: ([a-z0-9-]+)$/gm)].map((match) => match[1]));
    if (/^\s+- number:/m.test(source)) numberedLinks.push(file);
  }

  // Then references survive display-order changes and all resolve through the catalog
  assert.deepEqual(numberedLinks, []);
  assert.ok(linkedIds.length > 0);
  const { default: caseStudyCatalog } = await import("../src/_data/caseStudyCatalog.js");
  const knownIds = new Set(caseStudyCatalog.map(({ id }) => id));
  assert.deepEqual(linkedIds.filter((id) => !knownIds.has(id)), []);
});

test("case-study prose links resolve through stable ids", async () => {
  // Given the central catalog and every authored case study
  const { default: caseStudyCatalog } = await import("../src/_data/caseStudyCatalog.js");
  const knownIds = new Set(caseStudyCatalog.map(({ id }) => id));
  const folders = (await readdir(caseStudiesDirectory, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  // When internal case-study links are collected
  const hardcodedRoutes = [];
  const linkedIds = [];
  for (const folder of folders) {
    const source = await readFile(join(caseStudiesDirectory, folder, "index.md"), "utf8");
    if (source.includes("/case-studies/")) hardcodedRoutes.push(folder);
    linkedIds.push(
      ...[...source.matchAll(/{% caseStudyLink "([a-z0-9-]+)"/g)].map((match) => match[1]),
    );
  }

  // Then folder and display-number changes propagate without editing prose
  assert.deepEqual(hardcodedRoutes, []);
  assert.ok(linkedIds.length > 0);
  assert.deepEqual(linkedIds.filter((id) => !knownIds.has(id)), []);
});
