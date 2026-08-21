// Crawl-surface invariants: sitemap contents, robots declaration, every
// root-relative href (with fragments), legacy reader hashes, media outputs.

import { routeToFile } from "./context.mjs";
import { decodeEntities, MalformedMarkupError } from "./html.mjs";
import { outcome } from "./report.mjs";

const EXPECTED_SITEMAP_LOCATIONS = 24; // homepage + 23 studies
const EXPECTED_VIDEO_COUNT = 2;

function parseSitemapLocations(xml, file) {
  let rest = xml.trim();
  const declaration = /^<\?xml version="1.0" encoding="UTF-8"\?>\s*/;
  if (!declaration.test(rest)) {
    throw new MalformedMarkupError(file, "missing or unexpected XML declaration");
  }
  rest = rest.replace(declaration, "");
  const open = /^<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">\s*/;
  if (!open.test(rest)) {
    throw new MalformedMarkupError(file, "missing <urlset> with the sitemap namespace");
  }
  rest = rest.replace(open, "");
  const locations = [];
  const urlEntry = /^<url>\s*<loc>([^<]+)<\/loc>\s*<\/url>\s*/;
  for (let match = urlEntry.exec(rest); match !== null; match = urlEntry.exec(rest)) {
    locations.push(decodeEntities(match[1].trim()));
    rest = rest.slice(match[0].length);
  }
  if (rest !== "</urlset>") {
    throw new MalformedMarkupError(file, `unexpected sitemap content near "${rest.slice(0, 60)}"`);
  }
  return locations;
}

function checkSitemap(site) {
  if (!site.fileSet.has("sitemap.xml")) {
    return outcome(["sitemap.xml is missing"], "");
  }
  const locations = parseSitemapLocations(site.rawOf("sitemap.xml"), "sitemap.xml");
  const problems = [];
  const unique = new Set(locations);
  if (unique.size !== locations.length) {
    problems.push(`sitemap repeats ${locations.length - unique.size} location(s)`);
  }
  if (unique.size !== EXPECTED_SITEMAP_LOCATIONS) {
    problems.push(`expected ${EXPECTED_SITEMAP_LOCATIONS} unique locations, found ${unique.size}`);
  }
  const expected = new Set([`${site.origin}/`, ...site.studyRoutes.map((route) => `${site.origin}${route}`)]);
  for (const loc of [...expected].filter((candidate) => !unique.has(candidate)).sort()) {
    problems.push(`missing route ${loc}`);
  }
  for (const loc of [...unique].filter((candidate) => !expected.has(candidate)).sort()) {
    problems.push(`unexpected location ${loc}`);
  }
  return outcome(
    problems,
    `${unique.size} unique locations: homepage + ${site.studyRoutes.length} studies, 404 excluded`,
  );
}

function checkRobots(site) {
  if (!site.fileSet.has("robots.txt")) {
    return outcome(["robots.txt is missing"], "");
  }
  const problems = [];
  const lines = site.rawOf("robots.txt").split("\n").map((line) => line.trim());
  if (!lines.includes(`Sitemap: ${site.origin}/sitemap.xml`)) {
    problems.push(`no "Sitemap: ${site.origin}/sitemap.xml" line`);
  }
  if (!lines.some((line) => line.startsWith("User-agent:"))) {
    problems.push("no User-agent directive");
  }
  return outcome(problems, "robots.txt declares the sitemap and a User-agent policy");
}

function checkInternalLinks(site) {
  const problems = [];
  let hrefCount = 0;
  let fragmentCount = 0;
  for (const file of site.htmlFiles) {
    for (const tag of site.tagsOf(file)) {
      const href = tag.attrs.get("href");
      if (href === undefined || !href.startsWith("/") || href.startsWith("//")) {
        continue;
      }
      hrefCount += 1;
      const [rawPath, ...fragmentParts] = href.split("#");
      let path;
      try {
        path = decodeURIComponent(rawPath.split("?")[0]);
      } catch {
        problems.push(`${file}: href ${href} has malformed percent-encoding`);
        continue;
      }
      const target = routeToFile(site, path);
      if (target === null) {
        problems.push(`${file}: href ${href} does not resolve to a built file`);
        continue;
      }
      if (fragmentParts.length === 0) {
        continue;
      }
      const fragment = fragmentParts.join("#");
      if (fragment === "") {
        problems.push(`${file}: href ${href} has an empty fragment`);
        continue;
      }
      if (!target.endsWith(".html")) {
        problems.push(`${file}: href ${href} points a fragment at a non-HTML file`);
        continue;
      }
      fragmentCount += 1;
      if (!site.idsOf(target).has(fragment)) {
        problems.push(`${file}: href ${href} targets missing id "${fragment}" in /${target}`);
      }
    }
  }
  return outcome(
    problems,
    `${hrefCount} root-relative hrefs across ${site.htmlFiles.length} pages resolve; ${fragmentCount} fragments verified`,
  );
}

// Homepage arc chips still emit same-page "#study-N" fragments on purpose:
// site.js keeps that reader compatibility. The retired form is the
// route-style "/#study-N" href that used to replace canonical study links.
function checkLegacyStudyHashes(site) {
  const problems = [];
  for (const file of site.htmlFiles) {
    for (const tag of site.tagsOf(file)) {
      const href = tag.attrs.get("href");
      if (href !== undefined && href.includes("/#study-")) {
        problems.push(`${file}: legacy reader hash href ${href}`);
      }
    }
  }
  return outcome(problems, `0 "/#study-" hrefs across ${site.htmlFiles.length} pages`);
}

function checkMediaOutputs(site) {
  const problems = [];
  const videos = site.files.filter((file) => file.toLowerCase().endsWith(".mp4"));
  const posters = site.files.filter((file) => file.toLowerCase().endsWith("-poster.png"));
  const gifs = site.files.filter((file) => file.toLowerCase().endsWith(".gif"));
  if (videos.length !== EXPECTED_VIDEO_COUNT) {
    problems.push(`expected ${EXPECTED_VIDEO_COUNT} MP4 outputs, found ${videos.length}: ${videos.join(", ")}`);
  }
  if (posters.length !== EXPECTED_VIDEO_COUNT) {
    problems.push(`expected ${EXPECTED_VIDEO_COUNT} poster outputs, found ${posters.length}: ${posters.join(", ")}`);
  }
  for (const video of videos) {
    const poster = video.replace(/\.mp4$/i, "-poster.png");
    if (!site.fileSet.has(poster)) {
      problems.push(`${video} has no sibling poster ${poster}`);
    }
  }
  for (const gif of gifs) {
    problems.push(`GIF output remains: ${gif}`);
  }
  return outcome(problems, `${videos.length} MP4 + ${posters.length} poster outputs paired, 0 GIFs`);
}

export const CRAWL_CHECKS = [
  ["sitemap", checkSitemap],
  ["robots", checkRobots],
  ["internal-links", checkInternalLinks],
  ["legacy-study-hashes", checkLegacyStudyHashes],
  ["media-outputs", checkMediaOutputs],
];
