import { expect, test } from "@playwright/test";

const reader = (page) => page.locator("dialog[data-reader]");
const card = (page, number) => page.locator(`[data-open-study="${number}"]`).first();

async function studyPath(page, number) {
  return card(page, number).getAttribute("href");
}

async function revealStudy(page, number) {
  if (!(await card(page, number).isVisible())) await page.locator("[data-grid-toggle]").click();
}

async function openStudy(page, number) {
  await revealStudy(page, number);
  await card(page, number).click();
  await expect(reader(page)).toBeVisible();
}

const fixture = (body) => `<!doctype html><article class="case-detail-prose">${body}</article>`;

async function observeNativeClick(page, number, attributes, eventInit = {}) {
  return page.evaluate(
    ({ selector, attributes: nextAttributes, eventInit: nextEventInit }) => {
      const anchor = document.querySelector(selector);
      for (const [name, value] of Object.entries(nextAttributes)) anchor.setAttribute(name, value);
      return new Promise((resolve) => {
        document.addEventListener(
          "click",
          (event) => {
            resolve(event.defaultPrevented);
            event.preventDefault();
          },
          { once: true },
        );
        anchor.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0, ...nextEventInit }));
      });
    },
    { selector: `[data-open-study="${number}"]`, attributes, eventInit },
  );
}

test("normalizes canonical HTML and shares one pending request with the success cache", async ({ page }) => {
  // Given a canonical study response whose prose contains relative URLs and an attributed H2
  await page.goto("/");
  const path = await studyPath(page, 3);
  let requests = 0;
  let release;
  const pending = new Promise((resolve) => { release = resolve; });
  await page.route(path, async (route) => {
    requests += 1;
    await pending;
    await route.fulfill({
      contentType: "text/html",
      body: fixture('<h2 id="phase"><em>Phase</em></h2><img src="media.png"><video poster="./poster.jpg"></video><a href="../04-a-feedback-loop-measured-in-milliseconds/">next</a><a href="">empty</a>'),
    });
  });

  // When two opens race before the response settles and the cached study is reopened
  await revealStudy(page, 3);
  await card(page, 3).click({ noWaitAfter: true });
  await card(page, 3).click({ noWaitAfter: true });
  release();
  await expect(reader(page)).toBeVisible();
  const prose = reader(page).locator("[data-reader-prose]");

  // Then one fetch populates normalized prose, preserves heading content, and serves the reopen
  expect(requests).toBe(1);
  await expect(prose.locator("h2")).toHaveCount(0);
  await expect(prose.locator('h3#phase > em')).toHaveText("Phase");
  expect(await prose.locator("img").getAttribute("src")).toBe(new URL("media.png", `http://127.0.0.1:8080${path}`).href);
  expect(await prose.locator("video").getAttribute("poster")).toBe(new URL("poster.jpg", `http://127.0.0.1:8080${path}`).href);
  expect(await prose.locator('a:has-text("next")').getAttribute("href")).toBe(new URL("../04-a-feedback-loop-measured-in-milliseconds/", `http://127.0.0.1:8080${path}`).href);
  await expect(prose.locator('a:has-text("empty")')).toHaveAttribute("href", "");
  await reader(page).locator("[data-reader-close]").click();
  await openStudy(page, 3);
  expect(requests).toBe(1);
});

test("latest intent wins over stale success and stale failure", async ({ page }) => {
  // Given two delayed canonical responses and a later immediately successful study
  await page.goto("/");
  const third = await studyPath(page, 3);
  const fourth = await studyPath(page, 4);
  const fifth = await studyPath(page, 5);
  const sixth = await studyPath(page, 6);
  let releaseSuccess;
  let releaseFailure;
  const successGate = new Promise((resolve) => { releaseSuccess = resolve; });
  const failureGate = new Promise((resolve) => { releaseFailure = resolve; });
  await page.route(third, async (route) => { await successGate; await route.fulfill({ contentType: "text/html", body: fixture("<h2>stale</h2>") }); });
  await page.route(fourth, (route) => route.fulfill({ contentType: "text/html", body: fixture("<h2>current</h2>") }));

  // When Study 04 supersedes Study 03 before Study 03 succeeds
  await revealStudy(page, 3);
  await card(page, 3).click({ noWaitAfter: true });
  await openStudy(page, 4);
  releaseSuccess();
  await expect(reader(page).locator("[data-reader-title]")).toContainText("feedback loop");
  await expect(reader(page).locator("[data-reader-prose]")).toContainText("current");
  await reader(page).locator("[data-reader-close]").click();
  await page.unrouteAll({ behavior: "wait" });
  await page.route(fifth, async (route) => { await failureGate; await route.abort(); });
  await page.route(sixth, (route) => route.fulfill({ contentType: "text/html", body: fixture("<h2>still current</h2>") }));

  // When the same sequence ends in a stale failure
  await revealStudy(page, 5);
  await card(page, 5).click({ noWaitAfter: true });
  await openStudy(page, 6);
  const failed = page.waitForEvent("requestfailed");
  releaseFailure();
  await failed;

  // Then the stale result neither replaces content nor triggers canonical fallback
  expect(new URL(page.url()).pathname).toBe("/");
  await expect(reader(page).locator("[data-reader-prose]")).toContainText("still current");
});

