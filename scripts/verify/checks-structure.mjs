// Page-structure invariants: study routes, canonical metadata, adjacency cards,
// the 04/05 sequence, the 404 page, homepage payload, card anchors, and reader shell.

import { STUDY_PAGE_PATTERN } from "./context.mjs";
import { MalformedMarkupError, normalizeText, scanTags } from "./html.mjs";
import { outcome } from "./report.mjs";

export const EXPECTED_STUDY_COUNT = 23;
const TITLE_SUFFIX = " — Oleksandr Ponomarov"; // base.njk appends this to every page <title>
const HOMEPAGE_BYTE_BUDGET = 75 * 1024;
const EMBEDDED_BODY_SIGNATURES = ["case-detail-prose", "media-exhibit", "code-exhibit", "diagram-exhibit"];

function studyFile(route) {
  return `${route.slice(1)}index.html`;
}

// Text of a document's sole <tagName>; malformed or ambiguous markup throws.
function soleElementText(site, file, tagName) {
  const matches = site.tagsOf(file).filter((tag) => tag.name === tagName);
  if (matches.length !== 1) {
    throw new MalformedMarkupError(file, `expected exactly one <${tagName}>, found ${matches.length}`);
  }
  const html = site.rawOf(file);
  const close = html.indexOf(`</${tagName}`, matches[0].contentStart);
  if (close === -1) {
    throw new MalformedMarkupError(file, `<${tagName}> never closed`);
  }
  return normalizeText(html.slice(matches[0].contentStart, close), file);
}

function hasClass(tag, className) {
  return (tag.attrs.get("class") ?? "").split(/\s+/).includes(className);
}

function elementText(raw, tag, file) {
  const close = raw.indexOf(`</${tag.name}>`, tag.contentStart);
  if (close === -1) {
    throw new MalformedMarkupError(file, `<${tag.name}> never closed`);
  }
  return normalizeText(raw.slice(tag.contentStart, close), file);
}

function readManifestOrder(site, problems) {
  const manifest = site.readerManifest();
  if (!manifest.entries) {
    problems.push(`reader manifest unavailable: ${manifest.error}`);
    return null;
  }
  const entries = manifest.entries;
  if (entries.length !== EXPECTED_STUDY_COUNT) {
    problems.push(`manifest has ${entries.length} entries, expected ${EXPECTED_STUDY_COUNT}`);
  }
  const routeToIndex = new Map();
  entries.forEach((entry, index) => {
    if (entry === null || typeof entry !== "object") {
      problems.push(`manifest[${index}] is not an object`);
      return;
    }
    if (typeof entry.url !== "string" || entry.url.trim() === "") {
      problems.push(`manifest[${index}] url is empty or invalid`);
    } else if (routeToIndex.has(entry.url)) {
      problems.push(`manifest[${index}] url is duplicated: ${entry.url}`);
    } else {
      routeToIndex.set(entry.url, index);
    }
    if (!Number.isInteger(entry.number) || entry.number < 1) {
      problems.push(`manifest[${index}] number is invalid: ${entry.number}`);
    }
    if (typeof entry.title !== "string" || entry.title.trim() === "") {
      problems.push(`manifest[${index}] title is empty`);
    }
  });
  for (const route of site.studyRoutes) {
    if (!routeToIndex.has(route)) {
      problems.push(`manifest is missing route ${route}`);
    }
  }
  if (problems.length > 0) {
    return null;
  }
  return { entries, routeToIndex };
}

function checkStudyPages(site) {
  const problems = [];
  if (site.studyRoutes.length !== EXPECTED_STUDY_COUNT) {
    problems.push(`expected ${EXPECTED_STUDY_COUNT} study pages, found ${site.studyRoutes.length}`);
  }
  const strays = site.htmlFiles.filter(
    (file) => file.startsWith("case-studies/") && !STUDY_PAGE_PATTERN.test(file),
  );
  for (const stray of strays) {
    problems.push(`unexpected HTML under case-studies/: ${stray}`);
  }
  return outcome(problems, `${site.studyRoutes.length}/${EXPECTED_STUDY_COUNT} standalone study pages built`);
}

