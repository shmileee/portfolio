export default {
  tags: ["caseStudy"],
  layout: "layouts/case-study.njk",
  eleventyComputed: {
    permalink: ({ number, slug }) =>
      `/case-studies/${String(number).padStart(2, "0")}-${slug}/index.html`,
  },
};
