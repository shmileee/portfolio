# Portfolio Design System

## 1. Atmosphere & Identity

A calm, technical field report: dark by default, editorial rather than dashboard-like, with infrastructure-blue accents and one safety-red progress line. The signature is the contrast between oversized Bricolage Grotesque headlines and compact IBM Plex Mono labels, making long-form engineering work feel both personal and operationally precise. The Eleventy templates and the shared stylesheet in this repository are the visual and interaction contract; new work extends their component anatomy and token values rather than reinterpreting them.

Primary visitors are engineering leaders, hiring managers, and senior platform engineers scanning for evidence before reading deeply. The secondary user is the author, who needs new Markdown content to inherit the same hierarchy without making visual decisions.

The homepage is ordered for that scan: a hero that pairs the name with a short hiring snapshot (role, scope of ownership, AWS/Kubernetes/delivery/reliability focus, and contact links), then the full case-study index (section 01), a concise metadata-driven spotlight proof (02), the narrative arc (03), and working principles (04). The spotlight section shows the study's title, summary, `spotlightProof` sentence, and topics with a single link to the case study — never the full inline story. Primary navigation is Work, The arc, How I work, and Contact.

## 2. Color

### Palette

| Role | Token | Light | Dark | Usage |
|------|-------|-------|------|-------|
| Surface/primary | `--surface-primary` | `#F4F5F7` | `#0B1220` | Page background |
| Surface/secondary | `--surface-secondary` | `#FFFFFF` | `#111827` | Cards, reader, code blocks |
| Surface/header | `--surface-header` | `rgba(244,245,247,.95)` | `rgba(11,18,32,.96)` | Sticky navigation |
| Text/primary | `--text-primary` | `#111827` | `#FFFFFF` | Headlines and strong copy |
| Text/body | `--text-body` | `rgba(17,24,39,.84)` | `rgba(255,255,255,.78)` | Default prose |
| Text/secondary | `--text-secondary` | `rgba(17,24,39,.66)` | `rgba(255,255,255,.60)` | Navigation and metadata |
| Text/tertiary | `--text-tertiary` | `#4B5563` | `#AAB4C3` | Quiet labels |
| Border/default | `--border-default` | `rgba(17,24,39,.16)` | `rgba(255,255,255,.16)` | Controls and cards |
| Border/subtle | `--border-subtle` | `rgba(17,24,39,.09)` | `rgba(255,255,255,.08)` | Section and row dividers |
| Accent/primary | `--accent-primary` | `#1D4ED8` | `#60A5FA` | Links, labels, focus |
| Accent/soft | `--accent-soft` | `#2563EB` | `#93C5FD` | Secondary accent text |
| Accent/surface | `--accent-surface` | `rgba(37,99,235,.14)` | `rgba(37,99,235,.14)` | Featured cards and spotlight surface |
| Accent/border | `--accent-border` | `rgba(37,99,235,.40)` | `rgba(96,165,250,.35)` | Featured outlines |
| Progress | `--progress` | `#F9423A` | `#F9423A` | Reading-progress line only |
| Focus | `--focus-ring` | `#1D4ED8` | `#93C5FD` | Keyboard focus outline (opaque) |

### Rules

- Dark is the default; the user choice persists under the existing `om-theme` local-storage key.
- Blue communicates navigation, selection, and emphasis. Red is reserved for reading progress.
- Keyboard focus is a 3px solid `--focus-ring` outline with a 3px offset and no shadow; under `forced-colors: active` the outline color becomes the system `Highlight`.
- Code comments and meaningful labels inside the always-dark exhibits use opaque `#9CA3AF` so they stay readable on the dark exhibit ramp in both page themes.
- New colors are added here before use. Decorative gradients are not part of this system.

## 3. Typography

### Font Stack

- Display: `"Bricolage Grotesque", "Public Sans", sans-serif`
- Body: `"Public Sans", system-ui, sans-serif`
- Mono: `"IBM Plex Mono", ui-monospace, monospace`
- The Latin WOFF2 resources are self-hosted from `/assets/fonts/`; remote variable-font CSS is not part of the contract.

### Scale

| Level | Size | Weight | Line Height | Tracking | Usage |
|-------|------|--------|-------------|----------|-------|
| Display | `clamp(44px, 7.5vw, 92px)` | 700 | .98 | `-.025em` | Hero name |
| H1/detail | `clamp(40px, 7vw, 72px)` | 700 | 1.02 | `-.025em` | Case-study page title |
| H2 | `clamp(32px, 4.5vw, 52px)` | 700 | 1.05 | `-.02em` | Homepage sections |
| H3 | `clamp(30px, 4vw, 46px)` | 650 | 1.08 | `-.02em` | Spotlight study title |
| Reader title | `clamp(26px, 4vw, 36px)` | 650 | 1.12 | `-.015em` | Dialog reader `h2` |
| Lead | `clamp(17px, 1.6vw, 19px)` | 400 | 1.7 | 0 | Hero copy |
| Body | `16px` to `17px` | 400 | 1.7–1.75 | 0 | Long-form prose |
| Card title | `19px` | 600 | 1.25 | `-.01em` | Case-study cards |
| Label | `12px` | 500–600 | normal | `.14em`–`.18em` | Eyebrows and section markers |
| Nav | `11px` | 400 | normal | `.14em` | Header navigation |

