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

async function getStudyManifest(page) {
  await page.goto("/");
  return page.locator("[data-reader-manifest]").evaluate((manifest) =>
    JSON.parse(manifest.textContent),
  );
}

test("all standalone studies expose canonical wraparound adjacency", async ({ page }) => {
  // Given the complete, number-ordered canonical study manifest
  test.setTimeout(120_000);
  const studies = await getStudyManifest(page);
  expect(studies).toHaveLength(22);

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize(viewport);

    for (const [index, study] of studies.entries()) {
      const previous = studies[(index - 1 + studies.length) % studies.length];
      const next = studies[(index + 1) % studies.length];

      // When the standalone route renders its adjacent and portfolio navigation
      const response = await page.goto(study.url);
      const adjacentNavigation = page.getByRole("navigation", {
        name: "Adjacent case studies",
      });
      const previousLink = adjacentNavigation.locator(
        'a[data-study-direction="previous"]',
      );
      const nextLink = adjacentNavigation.locator('a[data-study-direction="next"]');

      // Then the canonical previous/next pair wraps and preserves the reader anatomy
      expect(response?.status()).toBe(200);
      await expect(page.locator("main h1")).toHaveText(study.title);
      await expect(adjacentNavigation).toHaveCount(1);
      await expect(adjacentNavigation.locator("a")).toHaveCount(2);
      expect(
        await adjacentNavigation.locator("a").evaluateAll((links) =>
          links.map((link) => link.dataset.studyDirection),
        ),
      ).toEqual(["previous", "next"]);

      for (const [link, direction, neighbor] of [
        [previousLink, "Previous", previous],
        [nextLink, "Next", next],
      ]) {
        await expect(link).toHaveCount(1);
        await expect(link).toHaveAttribute("href", neighbor.url);
        await expect(link).not.toHaveAttribute("href", /#/);
        await expect(link).not.toHaveAttribute("data-open-study", /.+/);
        await expect(link.locator(".case-detail-adjacent-kicker")).toHaveText(direction);
        await expect(link.locator(".case-detail-adjacent-number")).toHaveText(
          `Case ${String(neighbor.number).padStart(2, "0")}`,
        );
        await expect(link.locator(".case-detail-adjacent-title")).toHaveText(
          neighbor.title,
        );
      }

      const portfolioNavigation = page.getByRole("navigation", {
        name: "Portfolio navigation",
      });
      await expect(portfolioNavigation).toHaveCount(1);
      await expect(
        portfolioNavigation.getByRole("link", { name: "View all work →" }),
      ).toHaveAttribute("href", "/#index");
      await expect(
        portfolioNavigation.getByRole("link", { name: "Contact" }),
      ).toHaveAttribute("href", "/#contact");
      await expect(page.locator('a[href^="/#study-"]')).toHaveCount(0);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
        ),
      ).toBe(false);
    }
  }
});

