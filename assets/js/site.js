const root = document.documentElement;

function setupTheme() {
  const button = document.querySelector("[data-theme-toggle]");
  if (!button) return;

  const render = () => {
    const theme = root.dataset.theme === "light" ? "light" : "dark";
    button.textContent = theme === "dark" ? "light" : "dark";
    button.setAttribute("aria-label", `Switch to ${button.textContent} color scheme`);
  };

  button.addEventListener("click", () => {
    const theme = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = theme;
    localStorage.setItem("om-theme", theme);
    render();
  });
  render();
}

function setupScrollUI() {
  const progress = document.querySelector("[data-reading-progress]");
  const toTop = document.querySelector("[data-back-to-top]");
  if (!progress || !toTop) return;

  let scheduled = false;
  const render = () => {
    const available = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = available > 0 ? Math.min(window.scrollY / available, 1) : 0;
    progress.style.transform = `scaleX(${ratio})`;
    toTop.dataset.visible = String(window.scrollY > 640);
    scheduled = false;
  };
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(render);
  };

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  render();
}

function setupStudyIndex() {
  const grid = document.querySelector("[data-case-grid]");
  const toggle = document.querySelector("[data-grid-toggle]");
  const status = document.querySelector("[data-filter-status]");
  const filters = [...document.querySelectorAll("[data-topic-filter]")];
  if (!grid || !toggle || !status || filters.length === 0) return;

  const cards = [...grid.querySelectorAll("[data-case-card]")];
  let activeTopic = "all";
  let expanded = false;

  const render = () => {
    let visibleCount = 0;
    for (const card of cards) {
      const topics = (card.dataset.topics || "").split("|");
      const matches = activeTopic === "all" || topics.includes(activeTopic);
      const collapsed = card.dataset.initiallyHidden === "true";
      const visible = matches && (activeTopic !== "all" || expanded || !collapsed);
      card.hidden = !visible;
      if (visible) visibleCount += 1;
    }

    for (const filter of filters) {
      filter.setAttribute("aria-pressed", String(filter.dataset.topicFilter === activeTopic));
    }
    toggle.hidden = activeTopic !== "all";
    toggle.textContent = expanded ? "see less ↑" : "see more →";
    status.textContent = `${visibleCount} case ${visibleCount === 1 ? "study" : "studies"} shown`;
  };

  for (const filter of filters) {
    filter.addEventListener("click", () => {
      activeTopic = filter.dataset.topicFilter || "all";
      render();
    });
  }
  toggle.addEventListener("click", () => {
    expanded = !expanded;
    render();
    if (!expanded) document.querySelector("#index")?.scrollIntoView({ block: "start" });
  });
  render();
}

function setupReader() {
  const dialog = document.querySelector("[data-reader]");
  if (!(dialog instanceof HTMLDialogElement)) return;

  const panels = [...dialog.querySelectorAll("[data-reader-study]")];
  const numbers = panels.map((panel) => Number(panel.dataset.readerStudy));
  const closeButton = dialog.querySelector("[data-reader-close]");
  let activeNumber = 0;
  let returnFocus = null;

  const showStudy = (number, updateHash = true) => {
    const panel = panels.find((candidate) => Number(candidate.dataset.readerStudy) === number);
    if (!panel) return;
    activeNumber = number;
    for (const candidate of panels) candidate.hidden = candidate !== panel;
    dialog.setAttribute("aria-labelledby", `reader-title-${number}`);
    if (!dialog.open) dialog.showModal();
    document.body.classList.add("reader-open");
    dialog.scrollTop = 0;
    closeButton?.focus();
    if (updateHash && window.location.hash !== `#study-${number}`) {
      history.pushState(null, "", `#study-${number}`);
    }
  };

  const close = (updateHash = true) => {
    if (dialog.open) dialog.close();
    document.body.classList.remove("reader-open");
    if (updateHash && /^#study-\d+$/.test(window.location.hash)) {
      history.pushState(null, "", `${window.location.pathname}${window.location.search}`);
    }
    if (returnFocus instanceof HTMLElement) returnFocus.focus();
  };

  const navigate = (direction) => {
    const current = numbers.indexOf(activeNumber);
    const offset = direction === "next" ? 1 : -1;
    const next = (current + offset + numbers.length) % numbers.length;
    showStudy(numbers[next]);
  };

  document.addEventListener("click", (event) => {
    const opener = event.target.closest("[data-open-study]");
    if (opener) {
      returnFocus = opener;
      showStudy(Number(opener.dataset.openStudy));
      return;
    }
    const studyLink = event.target.closest('a[href^="/#study-"]');
    if (studyLink && window.location.pathname === "/") {
      event.preventDefault();
      showStudy(Number(studyLink.hash.replace("#study-", "")));
    }
  });
  closeButton?.addEventListener("click", () => close());
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    close();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) close();
  });
  dialog.addEventListener("click", (event) => {
    const direction = event.target.closest("[data-reader-direction]")?.dataset.readerDirection;
    if (direction) navigate(direction);
  });
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") navigate("previous");
    if (event.key === "ArrowRight") navigate("next");
  });
  window.addEventListener("hashchange", () => {
    const match = window.location.hash.match(/^#study-(\d+)$/);
    if (match) showStudy(Number(match[1]), false);
    else if (dialog.open) close(false);
  });

  const initial = window.location.hash.match(/^#study-(\d+)$/);
  if (initial) showStudy(Number(initial[1]), false);
}

setupTheme();
setupScrollUI();
setupStudyIndex();
setupReader();
