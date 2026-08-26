const focusUrl = new URL("./reader-focus.js", import.meta.url);
const assetVersion = new URL(import.meta.url).searchParams.get("v");
if (assetVersion) focusUrl.searchParams.set("v", assetVersion);
const { isGuardedArrowTarget, visibleFocusables } = await import(focusUrl);

const STUDY_HASH = /^#study-(\d+)$/;

function createManifestIndex(manifestNode) {
  const entries = JSON.parse(manifestNode.textContent || "[]");
  return {
    entries,
    numbers: entries.map(({ number }) => number),
    byNumber: new Map(entries.map((entry) => [entry.number, entry])),
    byPath: new Map(entries.map((entry) => [new URL(entry.url, window.location.origin).pathname, entry])),
  };
}

function normalizeProse(prose, responseUrl) {
  for (const element of prose.querySelectorAll("[src], [poster], [href]")) {
    for (const attribute of ["src", "poster", "href"]) {
      const value = element.getAttribute(attribute);
      if (value?.trim()) element.setAttribute(attribute, new URL(value, responseUrl).href);
    }
  }
  for (const heading of prose.querySelectorAll("h2")) {
    const replacement = prose.ownerDocument.createElement("h3");
    for (const attribute of heading.attributes) replacement.setAttribute(attribute.name, attribute.value);
    replacement.append(...heading.childNodes);
    heading.replaceWith(replacement);
  }
  return prose.innerHTML;
}

function createContentLoader() {
  const cache = new Map();
  return (entry) => {
    const cached = cache.get(entry.number);
    if (cached) return cached;

    const pending = fetch(entry.url).then(async (response) => {
      if (!response.ok) throw new Error(`Study request failed with ${response.status}`);
      const source = new DOMParser().parseFromString(await response.text(), "text/html");
      const prose = source.querySelector(".case-detail-prose");
      if (!prose) throw new Error("Study response has no canonical prose");
      return normalizeProse(prose, response.url);
    });
    cache.set(entry.number, pending);
    pending.catch(() => {
      if (cache.get(entry.number) === pending) cache.delete(entry.number);
    });
    return pending;
  };
}

function isPrimarySameTab(event, anchor) {
  return (
    event.button === 0 &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey &&
    !anchor.hasAttribute("target") &&
    !anchor.hasAttribute("download")
  );
}

function isReaderState(state) {
  return state?.portfolioReader === true && Number.isInteger(state.number);
}

