import { expect, test } from "@playwright/test";

import { caseStudy } from "./case-studies.js";

const reader = (page) => page.locator("dialog[data-reader]");
const card = (page, id) => page.locator(`[data-open-study="${id}"]`).first();
const arcLink = (page, id) => page.locator(`#arc [data-arc-study="${id}"]`).first();
const BUTTONS_STUDY = caseStudy("self-service-buttons");
const NEW_TAB_MODIFIER = process.platform === "darwin" ? "Meta" : "Control";

async function openCard(page, id) {
  const opener = card(page, id);
  if (!(await opener.isVisible())) await page.locator("[data-grid-toggle]").click();
  await opener.click();
  await expect(reader(page)).toBeVisible();
}

test("ordinary canonical arc activation replaces a stale card restoration target", async ({ page }) => {
  // Given a completed card-reader interaction followed by a focused arc link
  await page.goto("/");
  const staleCard = card(page, BUTTONS_STUDY.id);
  await openCard(page, BUTTONS_STUDY.id);
  await page.keyboard.press("Escape");
  await expect(reader(page)).toBeHidden();
  await expect(staleCard).toBeFocused();
  const invoker = arcLink(page, BUTTONS_STUDY.id);
  await invoker.focus();

  // When progressive enhancement opens and then closes the reader
  await invoker.click();
  await expect(reader(page)).toBeVisible();
  await page.keyboard.press("Escape");

  // Then focus returns to the arc invoker rather than the stale card
  await expect(reader(page)).toBeHidden();
  await expect(invoker).toBeFocused();
});

test("direct hash navigation does not reuse a stale restoration target", async ({ page }) => {
  // Given a completed card-reader interaction with stale focus available
  await page.goto("/");
  const staleCard = card(page, BUTTONS_STUDY.id);
  await openCard(page, BUTTONS_STUDY.id);
  await page.keyboard.press("Escape");
  await expect(staleCard).toBeFocused();

  // When a hash change without an invoker opens and closes the reader
  await page.evaluate((id) => { location.hash = `study-${id}`; }, BUTTONS_STUDY.id);
  await expect(reader(page)).toBeVisible();
  await page.keyboard.press("Escape");

  // Then the prior card is not focused again
  await expect(reader(page)).toBeHidden();
  await expect(staleCard).not.toBeFocused();
});

test("modified and middle arc clicks remain native", async ({ context, page }) => {
  // Given the canonical buttons-study arc anchor
  await page.goto("/");
  const homepageUrl = page.url();
  const invoker = arcLink(page, BUTTONS_STUDY.id);

  // When the visitor uses the platform new-tab modifier and then the middle button
  const [modifiedPage] = await Promise.all([
    context.waitForEvent("page"),
    invoker.click({ modifiers: [NEW_TAB_MODIFIER] }),
  ]);
  await modifiedPage.waitForLoadState("domcontentloaded");

  // Then the homepage remains unchanged and the canonical standalone route opens natively
  expect(page.url()).toBe(homepageUrl);
  expect(new URL(modifiedPage.url()).pathname).toBe(BUTTONS_STUDY.url);
  await expect(reader(page)).toBeHidden();
  await modifiedPage.close();

  const [middlePage] = await Promise.all([
    context.waitForEvent("page"),
    invoker.click({ button: "middle" }),
  ]);
  await middlePage.waitForLoadState("domcontentloaded");

  expect(page.url()).toBe(homepageUrl);
  expect(new URL(middlePage.url()).pathname).toBe(BUTTONS_STUDY.url);
  await expect(reader(page)).toBeHidden();
  await middlePage.close();
});
