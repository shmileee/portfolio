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

async function closeContentOverlaps(page) {
  return page.evaluate(() => {
    const close = document.querySelector(".reader-close").getBoundingClientRect();
    const selectors = [
      ".reader-study > .reader-meta",
      ".reader-study > .reader-title",
      ".reader-prose > h3",
      ".reader-prose > p",
      ".reader-prose > ul",
      ".reader-prose > .media-exhibit",
      ".reader-prose > .diagram-exhibit",
      ".reader-navigation",
    ];
    return [...document.querySelectorAll(selectors.join(","))].flatMap((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.bottom <= 0 || rect.top >= innerHeight) return [];
      const width = Math.max(0, Math.min(close.right, rect.right) - Math.max(close.left, rect.left));
      const height = Math.max(0, Math.min(close.bottom, rect.bottom) - Math.max(close.top, rect.top));
      return width * height > 0 ? [{ area: width * height, selector: element.className || element.tagName }] : [];
    });
  });
}

async function manifestEntries(page) {
  return JSON.parse(await reader(page).locator("[data-reader-manifest]").textContent());
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

test("close and adjacent controls expose structured descriptive semantics", async ({ page }) => {
  // Given the study immediately before the longest manifest title
  await page.goto("/");
  const entries = await manifestEntries(page);
  const longest = entries.reduce((candidate, entry) => entry.title.length > candidate.title.length ? entry : candidate);
  const longestIndex = entries.findIndex(({ number }) => number === longest.number);
  const current = entries[(longestIndex - 1 + entries.length) % entries.length];
  const previous = entries[(longestIndex - 2 + entries.length) % entries.length];
  await openStudy(page, current.number);

  // Then Close is icon-only and each adjacent control exposes stable structured nodes
  const close = reader(page).locator("[data-reader-close]");
  await expect(close).toHaveText("×");
  await expect(close).toHaveAccessibleName("Close case study");

  for (const { direction, entry, kicker } of [
    { direction: "previous", entry: previous, kicker: "Previous" },
    { direction: "next", entry: longest, kicker: "Next" },
  ]) {
    const control = reader(page).locator(`[data-reader-direction="${direction}"]`);
    await expect(control.locator("[data-reader-direction-kicker]")).toHaveText(kicker);
    await expect(control.locator("[data-reader-case-number]")).toHaveText(`Case ${String(entry.number).padStart(2, "0")}`);
    await expect(control.locator("[data-reader-case-title]")).toHaveText(entry.title);
    await expect(control).toHaveAccessibleName(`${kicker} case study: Case ${String(entry.number).padStart(2, "0")} — ${entry.title}`);
  }
});

test("Task 6 sticky Close and adjacent cards keep exact responsive geometry", async ({ page }) => {
  const widths = [320, 375, 768, 1280, 1440];

  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/#study-12", { waitUntil: "networkidle" });
    await expect(reader(page)).toBeVisible();
    const close = reader(page).locator("[data-reader-close]");
    const navigation = reader(page).locator(".reader-navigation");
    const diagram = reader(page).locator(".diagram-exhibit").last();

    await diagram.scrollIntoViewIfNeeded();
    const settled = await page.evaluate(() => {
      const closeElement = document.querySelector("[data-reader-close]");
      const diagramElement = [...document.querySelectorAll(".reader-prose .diagram-exhibit")].at(-1);
      const closeRect = closeElement.getBoundingClientRect();
      const diagramRect = diagramElement.getBoundingClientRect();
      const navigationElement = document.querySelector(".reader-navigation");
      const navigationStyle = getComputedStyle(navigationElement);
      const controls = [...navigationElement.querySelectorAll("button")].map((control) => {
        const rect = control.getBoundingClientRect();
        const title = control.querySelector("[data-reader-case-title]");
        return {
          direction: control.dataset.readerDirection,
          height: rect.height,
          left: rect.left,
          textAlign: getComputedStyle(control).textAlign,
          titleClientWidth: title.clientWidth,
          titleOverflow: getComputedStyle(title).overflow,
          titleScrollWidth: title.scrollWidth,
          titleWhiteSpace: getComputedStyle(title).whiteSpace,
          width: rect.width,
        };
      });
      const overlapWidth = Math.max(
        0,
        Math.min(closeRect.right, diagramRect.right) - Math.max(closeRect.left, diagramRect.left),
      );
      const overlapHeight = Math.max(
        0,
        Math.min(closeRect.bottom, diagramRect.bottom) - Math.max(closeRect.top, diagramRect.top),
      );
      return {
        close: {
          borderRadius: getComputedStyle(closeElement).borderRadius,
          height: closeRect.height,
          width: closeRect.width,
        },
        controls,
        display: navigationStyle.display,
        gridTemplateColumns: navigationStyle.gridTemplateColumns,
        overlapArea: overlapWidth * overlapHeight,
        toolbarHeight: document.querySelector(".reader-toolbar").getBoundingClientRect().height,
      };
    });

    expect(settled.close).toEqual({ borderRadius: "50%", height: 44, width: 44 });
    expect(settled.toolbarHeight).toBeGreaterThanOrEqual(44);
    expect(settled.overlapArea).toBe(0);
    expect(await closeContentOverlaps(page)).toEqual([]);
    expect(settled.display).toBe("grid");
    expect(settled.controls).toHaveLength(2);
    for (const control of settled.controls) {
      expect(control.height).toBeGreaterThanOrEqual(40);
      expect(control.titleOverflow).toBe("visible");
      expect(control.titleWhiteSpace).toBe("normal");
      expect(control.titleScrollWidth).toBeLessThanOrEqual(control.titleClientWidth + 0.01);
    }
    if (width <= 600) {
      expect(settled.gridTemplateColumns.split(" ")).toHaveLength(1);
    } else {
      expect(settled.gridTemplateColumns.split(" ")).toHaveLength(2);
      expect(Math.abs(settled.controls[0].width - settled.controls[1].width)).toBeLessThanOrEqual(0.02);
      expect(settled.controls[0].textAlign).toBe("left");
      expect(settled.controls[1].textAlign).toBe("right");
    }

    await reader(page).evaluate((dialog) => { dialog.scrollTop = dialog.scrollHeight; });
    const deep = await close.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return {
        hitTarget: document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2) === element,
        visible: rect.top >= 0 && rect.bottom <= innerHeight,
      };
    });
    expect(deep).toEqual({ hitTarget: true, visible: true });
    expect(await closeContentOverlaps(page)).toEqual([]);
    await close.click();
    await expect(reader(page)).toBeHidden();

    await page.goto("/#study-3", { waitUntil: "networkidle" });
    await expect(reader(page)).toBeVisible();
    const media = reader(page).locator(".media-exhibit").first();
    await media.scrollIntoViewIfNeeded();
    await reader(page).locator("video").focus();
    expect(await closeContentOverlaps(page)).toEqual([]);

    await page.goto("/#study-4", { waitUntil: "networkidle" });
    await expect(reader(page)).toBeVisible();
    await reader(page).locator(".reader-navigation").scrollIntoViewIfNeeded();
    expect(await closeContentOverlaps(page)).toEqual([]);
    await reader(page).locator("[data-reader-close]").click();
    await expect(reader(page)).toBeHidden();
  }
});