function checkStudyMetadata(site) {
  const problems = [];
  const manifest = site.readerManifest();
  const titleByRoute = new Map();
  if (manifest.entries) {
    for (const entry of manifest.entries) {
      if (entry !== null && typeof entry === "object" && typeof entry.url === "string") {
        titleByRoute.set(entry.url, entry.title);
      }
    }
  } else {
    problems.push(`reader manifest unavailable: ${manifest.error}`);
  }
  for (const route of site.studyRoutes) {
    const file = studyFile(route);
    try {
      const tags = site.tagsOf(file);
      const canonicalUrl = `${site.origin}${route}`;
      const canonicals = tags.filter((tag) => tag.name === "link" && tag.attrs.get("rel") === "canonical");
      if (canonicals.length !== 1) {
        problems.push(`${route}: expected exactly one canonical link, found ${canonicals.length}`);
      } else if (canonicals[0].attrs.get("href") !== canonicalUrl) {
        problems.push(`${route}: canonical is ${canonicals[0].attrs.get("href")}, expected ${canonicalUrl}`);
      }
      const ogUrls = tags.filter((tag) => tag.name === "meta" && tag.attrs.get("property") === "og:url");
      if (ogUrls.length !== 1 || ogUrls[0].attrs.get("content") !== canonicalUrl) {
        problems.push(`${route}: og:url is missing or diverges from the canonical URL`);
      }
      const heading = soleElementText(site, file, "h1");
      const title = soleElementText(site, file, "title");
      if (title !== `${heading}${TITLE_SUFFIX}`) {
        problems.push(`${route}: <title> "${title}" is not the <h1> plus "${TITLE_SUFFIX}"`);
      }
      if (titleByRoute.size > 0 && titleByRoute.get(route) !== heading) {
        problems.push(`${route}: <h1> "${heading}" does not match the manifest title`);
      }
    } catch (error) {
      if (!(error instanceof MalformedMarkupError)) {
        throw error;
      }
      problems.push(error.message);
    }
  }
  return outcome(
    problems,
    `${site.studyRoutes.length} pages align canonical, og:url, <title>, <h1>, and manifest title`,
  );
}

function singleRouteByPrefix(site, prefix) {
  const matches = site.studyRoutes.filter((route) => route.startsWith(`/case-studies/${prefix}`));
  if (matches.length !== 1) {
    throw new Error(`expected exactly one study route with prefix ${prefix}, found ${matches.length}`);
  }
  return matches[0];
}

function checkSequenceLinks(site) {
  const problems = [];
  const feedbackLoop = singleRouteByPrefix(site, "04-");
  const oneToolVersion = singleRouteByPrefix(site, "05-");
  for (const [from, to] of [
    [feedbackLoop, oneToolVersion],
    [oneToolVersion, feedbackLoop],
  ]) {
    const hrefs = site.tagsOf(studyFile(from)).map((tag) => tag.attrs.get("href"));
    if (!hrefs.includes(to)) {
      problems.push(`${from} has no anchor to ${to}`);
    }
  }
  return outcome(problems, "studies 04 and 05 link to each other canonically");
}

