export default {
  pagination: {
    data: "caseStudyCatalog",
    size: 1,
    alias: "redirect",
    before: (entries) => entries.filter(({ legacyFolder }) => legacyFolder),
  },
  eleventyComputed: {
    permalink: ({ redirect }) => `case-studies/${redirect.legacyFolder}/index.html`,
  },
  eleventyExcludeFromCollections: true,
};
