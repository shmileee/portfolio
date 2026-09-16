# portfolio

Markdown content repository for the portfolio section of [oponomarov.com](https://oponomarov.com/). It contains no site code, build tooling, or templates — only content collections. The site is **rendered by [shmileee/oponomarov.com](https://github.com/shmileee/oponomarov.com)** (the Astro engine), which pulls this repository at build time and publishes the portfolio under `/`.

Pushes to `main` trigger `.github/workflows/notify-engine.yaml`, which dispatches a `portfolio-updated` event so the engine rebuilds with the latest content.

## Layout and frontmatter contract

The engine consumes four collections from `content/`. Frontmatter is YAML and must follow the contract below.

### `content/case-studies/` — caseStudies collection

One folder per case study, matched as `**/index.md`: `content/case-studies/<slug>/index.md`, where the folder name is the slug. Images and other assets referenced by a study live alongside its `index.md` in the same folder.

Frontmatter fields:

| Field            | Type            | Notes                                                                                                                                                                                       |
| ---------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`          | string          | Case study title                                                                                                                                                                            |
| `summary`        | string          | One-line summary: the dek on the study page and the card copy in the index. Inline Markdown (backticks, `**strong**`) renders                                                              |
| `description`    | string          | The meta and Open Graph description when the summary is too short to stand as a search snippet (aim for 80–160 characters). Optional; falls back to `summary`                             |
| `topics`         | list of strings | Topic tags as slugs (e.g. `reliability`, `developer experience`); the homepage filter row is the union of every study's topics. The engine shows them with display names (`ai` → AI) |
| `order`          | integer         | Position in the published order. The displayed case number is the position, so inserting a study renumbers the ones after it. Optional: an unnumbered study follows the numbered ones alphabetically |
| `aliases`        | list of slugs   | Old URLs for this study (`12-the-fleet-that-patches-itself`) and old reader ids (`fleet-patching`). Each redirects to the folder and still opens the homepage reader. Optional              |
| `role`           | string          | "My role" line in the proof list (cards, spotlight, study header). Optional, shown with `evidence`                                                                                         |
| `evidence`       | string          | "Evidence" line in the proof list. Optional, shown with `role`                                                                                                                              |
| `featured`       | boolean         | Featured placement on the landing page                                                                                                                                                      |
| `spotlight`      | boolean         | Spotlight placement; the homepage spotlight section renders only when one study carries it                                                                                                  |
| `spotlightProof` | string          | The spotlight's one-paragraph proof. Optional                                                                                                                                               |
| `cardLabel`      | string          | Extra label after the card number (`sequel`). Optional                                                                                                                                      |

The folder name is the study's identity: its URL slug, what `content/arc/`
links to, and what the homepage reader opens. Renaming a folder is a move;
add the old folder name to `aliases` so the old URL keeps working.

### `content/home/` — home collection

Flat `*.md` files, one per home-page block (`hero.md`, `arc.md`, `hiring.md`). Every file carries a `key` identifying the block, plus block-specific display fields (e.g. `title`, `eyebrow`, `primaryCta`/`primaryHref`, `secondaryCta`/`secondaryHref`).

### `content/arc/` — arc collection

Flat, number-prefixed `*.md` files (`01-…` through `06-…`) forming the career-arc timeline. Frontmatter: `number` (integer, ordering) and `links` (list of `{study, label}`, where `study` is a case-study **folder name**; a link to a folder that does not exist fails the site build with the offending reference).

### `content/principles/` — principles collection

Flat, number-prefixed `*.md` files. Frontmatter: `number` (integer, ordering) and `title` (string).

## Editing

Change Markdown here, open a pull request into `main`, merge. The engine takes care of everything else — do not add build tooling to this repository.