function checkStandaloneStudyAdjacency(site) {
  const problems = [];
  const manifestOrder = readManifestOrder(site, problems);
  if (!manifestOrder) {
    return outcome(problems, "");
  }
  const { entries, routeToIndex } = manifestOrder;
  for (const route of site.studyRoutes) {
    const index = routeToIndex.get(route);
    if (index === undefined) {
      problems.push(`${route}: manifest is missing the study entry`);
      continue;
    }
    const file = studyFile(route);
    try {
      const raw = site.rawOf(file);
      const adjacentRegions = site.tagsOf(file).filter(
        (tag) =>
          tag.name === "nav" &&
          hasClass(tag, "case-detail-adjacent") &&
          tag.attrs.get("aria-label") === "Adjacent case studies",
      );
      if (adjacentRegions.length !== 1) {
        problems.push(`${route}: expected exactly one adjacent-study region, found ${adjacentRegions.length}`);
        continue;
      }
      const region = adjacentRegions[0];
      const regionClose = raw.indexOf("</nav>", region.contentStart);
      if (regionClose === -1) {
        throw new MalformedMarkupError(file, "<nav> never closed");
      }
      const regionHtml = raw.slice(region.contentStart, regionClose);
      const regionTags = [...scanTags(regionHtml, file)];
      const anchors = regionTags.filter((tag) => tag.name === "a");
      if (anchors.length !== 2) {
        problems.push(`${route}: expected exactly 2 adjacency links, found ${anchors.length}`);
      }
      const anchorByDirection = new Map();
      for (const anchor of anchors) {
        const direction = anchor.attrs.get("data-study-direction");
        if (direction !== "previous" && direction !== "next") {
          problems.push(`${route}: adjacency link is missing a valid data-study-direction`);
          continue;
        }
        if (anchorByDirection.has(direction)) {
          problems.push(`${route}: duplicate ${direction} adjacency link`);
          continue;
        }
        anchorByDirection.set(direction, anchor);
      }

      const expectedLinks = {
        previous: entries[(index - 1 + entries.length) % entries.length],
        next: entries[(index + 1) % entries.length],
      };
      for (const direction of ["previous", "next"]) {
        const anchor = anchorByDirection.get(direction);
        if (!anchor) {
          problems.push(`${route}: missing ${direction} adjacency link`);
          continue;
        }
        const anchorClose = regionHtml.indexOf("</a>", anchor.contentStart);
        if (anchorClose === -1) {
          throw new MalformedMarkupError(file, "<a> never closed");
        }
        const anchorHtml = regionHtml.slice(anchor.contentStart, anchorClose);
        const spanTags = [...scanTags(anchorHtml, file)].filter((tag) => tag.name === "span");
        if (spanTags.length !== 3) {
          problems.push(`${route}: ${direction} adjacency card should contain exactly 3 spans, found ${spanTags.length}`);
        }
        const spanByClass = new Map();
        for (const span of spanTags) {
          const classNames = (span.attrs.get("class") ?? "").split(/\s+/).filter(Boolean);
          const match = classNames.find((className) =>
            [
              "case-detail-adjacent-kicker",
              "case-detail-adjacent-number",
              "case-detail-adjacent-title",
            ].includes(className),
          );
          if (!match) {
            problems.push(`${route}: ${direction} adjacency card has an unexpected span class`);
            continue;
          }
          if (spanByClass.has(match)) {
            problems.push(`${route}: ${direction} adjacency card duplicates ${match}`);
            continue;
          }
          spanByClass.set(match, span);
        }
        const expected = expectedLinks[direction];
        const expectedNumber = `Case ${String(expected.number).padStart(2, "0")}`;
        const actualHref = anchor.attrs.get("href");
        if (actualHref !== expected.url) {
          problems.push(`${route}: ${direction} href is ${actualHref ?? "(missing)"}, expected ${expected.url}`);
        }
        const kicker = spanByClass.get("case-detail-adjacent-kicker");
        if (!kicker) {
          problems.push(`${route}: ${direction} adjacency card is missing its kicker`);
        } else if (elementText(anchorHtml, kicker, file) !== direction[0].toUpperCase() + direction.slice(1)) {
          problems.push(`${route}: ${direction} kicker text is wrong`);
        }
        const number = spanByClass.get("case-detail-adjacent-number");
        if (!number) {
          problems.push(`${route}: ${direction} adjacency card is missing its number`);
        } else if (elementText(anchorHtml, number, file) !== expectedNumber) {
          problems.push(`${route}: ${direction} number is ${elementText(anchorHtml, number, file)}, expected ${expectedNumber}`);
        }
        const title = spanByClass.get("case-detail-adjacent-title");
        if (!title) {
          problems.push(`${route}: ${direction} adjacency card is missing its title`);
        } else if (elementText(anchorHtml, title, file) !== expected.title) {
          problems.push(`${route}: ${direction} title is ${elementText(anchorHtml, title, file)}, expected ${expected.title}`);
        }
      }
    } catch (error) {
      if (!(error instanceof MalformedMarkupError)) {
        throw error;
      }
      problems.push(error.message);
    }
  }
  return outcome(
    problems,
    `${site.studyRoutes.length} study pages expose one explicit adjacent region with 2 canonical wraparound cards`,
  );
}

function checkNotFoundPage(site) {
  if (!site.fileSet.has("404.html")) {
    return outcome(["404.html is missing"], "");
  }
  const problems = [];
  const robots = site.tagsOf("404.html").filter((tag) => tag.name === "meta" && tag.attrs.get("name") === "robots");
  if (robots.length !== 1) {
    problems.push(`expected exactly one robots meta on 404.html, found ${robots.length}`);
  } else if (robots[0].attrs.get("content") !== "noindex,follow") {
    problems.push(`404.html robots meta is "${robots[0].attrs.get("content")}", expected "noindex,follow"`);
  }
  return outcome(problems, "404.html is served with noindex,follow");
}

function checkHomepagePayload(site) {
  const problems = [];
  const raw = site.rawOf("index.html");
  const bytes = Buffer.byteLength(raw, "utf8");
  if (bytes >= HOMEPAGE_BYTE_BUDGET) {
    problems.push(`index.html is ${bytes} bytes, budget is ${HOMEPAGE_BYTE_BUDGET}`);
  }
  const embedded = EMBEDDED_BODY_SIGNATURES.filter((signature) => raw.includes(signature));
  if (embedded.length > 0) {
    problems.push(`embedded case-study body signature(s) present: ${embedded.join(", ")}`);
  }
  return outcome(problems, `index.html is ${bytes} bytes < ${HOMEPAGE_BYTE_BUDGET}; 0 embedded body signatures`);
}