test("marked Back and Forward close and reopen while restoring focus", async ({ page }) => {
  // Given an opener that owns a successful marked reader entry
  await page.goto("/");
  const opener = card(page, 3);
  await opener.focus();
  await openStudy(page, 3);
  expect(await page.evaluate(() => history.state)).toEqual({ portfolioReader: true, number: 3 });

  // When browser history moves backward and forward
  await page.goBack();
  await expect(reader(page)).toBeHidden();
  await expect(opener).toBeFocused();
  await page.goForward();

  // Then the marked entry deterministically reopens from cache at the static title
  await expect(reader(page)).toBeVisible();
  await expect(reader(page).locator("[data-reader-title]")).toBeFocused();
});

test("explicit marked close consumes exactly one entry and Back does not reopen it", async ({ page }) => {
  // Given a seeded page history and an instrumented history.back
  await page.addInitScript(() => {
    const nativeBack = history.back.bind(history);
    window.__readerBackCalls = 0;
    history.back = () => { window.__readerBackCalls += 1; nativeBack(); };
  });
  await page.goto("/");
  await page.evaluate(() => history.pushState({ seed: true }, "", "#seed"));
  await openStudy(page, 3);

  // When the close control consumes the marked reader entry and Back moves again
  await reader(page).locator("[data-reader-close]").click();
  await expect(reader(page)).toBeHidden();
  expect(await page.evaluate(() => window.__readerBackCalls)).toBe(1);
  await page.goBack();

  // Then no reader entry is reopened
  await expect(reader(page)).toBeHidden();
  expect(new URL(page.url()).hash).toBe("");
});

test("unmarked initial and hashchange readers strip hashes without consuming history", async ({ page }) => {
  // Given a direct legacy hash with no reader marker
  await page.addInitScript(() => {
    const nativeBack = history.back.bind(history);
    window.__readerBackCalls = 0;
    history.back = () => { window.__readerBackCalls += 1; nativeBack(); };
  });
  await page.goto("/#study-3");
  await expect(reader(page)).toBeVisible();

  // When it closes and another legacy hash is assigned then escaped
  await reader(page).locator("[data-reader-close]").click();
  expect(new URL(page.url()).hash).toBe("");
  await page.evaluate(() => { location.hash = "study-4"; });
  await expect(reader(page)).toBeVisible();
  await page.keyboard.press("Escape");

  // Then both unmarked entries close by replacement rather than history.back
  await expect(reader(page)).toBeHidden();
  expect(new URL(page.url()).hash).toBe("");
  expect(await page.evaluate(() => window.__readerBackCalls)).toBe(0);
});

test("canonical prose navigation replaces history and previous-next controls wrap", async ({ page }) => {
  // Given Study 01 with a canonical prose link to Study 02
  await page.goto("/");
  const first = await studyPath(page, 1);
  const second = await studyPath(page, 2);
  await page.route(first, (route) => route.fulfill({ contentType: "text/html", body: fixture(`<a href="${second}">Study 02</a>`) }));
  await openStudy(page, 1);
  const markedLength = await page.evaluate(() => history.length);

  // When the prose link, previous, and next controls navigate within the reader
  await reader(page).getByRole("link", { name: "Study 02" }).click();
  expect(await page.evaluate(() => history.length)).toBe(markedLength);
  await expect.poll(() => page.evaluate(() => history.state.number)).toBe(2);
  await reader(page).locator('[data-reader-direction="previous"]').click();
  await expect.poll(() => page.evaluate(() => history.state.number)).toBe(1);
  await reader(page).locator('[data-reader-direction="previous"]').click();
  await expect.poll(() => page.evaluate(() => history.state.number)).toBe(23);
  await reader(page).locator('[data-reader-direction="next"]').click();

  // Then navigation wraps back to the first manifest entry without pushing entries
  await expect.poll(() => page.evaluate(() => history.state.number)).toBe(1);
  expect(await page.evaluate(() => history.length)).toBe(markedLength);
});