export function setupReader() {
  const dialog = document.querySelector("[data-reader]");
  if (!(dialog instanceof HTMLDialogElement)) return;

  const manifestNode = dialog.querySelector("[data-reader-manifest]");
  const study = dialog.querySelector("[data-reader-study]");
  const title = dialog.querySelector("[data-reader-title]");
  const prose = dialog.querySelector("[data-reader-prose]");
  const status = dialog.querySelector("[data-reader-status]");
  const metaNumber = dialog.querySelector("[data-reader-meta-number]");
  const metaTopics = dialog.querySelector("[data-reader-meta-topics]");
  const closeButton = dialog.querySelector("[data-reader-close]");
  const previousButton = dialog.querySelector('[data-reader-direction="previous"]');
  const nextButton = dialog.querySelector('[data-reader-direction="next"]');
  const previousKicker = previousButton?.querySelector("[data-reader-direction-kicker]");
  const previousNumber = previousButton?.querySelector("[data-reader-case-number]");
  const previousTitle = previousButton?.querySelector("[data-reader-case-title]");
  const nextKicker = nextButton?.querySelector("[data-reader-direction-kicker]");
  const nextNumber = nextButton?.querySelector("[data-reader-case-number]");
  const nextTitle = nextButton?.querySelector("[data-reader-case-title]");
  if (
    !manifestNode || !study || !title || !prose || !status || !metaNumber || !metaTopics || !closeButton ||
    !previousButton || !previousKicker || !previousNumber || !previousTitle ||
    !nextButton || !nextKicker || !nextNumber || !nextTitle
  ) return;

  const manifest = createManifestIndex(manifestNode);
  const loadContent = createContentLoader();
  let activeNumber = 0;
  let intentGeneration = 0;
  let returnFocus = null;
  let closingMarkedEntry = false;

  const entryFromHash = () => {
    const match = window.location.hash.match(STUDY_HASH);
    return match ? manifest.byNumber.get(Number(match[1])) : undefined;
  };

  const hideReader = () => {
    const focusTarget = returnFocus;
    const wasOpen = dialog.open;
    returnFocus = null;
    intentGeneration += 1;
    study.removeAttribute("aria-busy");
    if (wasOpen) dialog.close();
    document.body.classList.remove("reader-open");
    if (focusTarget?.isConnected) focusTarget.focus();
    else if (wasOpen) document.querySelector("#main-content")?.focus();
  };

  const closeReader = () => {
    if (isReaderState(history.state)) {
      if (closingMarkedEntry) return;
      closingMarkedEntry = true;
      hideReader();
      history.back();
      return;
    }
    if (STUDY_HASH.test(window.location.hash)) {
      history.replaceState(history.state, "", `${window.location.pathname}${window.location.search}`);
    }
    hideReader();
  };

  const updateHistory = (entry, mode) => {
    const hash = `#study-${entry.number}`;
    if (mode === "push") {
      history.pushState({ portfolioReader: true, number: entry.number }, "", hash);
    } else if (mode === "replace") {
      const state = isReaderState(history.state)
        ? { portfolioReader: true, number: entry.number }
        : history.state;
      history.replaceState(state, "", hash);
    }
  };

  const renderStudy = (entry, content) => {
    const current = manifest.numbers.indexOf(entry.number);
    const previous = manifest.byNumber.get(manifest.numbers[(current - 1 + manifest.numbers.length) % manifest.numbers.length]);
    const next = manifest.byNumber.get(manifest.numbers[(current + 1) % manifest.numbers.length]);
    activeNumber = entry.number;
    metaNumber.textContent = `Case study ${String(entry.number).padStart(2, "0")}`;
    metaTopics.textContent = ` · ${entry.topics.join(" · ")}`;
    title.textContent = entry.title;
    prose.innerHTML = content;
    previousKicker.textContent = "Previous";
    previousNumber.textContent = `Case ${String(previous.number).padStart(2, "0")}`;
    previousTitle.textContent = previous.title;
    previousButton.setAttribute("aria-label", `Previous case study: ${previousNumber.textContent} — ${previous.title}`);
    nextKicker.textContent = "Next";
    nextNumber.textContent = `Case ${String(next.number).padStart(2, "0")}`;
    nextTitle.textContent = next.title;
    nextButton.setAttribute("aria-label", `Next case study: ${nextNumber.textContent} — ${next.title}`);
    study.removeAttribute("aria-busy");
    status.textContent = `${entry.title} loaded.`;
    if (!dialog.open) dialog.showModal();
    document.body.classList.add("reader-open");
    dialog.scrollTop = 0;
    title.focus();
  };

  const showStudy = async (entry, historyMode) => {
    const intent = ++intentGeneration;
    study.setAttribute("aria-busy", "true");
    status.textContent = `Loading ${entry.title}.`;
    try {
      const content = await loadContent(entry);
      if (intent !== intentGeneration) return;
      renderStudy(entry, content);
      updateHistory(entry, historyMode);
    } catch {
      if (intent !== intentGeneration) return;
      study.removeAttribute("aria-busy");
      window.location.assign(entry.url);
    }
  };

  const navigate = (direction) => {
    const current = manifest.numbers.indexOf(activeNumber);
    if (current < 0) return false;
    const offset = direction === "next" ? 1 : -1;
    const number = manifest.numbers[(current + offset + manifest.numbers.length) % manifest.numbers.length];
    const entry = manifest.byNumber.get(number);
    if (!entry) return false;
    showStudy(entry, "replace");
    return true;
  };

  const handleLocation = () => {
    closingMarkedEntry = false;
    const entry = entryFromHash();
    if (entry) showStudy(entry, "none");
    else hideReader();
  };

  document.addEventListener("click", (event) => {
    const anchor = event.target.closest("a");
    if (!anchor || !isPrimarySameTab(event, anchor)) return;

    const url = new URL(anchor.href);
    const hashMatch = url.hash.match(STUDY_HASH);
    const sameDocument = url.origin === window.location.origin && url.pathname === window.location.pathname && url.search === window.location.search;
    if (!dialog.open && sameDocument && hashMatch && manifest.byNumber.has(Number(hashMatch[1]))) {
      returnFocus = anchor;
      return;
    }

    let entry;
    if (anchor.matches("[data-open-study]")) {
      entry = manifest.byNumber.get(Number(anchor.dataset.openStudy));
    } else if (dialog.open && prose.contains(anchor)) {
      if (url.origin === window.location.origin) entry = manifest.byPath.get(url.pathname);
    }
    if (!entry) return;
    event.preventDefault();
    if (!dialog.open) returnFocus = anchor;
    showStudy(entry, dialog.open ? "replace" : "push");
  });
  closeButton?.addEventListener("click", closeReader);
  previousButton?.addEventListener("click", () => navigate("previous"));
  nextButton?.addEventListener("click", () => navigate("next"));
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeReader();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeReader();
  });
  dialog.addEventListener("keydown", (event) => {
    const isArrow = event.key === "ArrowLeft" || event.key === "ArrowRight";
    const isModified = event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
    if (dialog.open && isArrow && !isModified && !isGuardedArrowTarget(event.target)) {
      if (navigate(event.key === "ArrowRight" ? "next" : "previous")) event.preventDefault();
      return;
    }
    if (event.key !== "Tab") return;
    const focusables = visibleFocusables(dialog);
    const first = focusables[0];
    const last = focusables.at(-1);
    if (event.shiftKey && (document.activeElement === first || !focusables.includes(document.activeElement))) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !focusables.includes(document.activeElement))) {
      event.preventDefault();
      first?.focus();
    }
  });
  window.addEventListener("popstate", handleLocation);
  window.addEventListener("hashchange", handleLocation);
  handleLocation();
}