test("Task 6 standalone adjacent cards wrap long titles in equal responsive columns", async ({ page }) => {
  const studies = await getStudyManifest(page);
  const longest = studies.reduce((candidate, study) =>
    study.title.length > candidate.title.length ? study : candidate,
  );
  const longestIndex = studies.findIndex(({ number }) => number === longest.number);
  const current = studies[(longestIndex - 1 + studies.length) % studies.length];

  for (const width of [320, 375, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(current.url);
    const facts = await page.locator(".case-detail-adjacent").evaluate((navigation) => {
      const style = getComputedStyle(navigation);
      const links = [...navigation.querySelectorAll("a")].map((link) => {
        const rect = link.getBoundingClientRect();
        const title = link.querySelector(".case-detail-adjacent-title");
        return {
          direction: link.dataset.studyDirection,
          height: rect.height,
          textAlign: getComputedStyle(link).textAlign,
          titleClientWidth: title.clientWidth,
          titleOverflow: getComputedStyle(title).overflow,
          titleScrollWidth: title.scrollWidth,
          titleWhiteSpace: getComputedStyle(title).whiteSpace,
          width: rect.width,
        };
      });
      return {
        display: style.display,
        gridTemplateColumns: style.gridTemplateColumns,
        links,
        pageClientWidth: document.documentElement.clientWidth,
        pageScrollWidth: document.documentElement.scrollWidth,
      };
    });

    expect(facts.display).toBe("grid");
    expect(facts.links).toHaveLength(2);
    expect(facts.pageScrollWidth).toBeLessThanOrEqual(facts.pageClientWidth);
    for (const link of facts.links) {
      expect(link.height).toBeGreaterThanOrEqual(40);
      expect(link.titleOverflow).toBe("visible");
      expect(link.titleWhiteSpace).toBe("normal");
      expect(link.titleScrollWidth).toBeLessThanOrEqual(link.titleClientWidth + 0.01);
    }
    if (width <= 600) {
      expect(facts.gridTemplateColumns.split(" ")).toHaveLength(1);
    } else {
      expect(facts.gridTemplateColumns.split(" ")).toHaveLength(2);
      expect(Math.abs(facts.links[0].width - facts.links[1].width)).toBeLessThanOrEqual(0.02);
      expect(facts.links[0].textAlign).toBe("left");
      expect(facts.links[1].textAlign).toBe("right");
    }
  }
});

test("all standalone studies expose canonical, semantic, and navigation contracts", async ({
  page,
}) => {
  // Given the complete canonical work index
  test.setTimeout(120_000);
  const paths = await getStandalonePaths(page);
  expect(paths).toHaveLength(22);

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
        name: "Portfolio navigation",
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
  const studyNavigation = page.getByRole("navigation", { name: "Portfolio navigation" });
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

test("both adjacent directions navigate on every standalone study without JavaScript", async ({
  browser,
  baseURL,
}) => {
  // Given every canonical study in a JavaScript-disabled browser context
  test.setTimeout(120_000);
  const discoveryContext = await browser.newContext();
  const discoveryPage = await discoveryContext.newPage();
  await discoveryPage.goto(baseURL ?? "/");
  const studies = await getStudyManifest(discoveryPage);
  await discoveryContext.close();

  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  for (const [index, study] of studies.entries()) {
    for (const [direction, neighbor] of [
      ["previous", studies[(index - 1 + studies.length) % studies.length]],
      ["next", studies[(index + 1) % studies.length]],
    ]) {
      await page.goto(`${baseURL}${study.url}`);
      const responsePromise = page.waitForNavigation();
      await page
        .getByRole("navigation", { name: "Adjacent case studies" })
        .locator(`a[data-study-direction="${direction}"]`)
        .click();
      const response = await responsePromise;

      // Then the ordinary anchor reaches the expected canonical HTTP route
      expect(response?.status()).toBe(200);
      await expect(page).toHaveURL(new RegExp(`${neighbor.url}$`));
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        `${PUBLIC_ORIGIN}${neighbor.url}`,
      );
      await expect(page.locator("dialog[open]")).toHaveCount(0);
      expect(new URL(page.url()).hash).toBe("");
    }
  }

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
  const sequel = page.locator(`.case-detail-prose a[href="${STUDY_05_PATH}"]`);

  // Then it points to Study 05, whose reciprocal link returns to Study 04
  await expect(sequel).toHaveCount(1);
  await sequel.click();
  await expect(page).toHaveURL(new RegExp(`${STUDY_05_PATH}$`));
  await expect(
    page.locator(`.case-detail-prose a[href="${STUDY_04_PATH}"]`),
  ).toHaveCount(1);
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

  // Then exactly home plus 22 canonical studies are discoverable and 404 stays excluded
  expect(sitemapResponse.ok()).toBe(true);
  expect(robotsResponse.ok()).toBe(true);
  expect(locations).toEqual(expectedLocations);
  expect(new Set(locations).size).toBe(23);
  expect(sitemap).not.toContain("/404.html");
  expect(sitemap).not.toContain("#study-");
  expect(robots).toContain(`Sitemap: ${PUBLIC_ORIGIN}/sitemap.xml`);
});
