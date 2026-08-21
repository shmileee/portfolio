# Portfolio Design System

## 1. Atmosphere & Identity

A calm, technical field report: dark by default, editorial rather than dashboard-like, with infrastructure-blue accents and one safety-red progress line. The signature is the contrast between oversized Bricolage Grotesque headlines and compact IBM Plex Mono labels, making long-form engineering work feel both personal and operationally precise. The bundled page at `index.html` in the source repository is the visual and interaction contract; the refactor preserves its component anatomy and values rather than reinterpreting them.

Primary visitors are engineering leaders, hiring managers, and senior platform engineers scanning for evidence before reading deeply. The secondary user is the author, who needs new Markdown content to inherit the same hierarchy without making visual decisions.

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
| Text/tertiary | `--text-tertiary` | `rgba(17,24,39,.48)` | `rgba(255,255,255,.40)` | Quiet labels |
| Border/default | `--border-default` | `rgba(17,24,39,.16)` | `rgba(255,255,255,.16)` | Controls and cards |
| Border/subtle | `--border-subtle` | `rgba(17,24,39,.09)` | `rgba(255,255,255,.08)` | Section and row dividers |
| Accent/primary | `--accent-primary` | `#1D4ED8` | `#60A5FA` | Links, labels, focus |
| Accent/soft | `--accent-soft` | `#2563EB` | `#93C5FD` | Secondary accent text |
| Accent/surface | `--accent-surface` | `rgba(37,99,235,.10)` | `rgba(37,99,235,.14)` | Selected filters and featured cards |
| Accent/border | `--accent-border` | `rgba(37,99,235,.40)` | `rgba(96,165,250,.35)` | Featured outlines |
| Progress | `--progress` | `#F9423A` | `#F9423A` | Reading-progress line only |
| Focus | `--focus-ring` | `rgba(29,78,216,.45)` | `rgba(147,197,253,.50)` | Keyboard focus halo |

### Rules

- Dark is the default; the user choice persists under the existing `om-theme` local-storage key.
- Blue communicates navigation, selection, and emphasis. Red is reserved for reading progress.
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
| H3 | `clamp(30px, 4vw, 46px)` | 650 | 1.08 | `-.02em` | Study titles |
| Lead | `clamp(17px, 1.6vw, 19px)` | 400 | 1.7 | 0 | Hero copy |
| Body | `16px` to `17px` | 400 | 1.7–1.75 | 0 | Long-form prose |
| Card title | `18px` | 600 | 1.32 | `-.01em` | Case-study cards |
| Label | `12px` | 500–600 | normal | `.14em`–`.18em` | Eyebrows and section markers |
| Nav | `11px` | 400 | normal | `.14em` | Header navigation |

### Rules

- Body copy never drops below 16px.
- Long-form measure is 46rem; metadata and labels stay monospace.
- Markdown headings inherit this scale automatically; authors do not choose sizes.

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
- Reader maximum: 840px shell with `clamp(28px, 5vw, 56px)` padding; study header and prose maximum: 800px.
- Card grid: `repeat(auto-fit, minmax(min(18rem, 100%), 1fr))`.
- Breakpoints: compact header at 740px; card/detail adjustments at 760px; wide reading rail at 1024px.
- Primary content must remain one readable column at 375px with no horizontal page scroll.

## 5. Components

### Sticky Header
- **Structure**: brand anchor, section navigation, theme button, 2px progress line.
- **States**: nav and theme controls have default, hover, active, and visible focus states.
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
- **Structure**: number/label, title, summary, topics, action.
- **Variants**: default and featured; spotlight links back to the inline full story.
- **States**: hover/focus strengthens the border and lifts by 2px; active returns to rest.
- **Accessibility**: real button or anchor, never a clickable `div`.

### Case Study Reader
- **Structure**: native dialog, sticky close control, metadata, title, rendered Markdown, previous/next controls.
- **States**: closed/open and per-study active panel.
- **Accessibility**: modal semantics, Escape close, focus restore, body scroll lock, arrow navigation, deep-link hash support.
- **Layout**: viewport-scrolling scrim with `clamp(16px, 4vw, 48px)` inset, 840px shell, 12px radius, and a close button absolutely anchored at `right: 0; top: -14px` inside a sticky `top: 16px; height: 0` toolbar.

### Exhibit Frame
- **Structure**: dark 8px-radius frame, 1px subtle border, 10px × 16px header, three 9px dots, filename, compact language badge, and a horizontally scrollable body.
- **Variants**: code, image, terminal recording, and inline architecture diagram.
- **Typography**: filename 12px mono; badge 10px mono with `.12em` tracking; code 13px mono at 1.75 line height with 20px × 24px padding.
- **Theme**: exhibits intentionally remain dark in both page themes and use the dark token ramp.
- **Accessibility**: authored filename/language remain visible text; media retains descriptive alt text; wide bodies scroll within the frame.

### Architecture Diagram
- **Structure**: authored SVG is inserted inline inside an exhibit wrapper so the original CSS custom properties, marker IDs, and geometry remain active.
- **Layout**: diagram SVGs are width 100%, height auto, max-width 720px, and centered; the wrapper does not redraw or approximate the source.

### Markdown Prose
- **Structure**: headings, paragraphs, links, lists, blockquotes, code, and responsive exhibits.
- **Variants**: homepage spotlight, dialog reader, standalone detail page.
- **Accessibility**: links remain underlined in prose; code scrolls within its own box; images have authored alt text.

### Back To Top
- **Structure**: fixed button appearing after meaningful scroll.
- **States**: hidden, visible, hover/focus.
- **Motion**: opacity and transform only.

## 6. Motion & Interaction

| Type | Duration | Easing | Usage |
|------|----------|--------|-------|
| Micro | 130ms | ease-out | Color, border, press feedback |
| Standard | 180ms | ease-in-out | Card lift, floating button |
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
- Every interactive element has a visible keyboard focus state and at least a 40px practical touch target where space permits.
- Native landmarks, headings, buttons, links, and dialog behavior take precedence over recreating legacy non-semantic wrappers.
- Reader focus is trapped by the native dialog, restored on close, and navigable without a pointer; its floating close control must remain visible and clickable after internal scrolling.
- Theme respects saved user choice; motion respects `prefers-reduced-motion`.
- Content must remain legible under 200% zoom, narrow mobile width, long titles, and unbroken code strings.

### Accepted Debt

| Item | Location | Why accepted | Owner / Exit |
|------|----------|--------------|--------------|
| No accepted design or accessibility debt | — | — | Record future debt here before release |