test("unmodified arrows navigate with wrapping and replace reader history", async ({ page }) => {
  // Given an open reader with one marked history entry
  await page.goto("/");
  await openStudy(page, 6);
  const markedLength = await page.evaluate(() => history.length);

  // When unmodified arrows move forward and backward
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => page.evaluate(() => history.state.number)).toBe(7);
  expect(await page.evaluate(() => history.length)).toBe(markedLength);
  await page.keyboard.press("ArrowLeft");
  await expect.poll(() => page.evaluate(() => history.state.number)).toBe(6);
  expect(await page.evaluate(() => history.length)).toBe(markedLength);

  // And the first and last entries wrap in both directions
  await reader(page).locator("[data-reader-close]").click();
  await expect(reader(page)).toBeHidden();
  await openStudy(page, 1);
  const wrappedLength = await page.evaluate(() => history.length);
  await page.keyboard.press("ArrowLeft");
  await expect.poll(() => page.evaluate(() => history.state.number)).toBe(23);
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => page.evaluate(() => history.state.number)).toBe(1);
  expect(await page.evaluate(() => history.length)).toBe(wrappedLength);

  // Then every modified arrow remains native and does not navigate
  for (const key of ["Alt+ArrowRight", "Control+ArrowRight", "Meta+ArrowRight", "Shift+ArrowRight"]) {
    await page.keyboard.press(key);
    expect(await page.evaluate(() => history.state.number)).toBe(1);
    expect(await page.evaluate(() => history.length)).toBe(wrappedLength);
  }
});

