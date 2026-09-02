# portfolio

Markdown content repository for the portfolio section of [oponomarov.com](https://oponomarov.com/). It contains no site code, build tooling, or templates — only content collections. The site is **rendered by [shmileee/oponomarov.com](https://github.com/shmileee/oponomarov.com)** (the Astro engine), which pulls this repository at build time and publishes the portfolio under `/`.

Pushes to `main` trigger `.github/workflows/notify-engine.yaml`, which dispatches a `portfolio-updated` event so the engine rebuilds with the latest content.

## Layout and frontmatter contract

The engine consumes four collections from `content/`. Frontmatter is YAML and must follow the contract below.

### `content/case-studies/` — caseStudies collection

One folder per case study, matched as `**/index.md`: `content/case-studies/<slug>/index.md`, where the folder name is the slug. Images and other assets referenced by a study live alongside its `index.md` in the same folder.

Frontmatter fields:

| Field       | Type            | Notes                                  |
| ----------- | --------------- | -------------------------------------- |
| `title`     | string          | Case study title                       |
| `summary`   | string          | One-line summary shown in the index    |
| `topics`    | list of strings | Topic tags (e.g. `reliability`)        |
| `featured`  | boolean         | Featured placement on the landing page |
| `spotlight` | boolean         | Spotlight placement                    |

### `content/home/` — home collection

Flat `*.md` files, one per home-page block (`hero.md`, `arc.md`, `hiring.md`). Every file carries a `key` identifying the block, plus block-specific display fields (e.g. `title`, `eyebrow`, `primaryCta`/`primaryHref`, `secondaryCta`/`secondaryHref`).

### `content/arc/` — arc collection

Flat, number-prefixed `*.md` files (`01-…` through `06-…`) forming the career-arc timeline. Frontmatter: `number` (integer, ordering) and `links` (list of `{study, label}` references into the case-studies collection).

### `content/principles/` — principles collection

Flat, number-prefixed `*.md` files. Frontmatter: `number` (integer, ordering) and `title` (string).

## Editing

Change Markdown here, open a pull request into `main`, merge. The engine takes care of everything else — do not add build tooling to this repository.
