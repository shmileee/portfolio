const STUDY_HASH = /^#study-(\d+)$/;
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

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

function visibleFocusables(dialog) {
  return [...dialog.querySelectorAll(FOCUSABLE_SELECTOR)].filter((element) => {
    const style = getComputedStyle(element);
    const bounds = element.getBoundingClientRect();
    return !element.hidden && style.display !== "none" && style.visibility !== "hidden" && bounds.width > 0 && bounds.height > 0;
  });
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
  if (!manifestNode || !study || !title || !prose || !status || !metaNumber || !metaTopics) return;

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
    intentGeneration += 1;
    study.removeAttribute("aria-busy");
    if (dialog.open) dialog.close();
    document.body.classList.remove("reader-open");
    if (returnFocus?.isConnected) returnFocus.focus();
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
    if (previousButton) previousButton.textContent = `← ${String(previous.number).padStart(2, "0")} · ${previous.title}`;
    if (nextButton) nextButton.textContent = `${String(next.number).padStart(2, "0")} · ${next.title} →`;
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
    const offset = direction === "next" ? 1 : -1;
    const number = manifest.numbers[(current + offset + manifest.numbers.length) % manifest.numbers.length];
    showStudy(manifest.byNumber.get(number), "replace");
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

    let entry;
    if (anchor.matches("[data-open-study]")) {
      entry = manifest.byNumber.get(Number(anchor.dataset.openStudy));
    } else if (dialog.open && prose.contains(anchor)) {
      const url = new URL(anchor.href);
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
