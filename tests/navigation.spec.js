import { expect, test } from "@playwright/test";

const CARD_SELECTOR = 'a.case-card[href^="/case-studies/"]';
const EXPECTED_STUDY_COUNT = 23;
const NEW_TAB_MODIFIER = process.platform === "darwin" ? "Meta" : "Control";

test("homepage exposes canonical case cards and one lightweight reader contract", async ({ page }) => {
  // Given the built homepage
  await page.goto("/");

  // When its card and reader contracts are collected
  const cards = page.locator(CARD_SELECTOR);
  const cardEntries = await cards.evaluateAll((elements) =>
    elements.map((card) => ({
      href: card.getAttribute("href"),
      number: Number(card.dataset.openStudy),
    })),
  );
  const manifest = await page.locator("[data-reader-manifest]").evaluate((element) =>
    JSON.parse(element.textContent ?? "[]"),
  );

  // Then every card and manifest entry identifies the same built canonical study
  await expect(cards).toHaveCount(EXPECTED_STUDY_COUNT);
  await expect(page.locator("button.case-card")).toHaveCount(0);
  expect(cardEntries.every(({ href }) => href?.startsWith("/case-studies/") && href.endsWith("/"))).toBe(
    true,
  );
  expect(new Set(cardEntries.map(({ href }) => href)).size).toBe(EXPECTED_STUDY_COUNT);
  expect(await cards.evaluateAll((elements) => elements.every((card) => !card.hasAttribute("type")))).toBe(
    true,
  );
  const targetResponses = await Promise.all(cardEntries.map(({ href }) => page.request.get(href)));
  expect(targetResponses.every((response) => response.ok())).toBe(true);

  expect(manifest).toHaveLength(EXPECTED_STUDY_COUNT);
  for (const [index, entry] of manifest.entries()) {
    expect(entry.number).toBe(index + 1);
    expect(entry.url).toMatch(/^\/case-studies\/.+\/$/);
    expect(entry.title.length).toBeGreaterThan(0);
    expect(entry.topics.length).toBeGreaterThan(0);
  }
  const cardsByNumber = [...cardEntries].sort((left, right) => left.number - right.number);
  expect(manifest.map(({ number, url }) => ({ number, url }))).toEqual(
    cardsByNumber.map(({ number, href }) => ({ number, url: href })),
  );

  const reader = page.locator("dialog[data-reader]");
  await expect(reader).toHaveCount(1);
  await expect(reader.locator("article.reader-study")).toHaveCount(1);
  await expect(reader.locator("[data-reader-title]")).toHaveCount(1);
  await expect(reader.locator("[data-reader-prose]")).toHaveCount(1);
  await expect(reader.locator("[data-reader-status][aria-live]")).toHaveCount(1);
  await expect(reader.locator("section, .case-detail-prose")).toHaveCount(0);
  await expect(reader.locator("[data-reader-prose]")).toBeEmpty();
  await expect(page.locator('[data-open-study="5"] .case-card-number')).toContainText("05 · sequel");
});

for (const width of [375, 768, 1280]) {
  test(`case cards retain their rendered layout at ${width}px`, async ({ page }) => {
    // Given the homepage at a representative responsive width
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");

    // When every case card is expanded into the rendered grid
    await page.locator("[data-grid-toggle]").click();
    const layout = await page.locator(".case-card").evaluateAll((cards) =>
      cards.map((card) => {
        const style = getComputedStyle(card);
        return {
          className: card.className,
          display: style.display,
          flexDirection: style.flexDirection,
          tagName: card.tagName,
          width: card.getBoundingClientRect().width,
        };
      }),
    );

    // Then anchors preserve the shared card class, flex anatomy, and viewport fit
    expect(layout).toHaveLength(EXPECTED_STUDY_COUNT);
    expect(
      layout.every(
        ({ className, display, flexDirection, tagName, width: cardWidth }) =>
          (className === "case-card" || className === "case-card case-card-featured") &&
          display === "flex" &&
          flexDirection === "column" &&
          tagName === "A" &&
          cardWidth > 0,
      ),
    ).toBe(true);
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);
  });
}

