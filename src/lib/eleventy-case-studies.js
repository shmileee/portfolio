import caseStudyCatalog from "../_data/caseStudyCatalog.js";
import { getCaseStudyCatalogEntryById } from "./case-study-catalog.js";

const TOPICS = new Set([
  "reliability",
  "networking",
  "developer experience",
  "security",
  "ai",
  "cost",
  "delivery",
]);

const byNumber = (left, right) => left.data.number - right.data.number;
const sortByNumber = (items) => [...items].sort(byNumber);

function findById(items, id) {
  const sortedItems = sortByNumber(items);
  const index = sortedItems.findIndex((item) => item.data.caseStudyId === id);
  if (index === -1) throw new RangeError(`Case study id ${String(id)} was not found`);
  return { index, sortedItems };
}

function validateCaseStudies(studies) {
  const ids = new Set();
  const numbers = new Set();

  for (const study of studies) {
    const {
      cardLabel,
      caseStudyId,
      featured,
      number,
      spotlight,
      spotlightProof,
      summary,
      title,
      topics,
    } = study.data;
    const location = study.inputPath;

    if (typeof caseStudyId !== "string" || ids.has(caseStudyId)) {
      throw new TypeError(`${location}: caseStudyId must be a unique catalog id`);
    }
    ids.add(caseStudyId);
    if (!Number.isInteger(number) || number < 1) {
      throw new TypeError(`${location}: number must be a positive integer`);
    }
    if (numbers.has(number)) {
      throw new TypeError(`${location}: duplicate case-study number ${number}`);
    }
    numbers.add(number);

    for (const [name, value] of Object.entries({ summary, title })) {
      if (typeof value !== "string" || value.trim() === "") {
        throw new TypeError(`${location}: ${name} must be a non-empty string`);
      }
    }
    if (!Array.isArray(topics) || topics.length === 0 || topics.some((topic) => !TOPICS.has(topic))) {
      throw new TypeError(`${location}: topics must contain only known portfolio topics`);
    }
    if (typeof featured !== "boolean" || typeof spotlight !== "boolean") {
      throw new TypeError(`${location}: featured and spotlight must be booleans`);
    }
    if (cardLabel !== undefined && (typeof cardLabel !== "string" || cardLabel.trim() === "")) {
      throw new TypeError(`${location}: cardLabel must be a non-empty string when defined`);
    }
    if (spotlight && (typeof spotlightProof !== "string" || spotlightProof.trim() === "")) {
      throw new TypeError(
        `${location}: the spotlight case study must define a non-empty spotlightProof`,
      );
    }
  }

  if (studies.filter((study) => study.data.spotlight).length !== 1) {
    throw new TypeError("Case studies must define exactly one spotlight entry");
  }
  const catalogIds = caseStudyCatalog.map(({ id }) => id);
  if (studies.length !== catalogIds.length || catalogIds.some((id) => !ids.has(id))) {
    throw new TypeError("Every case-study catalog entry must resolve to exactly one content folder");
  }
}

export function registerCaseStudyFeatures(eleventyConfig, escapeHtml) {
  eleventyConfig.addFilter("findByCaseStudyId", (items, id) => {
    const { index, sortedItems } = findById(items, id);
    return sortedItems[index];
  });
  eleventyConfig.addFilter("studyNeighbors", (items, id) => {
    const { index, sortedItems } = findById(items, id);
    return {
      previous: sortedItems[(index - 1 + sortedItems.length) % sortedItems.length],
      next: sortedItems[(index + 1) % sortedItems.length],
    };
  });
  eleventyConfig.addFilter("findSpotlight", (items) =>
    items.find((item) => item.data.spotlight),
  );
  eleventyConfig.addFilter("indexOrder", (items) => {
    const sorted = sortByNumber(items);
    return [
      ...sorted.filter((item) => item.data.featured),
      ...sorted.filter((item) => !item.data.featured),
    ];
  });
  eleventyConfig.addShortcode("caseStudyLink", (id, label = "") => {
    const entry = getCaseStudyCatalogEntryById(id);
    const suffix = label === "" ? "" : ` — ${label}`;
    return `<a href="/case-studies/${entry.folder}/">case study ${entry.number}${escapeHtml(suffix)}</a>`;
  });
  eleventyConfig.addCollection("caseStudies", (collectionApi) => {
    const studies = sortByNumber(collectionApi.getFilteredByTag("caseStudy"));
    validateCaseStudies(studies);
    return studies;
  });
}
