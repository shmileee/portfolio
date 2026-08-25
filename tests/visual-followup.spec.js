import { expect, test } from "@playwright/test";

const CASE_03_PATH = "/case-studies/03-buttons-instead-of-incantations/";
const CASE_14_PATH = "/case-studies/14-environments-you-can-create-and-destroy-with-one-command/";

test("recording captions center beneath their media", async ({ page }) => {
  // Given both recording exhibits at mobile and desktop widths
  for (const width of [375, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [surface, path, root] of [
      ["standalone", CASE_03_PATH, ".case-detail-prose"],
      ["reader", "/#study-3", ".reader-prose"],
    ]) {
      await page.goto(path, { waitUntil: "networkidle" });
      if (surface === "reader") await expect(page.locator("[data-reader]")).toBeVisible();

      // When caption alignment is read from the rendered exhibits
      const alignments = await page
        .locator(`${root} .media-exhibit .exhibit-caption`)
        .evaluateAll((captions) => captions.map((caption) => getComputedStyle(caption).textAlign));

      // Then every caption is centered against its recording frame
      expect(alignments, `${width}px ${surface}`).toEqual(["center", "center"]);
    }
  }
});

test("adjacent cards align outward and share a top line across surfaces", async ({ page }) => {
  // Given standalone and reader adjacency controls in stacked and two-column layouts
  for (const width of [375, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [surface, path, selector] of [
      ["standalone", CASE_14_PATH, ".case-detail-adjacent a[data-study-direction]"],
      ["reader", "/#study-14", ".reader-navigation [data-reader-direction]"],
    ]) {
      await page.goto(path, { waitUntil: "networkidle" });
      if (surface === "reader") await expect(page.locator("[data-reader]")).toBeVisible();

      // When each card's directional alignment and label position are read from Chromium
      const facts = await page.locator(selector).evaluateAll((controls) =>
        controls.map((control) => ({
          alignItems: getComputedStyle(control).alignItems,
          kickerTop: control
            .querySelector("[data-reader-direction-kicker], .case-detail-adjacent-kicker")
            .getBoundingClientRect().top,
        })),
      );

      // Then content hugs opposite edges and desktop labels share one horizontal line
      expect(
        facts.map(({ alignItems }) => alignItems),
        `${width}px ${surface} directional alignment`,
      ).toEqual([
        "flex-start",
        "flex-end",
      ]);
      if (width > 600) {
        expect(
          Math.abs(facts[0].kickerTop - facts[1].kickerTop),
          `${width}px ${surface} kicker alignment`,
        ).toBeLessThanOrEqual(0.5);
      }
    }
  }
});

test("Case Study 14 teardown diagram adapts to the light theme", async ({ browser }) => {
  // Given the diagram on both standalone and reader surfaces in light mode
  for (const [surface, path] of [
    ["standalone", CASE_14_PATH],
    ["reader", "/#study-14"],
  ]) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await context.addInitScript(() => localStorage.setItem("om-theme", "light"));
    const page = await context.newPage();
    await page.goto(path, { waitUntil: "networkidle" });
    if (surface === "reader") await expect(page.locator("[data-reader]")).toBeVisible();

    // When the rendered surface and its light-theme token are compared
    const colors = await page.locator(".teardown-exhibit").evaluate((element) => {
      const probe = document.createElement("div");
      probe.style.backgroundColor = "var(--diagram-surface)";
      document.body.append(probe);
      const expected = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return { background: getComputedStyle(element).backgroundColor, expected };
    });

    // Then the diagram uses the adaptive surface instead of a fixed dark fill
    expect(colors.background, surface).toBe(colors.expected);
    await context.close();
  }
});