test("native link variants and arrow-key input behavior pass through", async ({ page }) => {
  // Given same-tab card enhancement and fetched prose with a native input
  await page.goto("/");
  expect(await observeNativeClick(page, 3, { target: "_blank" })).toBe(false);
  expect(await observeNativeClick(page, 4, { download: "study.html" })).toBe(false);
  expect(await observeNativeClick(page, 5, {}, { metaKey: true })).toBe(false);
  const path = await studyPath(page, 6);
  await page.route(path, (route) => route.fulfill({ contentType: "text/html", body: fixture('<input aria-label="reader input" value="abc"><h2>input</h2>') }));
  await openStudy(page, 6);
  const title = await reader(page).locator("[data-reader-title]").textContent();
  const input = reader(page).getByRole("textbox", { name: "reader input" });
  await input.focus();
  await input.evaluate((element) => element.setSelectionRange(1, 1));

  // When native left/right keys edit the input and the dialog receives an arrow key
  await page.keyboard.press("ArrowRight");
  expect(await input.evaluate((element) => element.selectionStart)).toBe(2);
  await reader(page).locator("[data-reader-title]").focus();
  await page.keyboard.press("ArrowLeft");

  // Then no study navigation is attached to arrows
  await expect(reader(page).locator("[data-reader-title]")).toHaveText(title ?? "");
  expect(await page.evaluate(() => history.state.number)).toBe(6);
});

test("focus starts at H2, wraps visible controls, and restores after Escape and backdrop", async ({ page }) => {
  // Given a keyboard-focused card opening the modal reader
  await page.goto("/");
  const opener = card(page, 3);
  await opener.focus();
  await openStudy(page, 3);
  const title = reader(page).locator("[data-reader-title]");
  await expect(title).toBeFocused();

  // When focus moves backward from the static title and forward from the last control
  await page.keyboard.press("Shift+Tab");
  await expect(reader(page).locator('[data-reader-direction="next"]')).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(reader(page).locator("[data-reader-close]")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(opener).toBeFocused();
  await openStudy(page, 3);
  await reader(page).evaluate((dialog) => dialog.dispatchEvent(new MouseEvent("click", { bubbles: true })));

  // Then both modal close paths restore the original invoker
  await expect(reader(page)).toBeHidden();
  await expect(opener).toBeFocused();
});

test("real Study 03 media and reader controls complete the headed journey", async ({ page }) => {
  // Given the canonical Study 03 reader with request tracking and a focused invoker
  const evidenceDirectory = process.env.TASK14_EVIDENCE_DIR;
  let studyRequests = 0;
  page.on("request", (request) => {
    if (request.resourceType() === "fetch" && new URL(request.url()).pathname.includes("/case-studies/03-")) studyRequests += 1;
  });
  await page.goto("/");
  const opener = card(page, 3);
  await opener.focus();
  await openStudy(page, 3);
  const video = reader(page).locator("video");
  await video.scrollIntoViewIfNeeded();

  // When the real recording plays, pauses, and adjacent controls navigate out and back
  await video.evaluate(async (element) => { await element.play(); });
  await expect.poll(() => video.evaluate((element) => element.paused)).toBe(false);
  await video.evaluate((element) => element.pause());
  await expect.poll(() => video.evaluate((element) => element.paused)).toBe(true);
  await reader(page).locator('[data-reader-direction="next"]').click();
  await expect.poll(() => page.evaluate(() => history.state.number)).toBe(4);
  await reader(page).locator('[data-reader-direction="previous"]').click();
  await expect.poll(() => page.evaluate(() => history.state.number)).toBe(3);

  // Then media URLs are canonical, cache reuse avoids another Study 03 request, and close restores focus
  expect(await video.getAttribute("poster")).toMatch(/^http:\/\/127\.0\.0\.1:8080\/case-studies\/03-/);
  expect(studyRequests).toBe(1);
  if (evidenceDirectory) {
    for (const width of [375, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.screenshot({ path: `${evidenceDirectory}/reader-${width}.png`, fullPage: false });
    }
  }
  await reader(page).locator("[data-reader-close]").click();
  await expect(opener).toBeFocused();
});

for (const failure of ["abort", "500", "malformed"]) {
  test(`${failure} canonical response falls back to the current standalone URL`, async ({ page }) => {
    // Given a first reader request that cannot produce canonical prose
    await page.goto("/");
    const path = await studyPath(page, 3);
    let firstRequest = true;
    await page.route(path, async (route) => {
      if (!firstRequest) return route.continue();
      firstRequest = false;
      if (failure === "abort") return route.abort();
      if (failure === "500") return route.fulfill({ status: 500, body: "failed" });
      return route.fulfill({ contentType: "text/html", body: "<main>missing prose</main>" });
    });

    // When the enhanced card is activated
    await revealStudy(page, 3);
    await card(page, 3).click({ noWaitAfter: true });

    // Then the current intent assigns the canonical URL and its standalone page renders
    await page.waitForURL((url) => url.pathname === path);
    await expect(page.locator("main.case-detail h1")).toBeVisible();
    await expect(page.locator("dialog[open]")).toHaveCount(0);
  });
}
