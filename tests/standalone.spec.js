import { expect, test } from "@playwright/test";

const PUBLIC_ORIGIN = "https://portfolio.oponomarov.com";
const VIEWPORTS = [
  { width: 375, height: 667 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
];
const STUDY_04_PATH =
  "/case-studies/04-a-feedback-loop-measured-in-milliseconds/";
const STUDY_05_PATH = "/case-studies/05-one-tool-version-everywhere/";

async function getStandalonePaths(page) {
  await page.goto("/");
  return page.locator('.case-card[href^="/case-studies/"]').evaluateAll((cards) =>
    [...new Set(cards.map((card) => new URL(card.href).pathname))].sort(),
  );
}

test("all standalone studies expose canonical, semantic, and navigation contracts", async ({
  page,
}) => {
  // Given the complete canonical work index
  test.setTimeout(120_000);
  const paths = await getStandalonePaths(page);
  expect(paths).toHaveLength(23);

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize(viewport);

    for (const path of paths) {
      // When each standalone route loads at the current viewport
      const response = await page.goto(path);
      const heading = page.locator("main h1");
      const headingText = (await heading.textContent())?.trim();

      // Then it is canonical, independently useful, and free of horizontal overflow
      expect(response?.status()).toBe(200);
      expect(headingText).toBeTruthy();
      await expect(page).toHaveTitle(`${headingText} — Oleksandr Ponomarov`);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        `${PUBLIC_ORIGIN}${path}`,
      );
      await expect(page.locator("main#main-content")).toHaveAttribute("tabindex", "-1");
      await expect(page.locator('.back-link[href="/#index"]')).toHaveText(
        "← all case studies",
      );
      const studyNavigation = page.getByRole("navigation", {
        name: "Case study navigation",
      });
      await expect(studyNavigation.getByRole("link", { name: "View all work →" })).toHaveAttribute(
        "href",
        "/#index",
      );
      await expect(studyNavigation.getByRole("link", { name: "Contact" })).toHaveAttribute(
        "href",
        "/#contact",
      );
      await expect(page.locator('a[href^="/#study-"]')).toHaveCount(0);
      const hasOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(hasOverflow).toBe(false);
    }
  }
});

test("standalone navigation returns to work and contact without JavaScript", async ({
  browser,
  baseURL,
}) => {
  // Given a browser context where JavaScript cannot enhance links
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(baseURL ?? "/");
  const firstCard = page.locator('.case-card[href^="/case-studies/"]').first();
  const standalonePath = await firstCard.getAttribute("href");
  expect(standalonePath).toBeTruthy();

  // When a visitor follows a work card
  await firstCard.click();

  // Then the canonical page and both homepage destinations remain ordinary links
  await expect(page).toHaveURL(new RegExp(`${standalonePath}$`));
  await expect(page.locator("main#main-content")).toHaveAttribute("tabindex", "-1");
  const studyNavigation = page.getByRole("navigation", { name: "Case study navigation" });
  await expect(studyNavigation.getByRole("link", { name: "View all work →" })).toHaveAttribute(
    "href",
    "/#index",
  );
  await expect(studyNavigation.getByRole("link", { name: "Contact" })).toHaveAttribute(
    "href",
    "/#contact",
  );

  await context.close();
});

test("standalone skip navigation can focus the main study", async ({ page }) => {
  // Given a standalone study at the top of the document
  await page.goto(STUDY_04_PATH);

  // When the keyboard visitor activates the first focusable control
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Enter");

  // Then focus moves to the programmatically focusable main landmark
  await expect(page.locator("main#main-content")).toBeFocused();
});

test("studies 04 and 05 retain reciprocal canonical links", async ({ page }) => {
  // Given Study 04
  await page.goto(STUDY_04_PATH);

  // When its sequence link is inspected
  const sequel = page.locator(`a[href="${STUDY_05_PATH}"]`);

  // Then it points to Study 05, whose reciprocal link returns to Study 04
  await expect(sequel).toHaveCount(1);
  await sequel.click();
  await expect(page).toHaveURL(new RegExp(`${STUDY_05_PATH}$`));
  await expect(page.locator(`a[href="${STUDY_04_PATH}"]`)).toHaveCount(1);
});

test("missing routes recover through the canonical noindex 404", async ({ page }) => {
  // Given an address that has no generated page
  const response = await page.goto("/case-studies/not-a-real-study/");

  // When the custom recovery page renders
  expect(response?.status()).toBe(404);

  // Then it remains canonical, excluded from indexing, focusable, and navigable
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("This page doesn't exist");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex,follow",
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `${PUBLIC_ORIGIN}/404.html`,
  );
  await expect(page.locator("main#main-content")).toHaveAttribute("tabindex", "-1");
  await expect(page.getByRole("link", { name: "Browse case studies →" })).toHaveAttribute(
    "href",
    "/#index",
  );
  await expect(page.getByRole("link", { name: "Back to the homepage" })).toHaveAttribute(
    "href",
    "/",
  );
});

test("404 skip navigation can focus its recovery content", async ({ page }) => {
  // Given the generated 404 page
  await page.goto("/404.html");

  // When the keyboard visitor activates the skip link
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Enter");

  // Then focus moves to its programmatically focusable main landmark
  await expect(page.locator("main#main-content")).toBeFocused();
});

test("sitemap and robots expose the canonical route inventory", async ({ page }) => {
  // Given the canonical standalone paths rendered by the homepage
  const paths = await getStandalonePaths(page);
  const expectedLocations = [
    `${PUBLIC_ORIGIN}/`,
    ...paths.map((path) => `${PUBLIC_ORIGIN}${path}`),
  ];

  // When crawlers request the discovery endpoints
  const sitemapResponse = await page.request.get("/sitemap.xml");
  const robotsResponse = await page.request.get("/robots.txt");
  const sitemap = await sitemapResponse.text();
  const robots = await robotsResponse.text();
  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

  // Then exactly home plus 23 canonical studies are discoverable and 404 stays excluded
  expect(sitemapResponse.ok()).toBe(true);
  expect(robotsResponse.ok()).toBe(true);
  expect(locations).toEqual(expectedLocations);
  expect(new Set(locations).size).toBe(24);
  expect(sitemap).not.toContain("/404.html");
  expect(sitemap).not.toContain("#study-");
  expect(robots).toContain(`Sitemap: ${PUBLIC_ORIGIN}/sitemap.xml`);
});
