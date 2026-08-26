import { expect, test } from "@playwright/test";

const PROOF_STUDIES = [12, 13, 14, 19, 23];
const CONCEPT_STUDIES = [
  { number: 19, path: "/case-studies/19-turning-container-images-from-a-liability-into-a-supply-chain/" },
];

async function expectContainedConcept(page, selector, theme) {
  const exhibit = page.locator(selector);
  const geometry = await exhibit.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
    pageClientWidth: document.documentElement.clientWidth,
    pageScrollWidth: document.documentElement.scrollWidth,
  }));

  await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
  await expect(exhibit).toHaveCount(1);
  await expect(exhibit.locator("svg")).toHaveAttribute("aria-label", /\S/);
  await expect(exhibit.locator("figcaption")).not.toBeEmpty();
  expect(geometry.scrollWidth).toBeGreaterThanOrEqual(geometry.clientWidth);
  expect(geometry.pageScrollWidth).toBeLessThanOrEqual(geometry.pageClientWidth);
}

test("surfaces evidence-backed progressive summaries in cards and canonical studies", async ({ page }) => {
  // Given the homepage case-study index
  await page.goto("/");

  // When the strongest studies are scanned
  const proofCards = page.locator("[data-case-card] [data-case-proof]");

  // Then five cards expose impact, role, and evidence without replacing canonical links
  await expect(proofCards).toHaveCount(PROOF_STUDIES.length);
  for (const number of PROOF_STUDIES) {
    const card = page.locator(`[data-case-card][data-open-study="${number}"]`);
    await expect(card.locator("[data-case-proof] dt")).toHaveText(["Impact", "My role", "Evidence"]);
    await expect(card.locator("[data-case-proof] dd")).toHaveCount(3);
    await expect(card).toHaveAttribute("href", /^\/case-studies\/[a-z0-9-]+\/$/);
  }

  // When the spotlight's canonical page is opened
  const spotlight = page.locator("#featured");
  await expect(spotlight.locator("[data-case-proof] dt")).toHaveText(["Impact", "My role", "Evidence"]);
  await page.goto(await spotlight.locator("[data-open-study]").getAttribute("href"));

  // Then the same proof leads into the full technical narrative
  await expect(page.locator(".case-detail-header [data-case-proof] dt")).toHaveText([
    "Impact",
    "My role",
    "Evidence",
  ]);
  await expect(page.locator(".case-detail-prose > h2")).toHaveCount(4);
});

test("renders revised conceptual exhibits responsively in both themes", async ({ browser }) => {
  test.setTimeout(120_000);
  for (const theme of ["dark", "light"]) {
    const context = await browser.newContext();
    await context.addInitScript((selectedTheme) => localStorage.setItem("om-theme", selectedTheme), theme);
    const page = await context.newPage();
    for (const width of [375, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      for (const study of CONCEPT_STUDIES) {
        // Given a revised study at the acceptance width and theme
        await page.goto(study.path);

        // When its conceptual exhibit is inspected
        // Then the exhibit is named, captioned, locally contained, and never widens the page
        await expectContainedConcept(page, "[data-concept-diagram]", theme);

        if (width !== 768) {
          // And the progressively enhanced reader preserves the same contained exhibit
          await page.goto(`/#study-${study.number}`);
          await expect(page.locator("dialog[data-reader]")).toBeVisible();
          await expectContainedConcept(page, "[data-reader] [data-concept-diagram]", theme);
        }
      }
    }
    await context.close();
  }
});
