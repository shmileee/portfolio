import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { basename, dirname, extname, relative, resolve } from "node:path";
import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";

import { registerCaseStudyFeatures } from "./src/lib/eleventy-case-studies.js";

const byNumber = (left, right) => left.data.number - right.data.number;
const BROWSER_ASSET_PATHS = [
  "src/assets/css/site.css",
  "src/assets/js/reader-focus.js",
  "src/assets/js/reader-model.js",
  "src/assets/js/reader.js",
  "src/assets/js/site.js",
];

function createAssetVersion() {
  const hash = createHash("sha256");
  for (const path of BROWSER_ASSET_PATHS) hash.update(readFileSync(resolve(path)));
  return hash.digest("hex").slice(0, 12);
}

function parseCodeFenceInfo(info) {
  const language = info.trim().split(/\s+/, 1)[0] || "text";
  const filenameMatch = info.match(/\bfilename=(?:"([^"]+)"|'([^']+)'|([^\s]+))/);

  return {
    filename: filenameMatch?.[1] || filenameMatch?.[2] || filenameMatch?.[3] || "",
    language,
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderMediaExhibit(options) {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("mediaExhibit expects an options object");
  }

  for (const key of ["source", "alt"]) {
    if (typeof options[key] !== "string" || options[key].trim() === "") {
      throw new TypeError(`mediaExhibit: ${key} must be a non-empty string`);
    }
  }

  const width = Number(options.width);
  const height = Number(options.height);
  if (!Number.isInteger(width) || width < 1 || !Number.isInteger(height) || height < 1) {
    throw new TypeError("mediaExhibit: width and height must be positive integers");
  }

  const isVideo = extname(options.source).toLowerCase() === ".mp4";
  if (isVideo && (typeof options.poster !== "string" || options.poster.trim() === "")) {
    throw new TypeError("mediaExhibit: poster must be a non-empty string for MP4 sources");
  }

  const maxWidth = options.maxWidth === undefined ? null : Number(options.maxWidth);
  if (maxWidth !== null && (!Number.isInteger(maxWidth) || maxWidth < 1)) {
    throw new TypeError("mediaExhibit: maxWidth must be a positive integer");
  }

  const filename = options.filename || basename(options.source);
  const badge = options.badge || extname(options.source).slice(1).toUpperCase();
  const style = maxWidth === null ? "" : ` style="--media-exhibit-width: ${maxWidth}px"`;
  const caption = options.caption
    ? `<figcaption class="exhibit-caption">${options.captionLabel ? `<span>${escapeHtml(options.captionLabel)}</span> — ` : ""}${escapeHtml(options.caption)}</figcaption>`
    : "";
  const media = isVideo
    ? `<video src="${escapeHtml(options.source)}" poster="${escapeHtml(options.poster)}" width="${width}" height="${height}" controls playsinline preload="metadata" aria-label="${escapeHtml(options.alt)}"></video>`
    : `<img src="${escapeHtml(options.source)}" alt="${escapeHtml(options.alt)}" width="${width}" height="${height}" loading="lazy" decoding="async">`;

  return `<figure class="media-exhibit" data-exhibit${style}>
  <div class="media-exhibit-frame">
    <div class="exhibit-toolbar">
      <span class="exhibit-dots" aria-hidden="true"><i></i><i></i><i></i></span>
      <span class="exhibit-filename">${escapeHtml(filename)}</span>
      <span class="exhibit-badge">${escapeHtml(badge)}</span>
    </div>
    <div class="media-exhibit-stage">
      ${media}
    </div>
  </div>
  ${caption}
</figure>`;
}

function readColocatedSvg(inputPath, source, label) {
  const inputDirectory = dirname(resolve(inputPath));
  const diagramPath = resolve(inputDirectory, source);
  const pathFromInput = relative(inputDirectory, diagramPath);

  if (pathFromInput.startsWith("..") || pathFromInput === "") {
    throw new TypeError(`${inputPath}: diagram path must point to a colocated SVG file`);
  }

  return readFileSync(diagramPath, "utf8").replace(
    /^<svg\b/,
    `<svg aria-label="${escapeHtml(label)}"`,
  );
}

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(syntaxHighlight, {
    errorOnInvalidLanguage: false,
    templateFormats: ["md"],
  });

  eleventyConfig.amendLibrary("md", (markdown) => {
    const renderFence = markdown.renderer.rules.fence;

    markdown.renderer.rules.fence = (tokens, index, options, environment, renderer) => {
      const { filename, language } = parseCodeFenceInfo(tokens[index].info);
      const code = renderFence(tokens, index, options, environment, renderer);

      if (!filename) {
        return code;
      }

      return `<div class="code-exhibit" data-exhibit>
  <div class="exhibit-toolbar">
    <span class="exhibit-dots" aria-hidden="true"><i></i><i></i><i></i></span>
    <span class="exhibit-filename">${escapeHtml(filename)}</span>
    <span class="exhibit-badge">${escapeHtml(language.toUpperCase())}</span>
  </div>
  ${code}
</div>`;
    };
  });

  eleventyConfig.addPassthroughCopy({ assets: "assets" });
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy("src/content/case-studies/**/*.{mp4,png,svg}", {
    mode: "html-relative",
    failOnError: true,
  });

  eleventyConfig.addGlobalData("assetVersion", createAssetVersion);
  eleventyConfig.addFilter("pad2", (value) => String(value).padStart(2, "0"));
  eleventyConfig.addFilter("findByKey", (items, key) => items.find((item) => item.data.key === key));
  registerCaseStudyFeatures(eleventyConfig, escapeHtml);

  eleventyConfig.addShortcode("diagram", function (source, title, label) {
    const svg = readColocatedSvg(this.page.inputPath, source, label);

    return `<div class="diagram-exhibit" data-exhibit>
  <div class="diagram-exhibit-label">${escapeHtml(title)}</div>
  ${svg}
</div>`;
  });
  eleventyConfig.addShortcode("mediaExhibit", renderMediaExhibit);

  eleventyConfig.addShortcode(
    "diagramPair",
    function (firstSource, firstTitle, secondSource, secondTitle, label) {
      const firstSvg = readColocatedSvg(this.page.inputPath, firstSource, `${label}: ${firstTitle}`);
      const secondSvg = readColocatedSvg(this.page.inputPath, secondSource, `${label}: ${secondTitle}`);

      return `<div class="diagram-exhibit" data-exhibit>
  <div class="diagram-exhibit-label">${escapeHtml(firstTitle)}</div>
  ${firstSvg}
  <div class="diagram-exhibit-label diagram-exhibit-label-secondary">${escapeHtml(secondTitle)}</div>
  ${secondSvg}
</div>`;
    },
  );

  eleventyConfig.addCollection("arcBeats", (collectionApi) =>
    collectionApi.getFilteredByTag("arcBeat").sort(byNumber),
  );
  eleventyConfig.addCollection("principles", (collectionApi) =>
    collectionApi.getFilteredByTag("principle").sort(byNumber),
  );
  eleventyConfig.addCollection("homeSections", (collectionApi) =>
    collectionApi.getFilteredByTag("homeSection"),
  );

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site",
    },
    templateFormats: ["md", "njk"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
