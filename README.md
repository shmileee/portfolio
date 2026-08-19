# Portfolio — GitHub Pages deploy

Contents:
- `index.html` — the whole site, self-contained (fonts, images, GIFs, runtime all inlined; works offline)
- `assets/og-image.png` — social preview image referenced by the og:image meta tag

## Deploy

1. Create a repository (e.g. `shmileee/portfolio`, or `shmileee.github.io` for a root site).
2. Copy this folder's contents to the repository root and push.
3. Repository → Settings → Pages → Source: "Deploy from a branch" → `main` / root.
4. The site appears at `https://shmileee.github.io/<repo>/`.

## After the first deploy

- Make og:image absolute so link previews work everywhere: in `index.html`, change
  `content="assets/og-image.png"` to `content="https://shmileee.github.io/<repo>/assets/og-image.png"`.
- Custom domain: add it under Settings → Pages and create the DNS CNAME record.

Notes: deep links (`#study-N`), the light/dark toggle (persists via localStorage), filters, and the reader all work on static hosting — no build step, no server.
