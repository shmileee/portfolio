# Portfolio

Source for [portfolio.oponomarov.com](https://portfolio.oponomarov.com).

Contents:
- `index.html` — the whole site, self-contained (fonts, images, GIFs, runtime all inlined; works offline)
- `assets/og-image.png` — social preview image referenced by the og:image meta tag

## Deploy

Every push to `main` runs [`.github/workflows/deploy.yaml`](.github/workflows/deploy.yaml),
which publishes the repository root to the `gh-pages` branch (with a `CNAME` for
`portfolio.oponomarov.com`) using peaceiris/actions-gh-pages.

One-time setup after pushing to GitHub:

1. Wait for the first workflow run to create the `gh-pages` branch.
2. Settings → Pages → Source: "Deploy from a branch" → `gh-pages` / root
   (GitHub usually preselects this when the branch appears).
3. DNS: add a CNAME record `portfolio.oponomarov.com` → `shmileee.github.io`.
4. Settings → Pages → tick "Enforce HTTPS" once the certificate is provisioned.

## Local preview

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

Notes: deep links (`#study-N`), the light/dark toggle (persists via localStorage), filters,
and the reader all work on static hosting — no build step, no server.
