# Portfolio

Source for [portfolio.oponomarov.com](https://portfolio.oponomarov.com), built with [Eleventy](https://www.11ty.dev/).

## Local preview

Requires Node.js 20 or newer.

```sh
npm ci
npm run dev
```

Open <http://localhost:8080>. Eleventy watches the source files and refreshes the preview after edits.

Create a production build with:

```sh
npm run build
```

The generated static site is written to `_site/`.

## Verify and test

```sh
npm run verify:build
```

Builds the site, then runs `scripts/verify-build.mjs` against `_site/`: it checks the 23 canonical study routes, internal link targets, sitemap/robots/404 contracts, media outputs, the homepage payload budget, and the reader manifest.

Browser tests use [Playwright](https://playwright.dev/) with Chromium. Install the browser once, then run the suite:

```sh
npx playwright install chromium
npm run test:e2e
```

Run a single file when iterating, for example:

```sh
npm run test:e2e -- tests/reader.spec.js --project=chromium
npm run test:e2e -- tests/responsive-accessibility.spec.js --project=chromium
```

`npm run test:e2e:headed` runs the same suite with a visible browser.

## Add a case study

Create a folder under `src/content/case-studies/` containing an `index.md` file:

```text
src/content/case-studies/24-example-study/
├── index.md
└── architecture.svg
```

Start the Markdown file with this front matter:

```yaml
---
number: 24
slug: example-study
title: Example study
summary: A short sentence used on the case-study card.
topics:
  - reliability
featured: false
spotlight: false
---
```

Two optional fields refine how a study appears on the homepage:

- `cardLabel` — a short non-empty string rendered on the card after the number and any `featured` marker, for example `cardLabel: sequel`.
- `spotlightProof` — required on the one study with `spotlight: true`. One authored sentence of outcome language, shown in the homepage spotlight section next to the summary.

Then write the study with ordinary Markdown. Use second-level headings for its sections and reference colocated images with relative paths:

```md
## The situation

What needed to change.

![Architecture overview](./architecture.svg)
```

Use the media exhibit shortcode for framed screenshots and recordings. Intrinsic dimensions prevent layout shift, while `maxWidth` controls the frame without adding one-off CSS. A screenshot renders as a lazy-loaded image (`loading="lazy" decoding="async"`):

```njk
{% mediaExhibit { source: "./dashboard.png", alt: "Screenshot of the rollout dashboard", width: 1654, height: 676, maxWidth: 840, captionLabel: "EXHIBIT 01", caption: "The dashboard after rollout" } %}
```

An `.mp4` source renders as a native video with `controls`, `playsinline`, and `preload="metadata"`; it starts paused and never autoplays or loops. MP4 sources must supply a non-empty `poster` (the build fails without one):

```njk
{% mediaExhibit { source: "./demo.mp4", poster: "./demo-poster.png", alt: "Screen recording of the workflow", width: 1440, height: 820, badge: "MP4 · VIDEO", maxWidth: 840, captionLabel: "EXHIBIT 02", caption: "The workflow in action" } %}
```

`filename` defaults to the source filename and `badge` defaults to the uppercase file extension. The caption fields and `maxWidth` are optional. `source`, `alt`, and (for MP4) `poster` must be non-empty strings; `width`, `height`, and `maxWidth` must be positive integers.

Convert recordings locally before committing them; the build never transcodes. Encode H.264 MP4 with even dimensions and extract a first-frame PNG poster, for example with ffmpeg:

```sh
ffmpeg -i recording.gif -an -c:v libx264 -crf 23 -preset slow -pix_fmt yuv420p -movflags +faststart -vf "pad=ceil(iw/2)*2:ceil(ih/2)*2" demo.mp4
ffmpeg -i demo.mp4 -frames:v 1 demo-poster.png
```

The build creates a standalone page at `/case-studies/<folder-name>/` — the canonical route, named after the study folder. Each standalone page has canonical previous and next study links in numeric order, wrapping between Studies 01 and 23, followed by separate links back to the portfolio index and contact footer.

Homepage cards, arc labels, and the spotlight link all use those canonical study URLs. An ordinary primary same-tab click is progressively enhanced into the reader, which fetches the canonical page on demand; modified clicks, middle clicks, Copy Link Address, and JavaScript-disabled navigation continue to use the standalone URL. Media can use its authored wider breakout on the standalone page, while media fetched into the reader is contained to the reader prose width. The sitemap lists the homepage plus every study route.

The build validates that:

- `number` is a unique positive integer.
- `slug`, `title`, and `summary` are present.
- `featured` and `spotlight` are booleans.
- Exactly one case study has `spotlight: true`, and that study defines a non-empty `spotlightProof`.
- `cardLabel`, when present, is a non-empty string.
- Topics are selected from `reliability`, `networking`, `developer experience`, `security`, `ai`, `cost`, and `delivery`.
- MP4 media exhibits declare a poster.

MP4, PNG, and SVG files colocated with a case study are copied beside its generated page. SVG files must be valid standalone documents and include `xmlns="http://www.w3.org/2000/svg"` on the root element.

## Structure

- `src/content/case-studies/` — Markdown studies and their media.
- `src/content/home/` — homepage narrative sections.
- `src/_includes/` — shared Nunjucks layouts and partials.
- `src/assets/` — shared CSS and browser behavior.
- `.eleventy.js` — collections, validation, filters, and asset copying.
- `scripts/verify-build.mjs` — static checks on the generated `_site/` output.
- `tests/` — Playwright browser suites; `playwright.config.js` configures them.
- `DESIGN.md` — visual-system and interaction contract.

## Deploy

Every push to `main` runs `.github/workflows/deploy.yaml`, builds the site, and publishes `_site/` to the `gh-pages` branch with the custom domain `portfolio.oponomarov.com`.
