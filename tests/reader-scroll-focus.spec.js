import { expect, test } from "@playwright/test";

test("Study 19 reader focus traverses both scroll owners and adjacent controls", async ({ page }) => {
  // Given the mobile reader with code and diagram scroll containers
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/#study-19");
  const reader = page.locator("dialog[data-reader]");
  const close = reader.locator("[data-reader-close]");
  const code = reader.locator(".code-exhibit pre");
  const diagram = reader.locator(".diagram-exhibit");
  const previous = reader.locator('[data-reader-direction="previous"]');
  const next = reader.locator('[data-reader-direction="next"]');
  await expect(reader).toBeVisible();
  await close.focus();

  // When focus moves forward through the complete reader cycle
  for (const target of [code, diagram, previous, next, close]) {
    await page.keyboard.press("Tab");
    await expect(target).toBeFocused();
  }

  // Then reverse traversal reaches the same controls without skipping a scroll owner
  for (const target of [next, previous, diagram, code, close]) {
    await page.keyboard.press("Shift+Tab");
    await expect(target).toBeFocused();
  }
});

test("Study 19 code scroller keeps unmodified arrow keys native", async ({ page }) => {
  // Given the mobile reader with its overflowing manifest focused
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/#study-19");
  const code = page.locator("dialog[data-reader] .code-exhibit pre");
  await code.focus();
  await expect(code).toBeFocused();
  expect(await code.evaluate((element) => element.scrollWidth)).toBeGreaterThan(
    await code.evaluate((element) => element.clientWidth),
  );
  await page.evaluate(() => {
    document.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") window.__codeArrowDefaultPrevented = event.defaultPrevented;
    });
  });

  // When the native horizontal-scroll key is pressed
  await page.keyboard.press("ArrowRight");

  // Then the manifest scrolls without replacing the active reader study
  expect(await page.evaluate(() => window.__codeArrowDefaultPrevented)).toBe(false);
  expect(new URL(page.url()).hash).toBe("#study-19");
  await expect.poll(() => code.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
});