function checkCardAnchors(site) {
  const problems = [];
  const cards = site
    .tagsOf("index.html")
    .filter(
      (tag) => tag.name === "a" && (tag.attrs.get("class") ?? "").split(/\s+/).includes("case-card"),
    );
  if (cards.length !== EXPECTED_STUDY_COUNT) {
    problems.push(`expected ${EXPECTED_STUDY_COUNT} case-card anchors, found ${cards.length}`);
  }
  const hrefs = cards.map((tag) => tag.attrs.get("href") ?? "");
  const routeSet = new Set(site.studyRoutes);
  for (const href of hrefs) {
    if (!routeSet.has(href)) {
      problems.push(`card href ${href === "" ? "(empty)" : href} is not a built study route`);
    }
  }
  if (new Set(hrefs).size !== hrefs.length) {
    problems.push("duplicate card hrefs");
  }
  for (const route of site.studyRoutes.filter((candidate) => !hrefs.includes(candidate))) {
    problems.push(`no card links to ${route}`);
  }
  const manifest = site.readerManifest();
  if (manifest.entries) {
    const numberByRoute = new Map(
      manifest.entries
        .filter((entry) => entry !== null && typeof entry === "object")
        .map((entry) => [entry.url, entry.number]),
    );
    for (const card of cards) {
      const expected = numberByRoute.get(card.attrs.get("href"));
      if (String(expected) !== card.attrs.get("data-open-study")) {
        problems.push(
          `${card.attrs.get("href")}: data-open-study is ${card.attrs.get("data-open-study")}, manifest says ${expected}`,
        );
      }
    }
  } else {
    problems.push(`cannot verify card-to-manifest binding: ${manifest.error}`);
  }
  return outcome(problems, `${cards.length} canonical card anchors cover all ${site.studyRoutes.length} study routes`);
}

function checkReaderShell(site) {
  const problems = [];
  const tags = site.tagsOf("index.html");
  const singletons = [
    ["<dialog> reader", (tag) => tag.name === "dialog"],
    ["[data-reader-study] article", (tag) => tag.attrs.has("data-reader-study")],
    ["[data-reader-title] heading", (tag) => tag.attrs.has("data-reader-title")],
    ["[data-reader-prose] target", (tag) => tag.attrs.has("data-reader-prose")],
    ["[data-reader-manifest] script", (tag) => tag.attrs.has("data-reader-manifest")],
  ];
  for (const [label, matches] of singletons) {
    const count = tags.filter(matches).length;
    if (count !== 1) {
      problems.push(`expected exactly one ${label}, found ${count}`);
    }
  }
  const manifest = site.readerManifest();
  if (!manifest.entries) {
    problems.push(manifest.error);
    return outcome(problems, "");
  }
  if (manifest.entries.length !== EXPECTED_STUDY_COUNT) {
    problems.push(`manifest has ${manifest.entries.length} entries, expected ${EXPECTED_STUDY_COUNT}`);
  }
  const routeSet = new Set(site.studyRoutes);
  const numbers = new Set();
  const urls = new Set();
  manifest.entries.forEach((entry, index) => {
    if (entry === null || typeof entry !== "object") {
      problems.push(`manifest[${index}] is not an object`);
      return;
    }
    if (!Number.isInteger(entry.number) || entry.number < 1 || numbers.has(entry.number)) {
      problems.push(`manifest[${index}] number is invalid or duplicated: ${entry.number}`);
    }
    numbers.add(entry.number);
    if (typeof entry.url !== "string" || !routeSet.has(entry.url) || urls.has(entry.url)) {
      problems.push(`manifest[${index}] url is invalid or duplicated: ${entry.url}`);
    }
    urls.add(entry.url);
    if (typeof entry.title !== "string" || entry.title.trim() === "") {
      problems.push(`manifest[${index}] title is empty`);
    }
    if (
      !Array.isArray(entry.topics) ||
      entry.topics.length === 0 ||
      entry.topics.some((topic) => typeof topic !== "string" || topic.trim() === "")
    ) {
      problems.push(`manifest[${index}] topics are invalid`);
    }
  });
  for (const route of site.studyRoutes.filter((candidate) => !urls.has(candidate))) {
    problems.push(`manifest is missing route ${route}`);
  }
  return outcome(problems, `1 lightweight reader shell with ${manifest.entries.length} manifest entries`);
}

export const STRUCTURE_CHECKS = [
  ["study-pages", checkStudyPages],
  ["study-metadata", checkStudyMetadata],
  ["sequence-links", checkSequenceLinks],
  ["standalone-study-adjacency", checkStandaloneStudyAdjacency],
  ["not-found-page", checkNotFoundPage],
  ["homepage-payload", checkHomepagePayload],
  ["card-anchors", checkCardAnchors],
  ["reader-shell", checkReaderShell],
];
