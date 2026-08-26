# Portfolio Design System

## 1. Atmosphere & Identity

A calm, technical field report: dark by default, editorial rather than dashboard-like, with infrastructure-blue accents and one safety-red progress line. The signature is the contrast between oversized Bricolage Grotesque headlines and compact IBM Plex Mono labels, making long-form engineering work feel both personal and operationally precise. The Eleventy templates and the shared stylesheet in this repository are the visual and interaction contract; new work extends their component anatomy and token values rather than reinterpreting them.

Primary visitors are engineering leaders, hiring managers, and senior platform engineers scanning for evidence before reading deeply. The secondary user is the author, who needs new Markdown content to inherit the same hierarchy without making visual decisions.

The homepage is ordered for that scan: a hero pairing the name with a short hiring snapshot (role, scope of ownership, and AWS/Kubernetes/delivery/reliability focus), then the six-beat four-year platform arc (section 01), a concise metadata-driven spotlight proof (02), the full case-study index (03), and working principles (04). The hero actions link to the case-study index and contact footer. GitHub and LinkedIn live in that footer rather than the hero. The spotlight section shows the study's title, summary, `spotlightProof` sentence, and topics with a single link to the case study — never the full inline story. Primary navigation is Work, The arc, How I work, and Contact.

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
- Code exhibits use the active theme's `--code-surface`, `--code-toolbar`, `--code-border`, `--code-text`, `--code-muted`, `--code-keyword`, and `--code-value` tokens. Inline diagrams use `--diagram-surface` plus theme-resolved SVG variables such as `--bg`, `--w88`, `--w45`, `--w42`, `--w5`, `--w7`, and `--ab4`, so both surfaces become light with the page theme and preserve their contrast roles.
- Image and video media frames keep their intentionally dark frame and stage palette in both page themes; they do not inherit the adaptive code/diagram surfaces.
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
- Breakpoints: at 900px the header wraps into a compact multi-row layout (with matching `scroll-padding-top`), the back-to-top control joins the document flow, and reader padding tightens; at 600px and below reader and standalone adjacent-study cards stack into one column; at 480px hero actions and footer columns stack.
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

### Evidence Summary
- **Structure**: one compact description list using the existing `summary` as Impact plus optional `role` and `evidence` metadata as My role and Evidence. The three values are one authored unit; partial summaries do not render.
- **Placement**: used selectively on the five strongest studies in featured cards, the spotlight, and canonical study headers. It extends the existing metadata system rather than introducing a second summary source.
- **Layout**: labels stay mono and quiet; values remain readable body copy. Card summaries use a compact stacked treatment, while spotlight and standalone variants may use a three-column grid that collapses to one column at narrow widths.
- **Accessibility**: semantic `dl`, `dt`, and `dd` elements preserve label/value relationships without adding redundant headings.

### Case Study Reader
- **Structure**: one reusable native dialog shell — a sticky toolbar containing an icon-only Close button with the accessible name “Close case study,” metadata line, a single `h2` title with `tabindex="-1"`, an `aria-live` status target, one prose container, and previous/next controls — plus an embedded JSON manifest listing each study's number, canonical URL, title, and topics. Each adjacent control has separate direction kicker, case number, and title nodes. No study body is pre-rendered into the page.
- **Loading**: opening a study fetches its canonical standalone page on demand, extracts `.case-detail-prose`, rewrites relative `src`/`poster`/`href` values against the response URL, demotes fetched `h2` headings to `h3`, and caches the result so each study is requested at most once per page session. While loading, the shell is `aria-busy` and the status region announces progress.
- **Failure**: if the fetch fails or the response has no canonical prose, the browser navigates to the study's standalone URL instead of leaving an empty dialog.
- **History**: opening from the page pushes one marked `#study-N` history entry; in-reader previous/next and prose-link navigation replace it. Browser Back closes an open reader; the explicit close control consumes the marked entry via `history.back()`, so Back never reopens it. Arriving on an unmarked `#study-N` hash still opens the reader, and closing it then rewrites the URL to path plus query with `replaceState`.
- **Interception**: homepage cards, arc labels, and spotlight entry points are canonical `/case-studies/…/` anchors carrying `[data-open-study]`. Only an ordinary unmodified primary same-tab activation is progressively enhanced into the reader; modified or middle-button activation, `target`, `download`, Copy Link Address, and JavaScript-disabled use retain the canonical standalone URL. While the reader is open, ordinary canonical study links inside fetched prose receive the same enhancement.
- **Keyboard navigation**: unmodified `ArrowLeft` and `ArrowRight` move to the previous and next manifest entries with wraparound and replace the marked reader history entry. Modified arrows remain native. Arrow navigation is also guarded when the event originates in or below editable/form targets (`input`, `textarea`, `select`, `option`, or `[contenteditable]`), media (`audio` or `video`), an inline `.diagram-exhibit`, or ARIA textbox, searchbox, spinbutton, and slider roles, preserving caret, value, playback, and local diagram-scrolling behavior.
- **Focus**: focus starts on the study title, Tab and Shift+Tab wrap among the dialog's visible controls, and closing restores focus to the invoking element. Escape, backdrop click, and the close control all close the dialog; body scroll locks while it is open.
- **Layout**: viewport-scrolling scrim with `clamp(16px, 4vw, 48px)` inset, an 840px shell, and 12px radius. The toolbar keeps normal sticky height and spacing so its 44px circular Close control remains visible and clickable during deep reader scroll. Previous and next are equal `minmax(0, 1fr)` cards in a two-column grid, with the next card aligned to the right; their kicker, number, and naturally wrapping title never truncate, and the pair stacks at 600px and below.