test("focused diagrams retain native real-key arrows in standalone and reader", async ({ page }) => {
  // Given the real Study 12 diagram at a mobile viewport
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/");
  const path = await studyPath(page, 12);
  await page.goto(path);
  const standaloneDiagram = page.locator(".diagram-exhibit").first();
  await standaloneDiagram.focus();
  await page.evaluate(() => {
    window.__diagramArrowEvents = [];
    document.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        window.__diagramArrowEvents.push({ defaultPrevented: event.defaultPrevented, key: event.key });
      }
    });
  });

  // When native horizontal arrows operate the standalone scroll container
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => standaloneDiagram.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  await page.keyboard.press("ArrowLeft");
  await expect.poll(() => standaloneDiagram.evaluate((element) => element.scrollLeft)).toBe(0);

  // Then the standalone events remain uncanceled and the canonical study stays put
  expect(await page.evaluate(() => window.__diagramArrowEvents)).toEqual([
    { defaultPrevented: false, key: "ArrowRight" },
    { defaultPrevented: false, key: "ArrowLeft" },
  ]);
  expect(new URL(page.url()).pathname).toBe(path);

  // Given the same real diagram loaded into a marked reader entry
  await page.goto("/");
  await openStudy(page, 12);
  const readerDiagram = reader(page).locator(".diagram-exhibit").first();
  await readerDiagram.focus();
  await page.evaluate(() => {
    window.__diagramArrowEvents = [];
    document.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        window.__diagramArrowEvents.push({ defaultPrevented: event.defaultPrevented, key: event.key });
      }
    });
  });
  const readerState = await page.evaluate(() => ({
    hash: location.hash,
    historyLength: history.length,
    historyState: history.state,
  }));

  // When the focused wrapper receives real ArrowRight and ArrowLeft keys
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => reader(page).locator("[data-reader-study]").getAttribute("aria-busy")).toBe(null);
  expect(await page.evaluate(() => ({
    hash: location.hash,
    historyLength: history.length,
    historyState: history.state,
  }))).toEqual(readerState);
  await expect.poll(
    () => readerDiagram.evaluate((element) => element.scrollLeft),
  ).toBeGreaterThan(0);
  const rightScroll = await readerDiagram.evaluate((element) => element.scrollLeft);
  await page.keyboard.press("ArrowLeft");
  await expect.poll(() => readerDiagram.evaluate((element) => element.scrollLeft)).toBeLessThan(rightScroll);

  // And a real key event originating from a focused SVG descendant uses the same native owner
  await readerDiagram.evaluate((element) => { element.scrollLeft = 0; });
  const descendant = readerDiagram.locator("svg").first();
  await descendant.evaluate((element) => element.setAttribute("tabindex", "0"));
  await descendant.focus();
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => readerDiagram.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);

  // Then neither target is reader-canceled and study/hash/history stay fixed
  expect(await page.evaluate(() => window.__diagramArrowEvents)).toEqual([
    { defaultPrevented: false, key: "ArrowRight" },
    { defaultPrevented: false, key: "ArrowLeft" },
    { defaultPrevented: false, key: "ArrowRight" },
  ]);
  expect(await page.evaluate(() => ({
    hash: location.hash,
    historyLength: history.length,
    historyState: history.state,
  }))).toEqual(readerState);
  await expect(reader(page).locator("[data-reader-meta-number]")).toHaveText("Case study 12");
});

test("nested contenteditable Text node arrows remain native", async ({ page }) => {
  // Given fetched prose whose editable content is a nested Text node
  await page.goto("/");
  await page.route("**/case-studies/**", (route) => route.fulfill({
    contentType: "text/html",
    body: fixture('<div data-text-arrow-guard contenteditable="true">abc</div>'),
  }));

  for (const key of ["ArrowLeft", "ArrowRight"]) {
    await page.goto("/");
    await openStudy(page, 6);
    const before = await page.evaluate(() => ({
      number: history.state.number,
      hash: location.hash,
      historyLength: history.length,
    }));

    // When the bubbling arrow event originates from the editable Text node
    const defaultPrevented = await reader(page).locator("[data-text-arrow-guard]").evaluate((element, arrowKey) => {
      const target = element.firstChild;
      if (target?.nodeType !== Node.TEXT_NODE) throw new Error("Expected a nested Text node target");
      const event = new KeyboardEvent("keydown", { key: arrowKey, bubbles: true, cancelable: true });
      target.dispatchEvent(event);
      return event.defaultPrevented;
    }, key);
    await expect.poll(() => reader(page).locator("[data-reader-study]").getAttribute("aria-busy")).toBe(null);

    // Then native handling remains available without changing reader navigation state
    expect(defaultPrevented).toBe(false);
    expect(await page.evaluate(() => ({
      number: history.state.number,
      hash: location.hash,
      historyLength: history.length,
    }))).toEqual(before);
  }
});

