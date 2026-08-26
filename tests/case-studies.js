import caseStudyCatalog from "../src/_data/caseStudyCatalog.js";

export const caseStudies = caseStudyCatalog.map((entry) => ({
  ...entry,
  url: `/case-studies/${entry.folder}/`,
}));

const studiesById = new Map(caseStudies.map((entry) => [entry.id, entry]));

export function caseStudy(id) {
  const entry = studiesById.get(id);
  if (!entry) throw new RangeError(`Unknown case-study id: ${String(id)}`);
  return entry;
}

export function caseStudyHash(id) {
  return `#study-${caseStudy(id).id}`;
}
