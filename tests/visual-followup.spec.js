import { expect, test } from "@playwright/test";

import { caseStudy, caseStudyHash } from "./case-studies.js";

const BUTTONS_STUDY = caseStudy("self-service-buttons");
const TOOL_VERSIONS_STUDY = caseStudy("tool-versions");
const ENVIRONMENTS_STUDY = caseStudy("ephemeral-environments");

async function inlineCenterDelta(code) {
  return code.evaluate((element) => {
    const sibling =
      element.previousSibling?.nodeType === Node.TEXT_NODE
        ? element.previousSibling
        : element.parentElement?.previousSibling;
    if (sibling?.nodeType !== Node.TEXT_NODE) throw new Error("Expected adjacent prose text");

    const text = sibling.textContent ?? "";
    const sample = text.match(/\S+\s*$/);
    if (sample?.index === undefined) throw new Error("Expected a preceding prose word");

    const range = document.createRange();
    range.setStart(sibling, sample.index);
    range.setEnd(sibling, sample.index + sample[0].length);
    const codeRange = document.createRange();
    codeRange.selectNodeContents(element);
    const codeRect = codeRange.getBoundingClientRect();
    const textRect = range.getBoundingClientRect();
    return codeRect.top + codeRect.height / 2 - (textRect.top + textRect.height / 2);
  });
}

test("inline code aligns vertically with adjacent prose", async ({ page }) => {
  // Given representative commands rendered in standalone and reader prose
  for (const [command, standalonePath, readerPath] of [
    ["atlantis plan", BUTTONS_STUDY.url, `/${caseStudyHash(BUTTONS_STUDY.id)}`],
    ["mise install", TOOL_VERSIONS_STUDY.url, `/${caseStudyHash(TOOL_VERSIONS_STUDY.id)}`],
  ]) {
    for (const [surface, path, root] of [
      ["standalone", standalonePath, ".case-detail-prose"],
      ["reader", readerPath, ".reader-prose"],
    ]) {
      await page.goto(path, { waitUntil: "networkidle" });
      if (surface === "reader") await expect(page.locator("[data-reader]")).toBeVisible();

      // When the inline-code glyphs are compared with the preceding prose glyphs
      const code = page.locator(`${root} code`).filter({ hasText: command });
      const centerDelta = await inlineCenterDelta(code);

      // Then the visible token text sits on the prose line instead of riding high
      expect(Math.abs(centerDelta), `${command} ${surface} center delta`).toBeLessThanOrEqual(0.5);
    }
  }
});

test("narrow reader keeps punctuation with inline code", async ({ page }) => {
  // Given the command pair rendered near the reader's mobile wrap boundary
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto(`/${caseStudyHash(BUTTONS_STUDY.id)}`, { waitUntil: "networkidle" });
  await expect(page.locator("[data-reader]")).toBeVisible();

  // When the first command and its trailing comma are measured
  const centerDelta = await page
    .locator(".reader-prose code")
    .filter({ hasText: "atlantis plan" })
    .evaluate((element) => {
      const punctuation = element.nextSibling;
      if (punctuation?.nodeType !== Node.TEXT_NODE || !punctuation.textContent.startsWith(",")) {
        throw new Error("Expected a trailing comma text node");
      }

      const codeRange = document.createRange();
      codeRange.selectNodeContents(element);
      const punctuationRange = document.createRange();
      punctuationRange.setStart(punctuation, 0);
      punctuationRange.setEnd(punctuation, 1);
      const codeRect = codeRange.getBoundingClientRect();
      const punctuationRect = punctuationRange.getBoundingClientRect();
      return codeRect.top + codeRect.height / 2 - (punctuationRect.top + punctuationRect.height / 2);
    });

  // Then punctuation stays on the command's line instead of starting the next line
  expect(Math.abs(centerDelta)).toBeLessThanOrEqual(0.5);
});

test("recording captions center beneath their media", async ({ page }) => {
  // Given both recording exhibits at mobile and desktop widths
  for (const width of [375, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [surface, path, root] of [
      ["standalone", BUTTONS_STUDY.url, ".case-detail-prose"],
      ["reader", `/${caseStudyHash(BUTTONS_STUDY.id)}`, ".reader-prose"],
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
      ["standalone", ENVIRONMENTS_STUDY.url, ".case-detail-adjacent a[data-study-direction]"],
      ["reader", `/${caseStudyHash(ENVIRONMENTS_STUDY.id)}`, ".reader-navigation [data-reader-direction]"],
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

test("the environments-study teardown diagram adapts to the light theme", async ({ browser }) => {
  // Given the diagram on both standalone and reader surfaces in light mode
  for (const [surface, path] of [
    ["standalone", ENVIRONMENTS_STUDY.url],
    ["reader", `/${caseStudyHash(ENVIRONMENTS_STUDY.id)}`],
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