test("native link variants and every guarded arrow target pass through", async ({ page }) => {
  // Given same-tab card enhancement and fetched prose with every guarded target kind
  await page.goto("/");
  expect(await observeNativeClick(page, 3, { target: "_blank" })).toBe(false);
  expect(await observeNativeClick(page, 4, { download: "study.html" })).toBe(false);
  expect(await observeNativeClick(page, 5, {}, { metaKey: true })).toBe(false);
  const path = await studyPath(page, 6);
  await page.route(path, (route) => route.fulfill({
    contentType: "text/html",
    body: fixture(`
      <input data-arrow-guard="input" aria-label="reader input" value="abc">
      <textarea data-arrow-guard="textarea" aria-label="reader textarea">abc</textarea>
      <select data-arrow-guard="select" aria-label="reader select"><option>first</option><option data-arrow-guard="option">second</option></select>
      <div data-arrow-guard="contenteditable" contenteditable="true">abc</div>
      <audio data-arrow-guard="audio" aria-label="reader audio" controls></audio>
      <video data-arrow-guard="video" aria-label="reader video" controls></video>
      <div data-arrow-guard="textbox" role="textbox" tabindex="0">abc</div>
      <div data-arrow-guard="searchbox" role="searchbox" tabindex="0">abc</div>
      <div data-arrow-guard="spinbutton" role="spinbutton" tabindex="0" aria-valuenow="1"></div>
      <div data-arrow-guard="slider" role="slider" tabindex="0" aria-valuenow="1"></div>
      <h2>guarded targets</h2>
    `),
  }));
  await openStudy(page, 6);
  const input = reader(page).getByRole("textbox", { name: "reader input" });
  await input.focus();
  await input.evaluate((element) => element.setSelectionRange(1, 1));

  // When native arrows move carets and values in actual editable/form controls
  await page.keyboard.press("ArrowRight");
  expect(await input.evaluate((element) => element.selectionStart)).toBe(2);
  const textarea = reader(page).getByRole("textbox", { name: "reader textarea" });
  await textarea.focus();
  await textarea.evaluate((element) => element.setSelectionRange(1, 1));
  await page.keyboard.press("ArrowRight");
  expect(await textarea.evaluate((element) => element.selectionStart)).toBe(2);
  const select = reader(page).getByRole("combobox", { name: "reader select" });
  await select.focus();
  const selectedIndex = await select.evaluate((element) => element.selectedIndex);
  await page.keyboard.press("ArrowRight");
  expect(await select.evaluate((element) => element.selectedIndex)).toBe(selectedIndex);
  const editable = reader(page).locator('[data-arrow-guard="contenteditable"]');
  await editable.focus();
  await editable.evaluate((element) => {
    const selection = getSelection();
    selection.removeAllRanges();
    selection.collapse(element.firstChild, 1);
  });
  await page.keyboard.press("ArrowRight");
  expect(await page.evaluate(() => getSelection().focusOffset)).toBe(2);
  await page.evaluate(() => {
    document.addEventListener("keydown", (event) => {
      const target = event.target.closest('[role="spinbutton"], [role="slider"]');
      if (!target || event.defaultPrevented || event.key !== "ArrowRight") return;
      target.setAttribute("aria-valuenow", String(Number(target.getAttribute("aria-valuenow")) + 1));
    });
  });
  for (const role of ["spinbutton", "slider"]) {
    const control = reader(page).getByRole(role);
    await control.focus();
    await page.keyboard.press("ArrowRight");
    await expect(control).toHaveAttribute("aria-valuenow", "2");
  }

  // And plain plus modified arrows are never canceled for any exclusion boundary
  const guards = ["input", "textarea", "select", "option", "contenteditable", "audio", "video", "textbox", "searchbox", "spinbutton", "slider"];
  for (const guard of guards) {
    const target = reader(page).locator(`[data-arrow-guard="${guard}"]`);
    for (const init of [
      { key: "ArrowLeft" },
      { key: "ArrowRight", altKey: true, ctrlKey: true, metaKey: true, shiftKey: true },
    ]) {
      expect(await target.evaluate((element, eventInit) => {
        const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...eventInit });
        element.dispatchEvent(event);
        return event.defaultPrevented;
      }, init)).toBe(false);
    }
  }

  // Then guarded interactions retain the current study and fixed history entry
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
