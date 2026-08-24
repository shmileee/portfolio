import { expect, test } from "@playwright/test";

const reader = (page) => page.locator("dialog[data-reader]");
const card = (page, number) => page.locator(`[data-open-study="${number}"]`).first();
const arcLink = (page, number) => page.locator(`#arc [data-arc-study="${number}"]`).first();
const STUDY_03_URL = "/case-studies/03-buttons-instead-of-incantations/";
const NEW_TAB_MODIFIER = process.platform === "darwin" ? "Meta" : "Control";

async function openCard(page, number) {
  const opener = card(page, number);
  if (!(await opener.isVisible())) await page.locator("[data-grid-toggle]").click();
  await opener.click();
  await expect(reader(page)).toBeVisible();
}

test("ordinary canonical arc activation replaces a stale card restoration target", async ({ page }) => {
  // Given a completed card-reader interaction followed by a focused arc link
  await page.goto("/");
  const staleCard = card(page, 3);
  await openCard(page, 3);
  await page.keyboard.press("Escape");
  await expect(reader(page)).toBeHidden();
  await expect(staleCard).toBeFocused();
  const invoker = arcLink(page, 3);
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
  const staleCard = card(page, 3);
  await openCard(page, 3);
  await page.keyboard.press("Escape");
  await expect(staleCard).toBeFocused();

  // When a hash change without an invoker opens and closes the reader
  await page.evaluate(() => { location.hash = "study-3"; });
  await expect(reader(page)).toBeVisible();
  await page.keyboard.press("Escape");

  // Then the prior card is not focused again
  await expect(reader(page)).toBeHidden();
  await expect(staleCard).not.toBeFocused();
});

test("modified and middle arc clicks remain native", async ({ context, page }) => {
  // Given the canonical Study 03 arc anchor
  await page.goto("/");
  const homepageUrl = page.url();
  const invoker = arcLink(page, 3);

  // When the visitor uses the platform new-tab modifier and then the middle button
  const [modifiedPage] = await Promise.all([
    context.waitForEvent("page"),
    invoker.click({ modifiers: [NEW_TAB_MODIFIER] }),
  ]);
  await modifiedPage.waitForLoadState("domcontentloaded");

  // Then the homepage remains unchanged and the canonical standalone route opens natively
  expect(page.url()).toBe(homepageUrl);
  expect(new URL(modifiedPage.url()).pathname).toBe(STUDY_03_URL);
  await expect(reader(page)).toBeHidden();
  await modifiedPage.close();

  const [middlePage] = await Promise.all([
    context.waitForEvent("page"),
    invoker.click({ button: "middle" }),
  ]);
  await middlePage.waitForLoadState("domcontentloaded");

  expect(page.url()).toBe(homepageUrl);
  expect(new URL(middlePage.url()).pathname).toBe(STUDY_03_URL);
  await expect(reader(page)).toBeHidden();
  await middlePage.close();
});