### Standalone Study Navigation
- **Structure**: every canonical standalone study ends with an “Adjacent case studies” navigation containing ordinary previous and next anchors with the same separate kicker, case number, and title anatomy as the reader controls.
- **Sequence**: neighbors follow numeric study order and wrap in both directions, including Study 01 previous to Study 23 and Study 23 next to Study 01. These links stay canonical anchors without reader hooks, so they work without JavaScript.
- **Separation**: the adjacent-study pair is distinct from the following “Portfolio navigation,” which continues to link to View all work and Contact.
- **Layout**: the links use the same equal two-column card geometry, natural title wrapping, directional alignment, and 600px one-column breakpoint as the reader controls.

### Exhibit Frame
- **Structure**: 8px-radius frame, 1px border, 10px × 16px header, three 9px dots, filename, compact language badge, and a horizontally scrollable body.
- **Variants**: code, image, video recording, and inline architecture diagram. Image and video media share identical frame styling.
- **Video**: an `.mp4` source renders a native `<video>` with `controls`, a required poster image, `playsinline`, and `preload="metadata"`; it starts paused and never autoplays or loops. Recordings are converted locally before commit; the build does not transcode.
- **Typography**: filename 12px mono; badge 10px mono with `.12em` tracking; code 13px mono at 1.75 line height with 20px × 24px padding.
- **Theme**: code frames adapt their surface, toolbar, border, text, comment, keyword, and value tokens to the selected page theme. Image and video media frames intentionally stay on the dark frame/stage palette in both themes.
- **Media layout**: standalone media may break out wider than the prose measure up to its authored `maxWidth` and page gutters. The same canonical media loaded in `.reader-prose` is contained to the reader prose width with no breakout transform; this containment applies only inside the reader.
- **Accessibility**: authored filename/language remain visible text; images keep descriptive alt text and videos an equivalent `aria-label`; wide bodies scroll within the frame.

### Architecture Diagram
- **Structure**: authored SVG is inserted inline inside an exhibit wrapper so the original CSS custom properties, marker IDs, and geometry remain active.
- **Conceptual variant**: public conceptual redraws use the same frame plus a visible caption and `data-concept-diagram`; the SVG keeps a descriptive accessible name and neutral labels.
- **Theme**: the wrapper surface and shared SVG custom properties resolve separately for light and dark themes, preserving readable node fills, labels, emphasis, connectors, and markers on both standalone and reader surfaces.
- **Layout**: diagram SVGs are width 100%, height auto, max-width 720px, and centered; the wrapper does not redraw or approximate the source. At narrow widths, the wrapper owns horizontal overflow so the diagram remains locally scrollable rather than widening the page.

### Markdown Prose
- **Structure**: headings, paragraphs, links, lists, blockquotes, code, and responsive exhibits.
- **Variants**: dialog reader and standalone detail page. The standalone page renders authored `h2` sections under its `h1`; the reader shows the same content with sections demoted to `h3` under its `h2` title.
- **Wrapping**: prose paragraphs and list items use pretty wrapping without automatic hyphenation and may break otherwise unbroken tokens to protect the page width. Inline code outside `pre` stays on one line as an `inline-block`, is capped at its container width, and owns local horizontal scrolling when the command cannot fit; its border, background, and box-decoration styling stay intact.
- **Accessibility**: links remain underlined in prose; paragraphs are left-aligned; block and inline code scroll within their own boxes rather than widening the page; images have authored alt text.

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
- Named non-inline controls (header, hero actions, arc chips, filters, grid toggle, reader controls, back link, detail footer, footer destinations, back-to-top) enforce a 40px (2.5rem) minimum hit area; inline prose links are exempt.
- Native landmarks, headings, buttons, links, and dialog behavior take precedence over recreating legacy non-semantic wrappers.
- Reader focus is trapped by an explicit Tab/Shift+Tab handler among the dialog's visible controls, starts on the study title, and is restored to the invoker on close; the floating close control must remain visible and clickable after internal scrolling.
- Reader arrow shortcuts yield to modified keys and focused editable, form, media, ARIA widget, and locally scrollable diagram targets so native interaction is not canceled.
- Videos expose native controls and never autoplay; theme respects saved user choice; motion respects `prefers-reduced-motion`.
- Content must remain legible under 200% zoom, narrow mobile width, long titles, and unbroken code strings.

### Accepted Debt

| Item | Location | Why accepted | Owner / Exit |
|------|----------|--------------|--------------|
| No accepted design or accessibility debt | — | — | Record future debt here before release |