### Rules

- Body copy never drops below 16px.
- Long-form paragraphs are left-aligned — never justified — and measure at most `min(65ch, 46rem)`; metadata and labels stay monospace.
- Markdown headings inherit this scale automatically; authors do not choose sizes. Standalone pages title with `h1` over `h2` sections; the dialog reader titles with a single `h2` and demotes fetched section headings to `h3`.

## 4. Spacing & Layout

### Base Unit

Spacing follows a 4px base with these intent tokens:

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Tight inline separation |
| `--space-2` | 8px | Compact control gaps |
| `--space-3` | 12px | Tags and card rhythm |
| `--space-4` | 16px | Paragraph and control spacing |
| `--space-5` | 20px | Mobile page gutter |
| `--space-6` | 24px | Card padding and clusters |
| `--space-8` | 32px | Subsection spacing |
| `--space-10` | 40px | Narrative beat spacing |
| `--space-12` | 48px | Desktop gutter and major gaps |
| `--space-16` | 64px | Mobile section padding |
| `--space-20` | 80px | Desktop section padding |
| `--space-24` | 96px | Large section separation |

### Grid

- Page maximum: 1140px with `clamp(20px, 5vw, 48px)` gutters.
- Reader maximum: 840px shell with `clamp(24px, 5vw, 56px)` padding; the standalone study column is also 840px wide.
- Card grid: `repeat(auto-fill, minmax(min(17.5rem, 100%), 1fr))`.
- Breakpoints: at 900px the header wraps into a compact multi-row layout (with matching `scroll-padding-top`), the back-to-top control joins the document flow, and reader padding tightens; at 480px hero actions and footer columns stack.
- Primary content must remain one readable column at 375px with no horizontal page scroll.

## 5. Components

### Sticky Header
- **Structure**: brand anchor, section navigation (Work, The arc, How I work, Contact), theme button, 2px progress line.
- **States**: nav and theme controls have default, hover, active, and visible focus states.
- **Layout**: at 900px and below the header wraps to multiple rows instead of clipping, and `scroll-padding-top` grows to keep anchored sections visible below it.
- **Accessibility**: semantic `header`/`nav`; theme button exposes its action.
- **Motion**: progress width follows scroll without easing; control transitions use opacity/color only.

### Section Heading
- **Structure**: mono eyebrow followed by display heading and optional Markdown introduction.
- **Variants**: hero, numbered homepage section, case-study header.
- **Accessibility**: heading levels remain sequential.

### Arc Step
- **Structure**: numbered marker, Markdown explanation, related-study chips, downward connector.
- **States**: chips have hover, active, and focus treatment.
- **Layout**: `56px minmax(0, 1fr)` grid, 40px square marker with 6px radius, 48px step spacing, connector at 19px and arrow at 19.5px.

### Topic Filter
- **Structure**: a button per known topic with `aria-pressed`.
- **States**: default, hover/focus, selected.
- **Accessibility**: filtering never removes keyboard access to visible cards and announces the result count.

### Case Study Card
- **Structure**: number line (with optional `featured` marker and metadata-driven `cardLabel`), title, summary, topics, action.
- **Variants**: default and featured; every card, including the spotlight study's, is a real `<a>` pointing at the study's canonical `/case-studies/…/` route.
- **Behavior**: cards carry `data-open-study` so the homepage reader can intercept an unmodified primary click as a progressive enhancement; modified clicks, middle clicks, copy-link, and JavaScript-disabled visitors get the standalone page.
- **States**: hover/focus strengthens the border; active returns to rest.
- **Accessibility**: real anchor, never a clickable `div` or a button.

### Case Study Reader
- **Structure**: one reusable native dialog shell — sticky close control, metadata line, a single `h2` title with `tabindex="-1"`, an `aria-live` status target, one prose container, and previous/next controls — plus an embedded JSON manifest listing each study's number, canonical URL, title, and topics. No study body is pre-rendered into the page.
- **Loading**: opening a study fetches its canonical standalone page on demand, extracts `.case-detail-prose`, rewrites relative `src`/`poster`/`href` values against the response URL, demotes fetched `h2` headings to `h3`, and caches the result so each study is requested at most once per page session. While loading, the shell is `aria-busy` and the status region announces progress.
- **Failure**: if the fetch fails or the response has no canonical prose, the browser navigates to the study's standalone URL instead of leaving an empty dialog.
- **History**: opening from the page pushes one marked `#study-N` history entry; in-reader previous/next and prose-link navigation replace it. Browser Back closes an open reader; the explicit close control consumes the marked entry via `history.back()`, so Back never reopens it. Arriving on an unmarked `#study-N` hash still opens the reader, and closing it then rewrites the URL to path plus query with `replaceState`.
- **Interception**: only unmodified primary same-tab clicks on `[data-open-study]` anchors (or canonical study links inside fetched prose) are intercepted; modifier, middle-click, `target`, and `download` activations pass through to the browser. There is no arrow-key study navigation — unmodified ArrowLeft/ArrowRight are never intercepted.
- **Focus**: focus starts on the study title, Tab and Shift+Tab wrap among the dialog's visible controls, and closing restores focus to the invoking element. Escape, backdrop click, and the close control all close the dialog; body scroll locks while it is open.
- **Layout**: viewport-scrolling scrim with `clamp(16px, 4vw, 48px)` inset, 840px shell, 12px radius, and a close button absolutely anchored at `right: 0; top: -14px` inside a sticky `top: 16px; height: 0` toolbar.

