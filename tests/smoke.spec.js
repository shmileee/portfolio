import { expect, test } from "@playwright/test";

const STANDALONE_STUDY_PATH =
  "/case-studies/14-environments-you-can-create-and-destroy-with-one-command/";

function trackRuntimeErrors(page) {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => {
    errors.push(`pageerror: ${error.message}`);
  });
  page.on("requestfailed", (request) => {
    errors.push(`requestfailed: ${request.url()} (${request.failure()?.errorText})`);
  });
  return errors;
}

test("homepage renders the case-study index without runtime errors", async ({ page }) => {
  // Given runtime error tracking on a fresh page
  const errors = trackRuntimeErrors(page);

  // When the homepage loads
  const response = await page.goto("/");

  // Then it responds OK, hydrates the index, and reports no errors
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle(/Oleksandr Ponomarov/);
  await expect(page.locator("[data-filter-status]")).toHaveText(/case stud(y|ies) shown/);
  expect(errors).toEqual([]);
});

test("theme choice persists across a reload", async ({ page }) => {
  // Given the homepage in its default dark theme
  await page.goto("/");
  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-theme", "dark");

  // When the visitor switches the theme and reloads
  await page.locator("[data-theme-toggle]").click();
  await expect(html).toHaveAttribute("data-theme", "light");
  await page.reload();

  // Then the switched theme is restored from storage
  await expect(html).toHaveAttribute("data-theme", "light");
  const storedTheme = await page.evaluate(() => localStorage.getItem("om-theme"));
  expect(storedTheme).toBe("light");
});

test("topic filters narrow the visible case cards", async ({ page }) => {
  // Given the homepage index with its initially collapsed card grid
  await page.goto("/");
  const visibleCards = page.locator("[data-case-card]:visible");
  const initiallyVisible = page.locator('[data-case-card][data-initially-hidden="false"]');
  await expect(visibleCards).toHaveCount(await initiallyVisible.count());

  // When the visitor filters by the reliability topic
  const reliabilityFilter = page.locator('[data-topic-filter="reliability"]');
  await reliabilityFilter.click();

  // Then only reliability cards stay visible and the filter state is announced
  await expect(reliabilityFilter).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('[data-topic-filter="all"]')).toHaveAttribute("aria-pressed", "false");
  const visibleCount = await visibleCards.count();
  expect(visibleCount).toBeGreaterThan(0);
  const topicsPerCard = await visibleCards.evaluateAll((cards) =>
    cards.map((card) => card.dataset.topics ?? ""),
  );
  for (const topics of topicsPerCard) {
    expect(topics.split("|")).toContain("reliability");
  }
  await expect(page.locator("[data-filter-status]")).toHaveText(
    new RegExp(`^${visibleCount} case stud(y|ies) shown$`),
  );
});

test("a standalone case study renders without runtime errors", async ({ page }) => {
  // Given runtime error tracking on a fresh page
  const errors = trackRuntimeErrors(page);

  // When a canonical case-study route loads
  const response = await page.goto(STANDALONE_STUDY_PATH);

  // Then the study responds OK and renders its heading with no errors
  expect(response?.status()).toBe(200);
  await expect(page.locator("h1")).toHaveText(
    "Environments you can create and destroy with one command",
  );
  expect(errors).toEqual([]);
});

test("a missing case study responds non-2xx while the server keeps serving", async ({ page }) => {
  // Given the running site
  // When a nonexistent study route is requested
  const missing = await page.request.get("/case-studies/not-a-real-study/");

  // Then it is rejected with a non-2xx status and the homepage still responds
  expect(missing.ok()).toBe(false);
  expect(missing.status()).toBeGreaterThanOrEqual(400);
  const home = await page.request.get("/");
  expect(home.ok()).toBe(true);
});
