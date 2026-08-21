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

Then write the study with ordinary Markdown. Use second-level headings for its sections and reference colocated images with relative paths:

```md
## The situation

What needed to change.

![Architecture overview](./architecture.svg)
```

Use the media exhibit shortcode for framed screenshots and recordings. Intrinsic dimensions prevent layout shift, while `maxWidth` controls the frame without adding one-off CSS:

```njk
{% mediaExhibit { source: "./demo.gif", alt: "Screen recording of the workflow", width: 1440, height: 820, badge: "GIF · REC", maxWidth: 840, captionLabel: "EXHIBIT 01", caption: "The workflow in action" } %}
```

`filename` defaults to the source filename and `badge` defaults to the uppercase file extension. The caption fields and `maxWidth` are optional.

The build automatically adds the study to the homepage index and reader, and creates a standalone page at `/case-studies/<folder-name>/`.

The build validates that:

- `number` is a unique positive integer.
- `slug`, `title`, and `summary` are present.
- `featured` and `spotlight` are booleans.
- Exactly one case study has `spotlight: true`.
- Topics are selected from `reliability`, `networking`, `developer experience`, `security`, `ai`, `cost`, and `delivery`.

PNG, GIF, and SVG files colocated with a case study are copied beside its generated page. SVG files must be valid standalone documents and include `xmlns="http://www.w3.org/2000/svg"` on the root element.

## Structure

- `src/content/case-studies/` — Markdown studies and their media.
- `src/content/home/` — homepage narrative sections.
- `src/_includes/` — shared Nunjucks layouts and partials.
- `src/assets/` — shared CSS and browser behavior.
- `.eleventy.js` — collections, validation, filters, and asset copying.
- `DESIGN.md` — visual-system and interaction contract.

## Deploy

Every push to `main` runs `.github/workflows/deploy.yaml`, builds the site, and publishes `_site/` to the `gh-pages` branch with the custom domain `portfolio.oponomarov.com`.