### Exhibit Frame
- **Structure**: dark 8px-radius frame, 1px subtle border, 10px × 16px header, three 9px dots, filename, compact language badge, and a horizontally scrollable body.
- **Variants**: code, image, video recording, and inline architecture diagram. Image and video media share identical frame styling.
- **Video**: an `.mp4` source renders a native `<video>` with `controls`, a required poster image, `playsinline`, and `preload="metadata"`; it starts paused and never autoplays or loops. Recordings are converted locally before commit; the build does not transcode.
- **Typography**: filename 12px mono; badge 10px mono with `.12em` tracking; code 13px mono at 1.75 line height with 20px × 24px padding.
- **Theme**: exhibits intentionally remain dark in both page themes and use the dark token ramp.
- **Accessibility**: authored filename/language remain visible text; images keep descriptive alt text and videos an equivalent `aria-label`; wide bodies scroll within the frame.

### Architecture Diagram
- **Structure**: authored SVG is inserted inline inside an exhibit wrapper so the original CSS custom properties, marker IDs, and geometry remain active.
- **Layout**: diagram SVGs are width 100%, height auto, max-width 720px, and centered; the wrapper does not redraw or approximate the source.

### Markdown Prose
- **Structure**: headings, paragraphs, links, lists, blockquotes, code, and responsive exhibits.
- **Variants**: dialog reader and standalone detail page. The standalone page renders authored `h2` sections under its `h1`; the reader shows the same content with sections demoted to `h3` under its `h2` title.
- **Accessibility**: links remain underlined in prose; paragraphs are left-aligned; code scrolls within its own box; images have authored alt text.

### Back To Top
- **Structure**: on wide viewports, a fixed button appearing after meaningful scroll; at 900px and below it becomes a static in-flow control aligned right before the footer, so it never overlaps content.
- **States**: hidden, visible (`data-visible` gates both placements), hover/focus.
- **Motion**: opacity and transform only.

## 6. Motion & Interaction

| Type | Duration | Easing | Usage |
|------|----------|--------|-------|
| Micro | 130ms | ease-out | Color, border, press feedback |
| Standard | 150ms | ease | Theme surface shift, back-to-top visibility |
| Dialog | 220ms | `cubic-bezier(.16,1,.3,1)` | Reader entrance |
| Cursor | 1.1s | `steps(1)` | Hero cursor, visible through 55% of each cycle |

- Animate only `transform`, `opacity`, and color-related properties.
- `prefers-reduced-motion: reduce` disables smooth scrolling and non-essential transitions.
- Theme, filters, expansion, reader navigation, and hashes are functional state changes, not decorative motion.

## 7. Depth & Surface

The strategy is **mixed tonal shift plus borders**, with no decorative shadows on ordinary cards. The modal reader alone may use a deep ambient shadow to separate it from the backdrop. Featured content uses the accent surface and accent border; default content uses the secondary surface and subtle border.

## 8. Accessibility Constraints & Accepted Debt

### Constraints

- Target WCAG 2.2 AA: 4.5:1 body contrast and 3:1 large text/UI contrast.
- Every interactive element has a visible keyboard focus state: a 3px solid opaque `--focus-ring` outline offset by 3px, overridden to the system `Highlight` color under forced colors.
- Named non-inline controls (header, hero actions, arc chips, filters, grid toggle, reader controls, back link, detail footer, contact links, back-to-top) enforce a 40px (2.5rem) minimum hit area; inline prose links are exempt.
- Native landmarks, headings, buttons, links, and dialog behavior take precedence over recreating legacy non-semantic wrappers.
- Reader focus is trapped by an explicit Tab/Shift+Tab handler among the dialog's visible controls, starts on the study title, and is restored to the invoker on close; the floating close control must remain visible and clickable after internal scrolling.
- Videos expose native controls and never autoplay; theme respects saved user choice; motion respects `prefers-reduced-motion`.
- Content must remain legible under 200% zoom, narrow mobile width, long titles, and unbroken code strings.

### Accepted Debt

| Item | Location | Why accepted | Owner / Exit |
|------|----------|--------------|--------------|
| No accepted design or accessibility debt | — | — | Record future debt here before release |
