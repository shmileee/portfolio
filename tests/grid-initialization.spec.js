import { expect, test } from "@playwright/test";

import { caseStudy } from "./case-studies.js";

test("case index initializes before the optional reader dependency resolves", async ({ page }) => {
  // Given the reader focus module has been requested but is still loading
  let releaseFocus = () => {};
  const focusBlocked = new Promise((resolve) => {
    releaseFocus = resolve;
  });
  let markFocusRequested = () => {};
  const focusRequested = new Promise((resolve) => {
    markFocusRequested = resolve;
  });
  await page.route(/reader-focus\.js/, async (route) => {
    markFocusRequested();
    await focusBlocked;
    await route.continue();
  });
  await page.goto("/", { waitUntil: "commit" });
  await focusRequested;
  const target = page.locator(
    `[data-case-grid] [data-open-study="${caseStudy("self-service-teams").id}"]`,
  );

  // When a visitor expands the independently initialized case index
  try {
    await expect(target).toBeHidden();
    await page.locator("[data-grid-toggle]").click();

    // Then every case study is revealed without waiting for the reader
    await expect(target).toBeVisible();
  } finally {
    releaseFocus();
    await page.waitForLoadState("load");
  }
});
