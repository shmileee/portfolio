import { expect, test } from "@playwright/test";

const reader = (page) => page.locator("dialog[data-reader]");
const card = (page, number) => page.locator(`[data-open-study="${number}"]`).first();
const arcLink = (page, number) => page.locator(`.arc-links a[href="#study-${number}"]`).first();

async function openCard(page, number) {
  const opener = card(page, number);
  if (!(await opener.isVisible())) await page.locator("[data-grid-toggle]").click();
  await opener.click();
  await expect(reader(page)).toBeVisible();
}

test("native arc activation replaces a stale card restoration target", async ({ page }) => {
  // Given a completed card-reader interaction followed by a focused arc link
  await page.goto("/");
  const staleCard = card(page, 3);
  await openCard(page, 3);
  await page.keyboard.press("Escape");
  await expect(reader(page)).toBeHidden();
  await expect(staleCard).toBeFocused();
  const invoker = arcLink(page, 3);
  await invoker.focus();

  // When native hash navigation opens and then closes the reader
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

test("modified and middle arc clicks remain native", async ({ page }) => {
  await page.goto("/");
  const prevented = await arcLink(page, 3).evaluate((anchor) => [
    new MouseEvent("click", { bubbles: true, cancelable: true, button: 0, metaKey: true }),
    new MouseEvent("click", { bubbles: true, cancelable: true, button: 1 }),
  ].map((event) => !anchor.dispatchEvent(event)));

  expect(prevented).toEqual([false, false]);
  await expect(reader(page)).toBeHidden();
});