test("ordinary primary activation remains available to progressive enhancement", async ({ page }) => {
  // Given a canonical card with an enhancement hook
  await page.goto("/");
  const card = page.locator(CARD_SELECTOR).first();
  await expect(card).toHaveAttribute("data-open-study", /^\d+$/);
  await card.evaluate((element) => {
    element.addEventListener(
      "click",
      (event) => {
        event.preventDefault();
        window.__primaryActivation = {
          button: event.button,
          ctrlKey: event.ctrlKey,
          defaultPrevented: event.defaultPrevented,
          metaKey: event.metaKey,
          shiftKey: event.shiftKey,
        };
      },
      { capture: true, once: true },
    );
  });

  // When the card receives an unmodified primary click
  await card.click();

  // Then enhancement code can observe and take ownership of that ordinary activation
  const activation = await page.evaluate(() => window.__primaryActivation);
  expect(activation).toEqual({
    button: 0,
    ctrlKey: false,
    defaultPrevented: true,
    metaKey: false,
    shiftKey: false,
  });
});

test("canonical href remains suitable for browser copy-link behavior", async ({ page }) => {
  // Given a homepage case-card anchor
  await page.goto("/");

  // When its authored and browser-resolved link values are read
  const link = await page.locator(CARD_SELECTOR).first().evaluate((anchor) => ({
    absoluteHref: anchor.href,
    attributeHref: anchor.getAttribute("href"),
    download: anchor.hasAttribute("download"),
    target: anchor.getAttribute("target"),
  }));

  // Then Copy Link Address resolves to the canonical standalone route without special behavior
  expect(link.attributeHref).toMatch(/^\/case-studies\/.+\/$/);
  expect(link.absoluteHref).toBe(new URL(link.attributeHref, page.url()).href);
  expect(link.download).toBe(false);
  expect(link.target).toBeNull();
});

test("modified activation opens the canonical study without replacing the homepage", async ({ context, page }) => {
  // Given a canonical case-card anchor on the homepage
  await page.goto("/");
  const card = page.locator(CARD_SELECTOR).first();
  const href = await card.getAttribute("href");

  // When the visitor uses the platform new-tab modifier
  const [openedPage] = await Promise.all([
    context.waitForEvent("page"),
    card.click({ modifiers: [NEW_TAB_MODIFIER] }),
  ]);
  await openedPage.waitForLoadState("domcontentloaded");

  // Then the source stays put and the new tab receives the canonical URL
  expect(new URL(page.url()).pathname).toBe("/");
  expect(new URL(openedPage.url()).pathname).toBe(href);
  await openedPage.close();
});

test("middle-click opens the canonical study without replacing the homepage", async ({ context, page }) => {
  // Given a canonical case-card anchor on the homepage
  await page.goto("/");
  const card = page.locator(CARD_SELECTOR).nth(1);
  const href = await card.getAttribute("href");

  // When the visitor middle-clicks the card
  const [openedPage] = await Promise.all([
    context.waitForEvent("page"),
    card.click({ button: "middle" }),
  ]);
  await openedPage.waitForLoadState("domcontentloaded");

  // Then the source stays put and the new tab receives the canonical URL
  expect(new URL(page.url()).pathname).toBe("/");
  expect(new URL(openedPage.url()).pathname).toBe(href);
  await openedPage.close();
});

test("JavaScript-disabled activation reaches the standalone case study", async ({ browser }) => {
  // Given a browser context with JavaScript disabled
  const context = await browser.newContext({
    baseURL: "http://127.0.0.1:8080",
    javaScriptEnabled: false,
  });
  const page = await context.newPage();
  await page.goto("/");
  const card = page.locator(CARD_SELECTOR).first();
  const href = await card.getAttribute("href");

  // When the visitor activates a case-card link
  await Promise.all([
    page.waitForURL((url) => url.pathname === href),
    card.click(),
  ]);

  // Then the canonical standalone article renders without an enhanced reader
  expect(new URL(page.url()).pathname).toBe(href);
  await expect(page.locator("main.case-detail h1")).toBeVisible();
  await expect(page.locator("article.case-detail-prose")).toBeVisible();
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  await context.close();
});
