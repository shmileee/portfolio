import { basename, dirname } from "node:path";

import { getCaseStudyCatalogEntry } from "../../lib/case-study-catalog.js";

function catalogEntry(page) {
  return getCaseStudyCatalogEntry(basename(dirname(page.inputPath)));
}

export default {
  tags: ["caseStudy"],
  layout: "layouts/case-study.njk",
  eleventyComputed: {
    caseStudyId: ({ page }) => catalogEntry(page).id,
    legacyNumber: ({ page }) => catalogEntry(page).legacyNumber,
    number: ({ page }) => catalogEntry(page).number,
    permalink: ({ page }) => `/case-studies/${catalogEntry(page).folder}/index.html`,
  },
};
