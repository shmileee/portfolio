import { expect, test } from "@playwright/test";

const VIEWPORTS = [
  { name: "narrow", width: 375, height: 667 },
  { name: "desktop", width: 1440, height: 900 },
];

const EXPECTED_SECTION_ORDER = ["top", "arc", "featured", "index", "how-i-work"];
const EXPECTED_SECTION_EYEBROWS = [
  ["arc", "01 — Four years at an industrial IoT company"],
  ["featured", "02"],
  ["index", "03"],
  ["how-i-work", "04"],
];
const EXPECTED_NAVIGATION = [
  ["Work", "/#index"],
  ["The arc", "/#arc"],
  ["How I work", "/#how-i-work"],
  ["Contact", "/#contact"],
];
const EXPECTED_ACTIONS = [
  ["Browse case studies →", "#index"],
  ["Contact me →", "#contact"],
];
const EXPECTED_CONTACT_LINKS = [
  "https://github.com/shmileee",
  "https://www.linkedin.com/in/aleksandr-ponomarov",
  "mailto:ponomarov.aleksandr@gmail.com",
];
const EXPECTED_ARC_COPY = [
  "For four years, I owned the platform foundation of an industrial IoT company. I joined when infrastructure changes were still applied by hand; by the end, a few hundred engineers were shipping through systems designed to make changes visible, reviewable, and reversible.",
  "The work did not arrive as isolated projects. Each layer unlocked the next: reviewable changes made faster feedback safe; automation turned maintenance into background work; rebuilt foundations made self-service possible; and those foundations supported the newest chapter in secure AI tooling and customer-facing platforms.",
  "This is that four-year story in the order it happened. Each label opens the case study behind the step:",
];
const EXPECTED_ARC_LABELS = [
  "1 · infrastructure changes",
  "2 · /approve",
  "3 · buttons",
  "4 · feedback loop",
  "5 · tool versions",
  "7 · terraform repository",
  "8 · dependency updates",
  "9 · kubernetes upgrades",
  "12 · fleet patching",
  "13 · the network",
  "14 · environments",
  "16 · acquisition",
  "17 · docker hub",
  "19 · container images",
  "20 · source code",
  "21 · cloud functions",
  "22 · ai tooling",
  "23 · ai agents",
];
const SPOTLIGHT_SUMMARY =
  "Entering a new region became an infrastructure change, not an infrastructure project.";
const SPOTLIGHT_PROOF =
  "Environments became genuinely independent — a problem in one cannot spread to the others — their costs actually end when they are deleted, and entering a new region became an infrastructure change, not an infrastructure project.";

for (const viewport of VIEWPORTS) {
  test.describe(`homepage at ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });

    test("leads with the numbered platform arc and preserves homepage navigation", async ({ page }) => {
      // Given the homepage at the acceptance viewport
      await page.goto("/");

      // When its primary sections, navigation, and hero actions are read
      const sectionOrder = await page.locator("main > section").evaluateAll((sections) =>
        sections.map((section) => section.id),
      );
      const navigation = await page.locator(".site-nav > a").evaluateAll((links) =>
        links.map((link) => [link.textContent?.trim() ?? "", link.getAttribute("href") ?? ""]),
      );
      const actions = await page.locator("#top > div.hero-actions a").evaluateAll((links) =>
        links.map((link) => [link.textContent?.trim() ?? "", link.getAttribute("href") ?? ""]),
      );
      const sectionEyebrows = await page
        .locator("#arc, #featured, #index, #how-i-work")
        .evaluateAll((sections) =>
          sections.map((section) => [
            section.id,
            section.querySelector(".section-eyebrow")?.textContent?.trim() ?? "",
          ]),
        );

      // Then the four-year story leads the work while every destination stays stable
      expect(sectionOrder).toEqual(EXPECTED_SECTION_ORDER);
      expect(sectionEyebrows).toEqual(EXPECTED_SECTION_EYEBROWS);
      expect(navigation).toEqual(EXPECTED_NAVIGATION);
      expect(actions).toEqual(EXPECTED_ACTIONS);
      await expect(page.locator("main")).toHaveAttribute("tabindex", "-1");
      await expect(page.locator("[data-case-card]:visible")).toHaveCount(9);
    });

    test("keeps the hiring snapshot and footer contacts without hero profile links", async ({ page }) => {
      // Given the homepage hiring hero
      await page.goto("/");
      const hero = page.locator("#top");

      // When its authored claims and contact destinations are read
      const heroText = (await hero.textContent()) ?? "";
      const footerContactLinks = await page.locator("#contact .contact-links a").evaluateAll((links) =>
        links.map((link) => link.getAttribute("href") ?? ""),
      );

      // Then only repository-supported hiring context is present
      await expect(hero).toContainText(
        "I'm a Platform & Site Reliability Engineer with several years owning the foundation used by a few hundred engineers.",
      );
      await expect(hero).toContainText(
        "My focus is AWS, Kubernetes, delivery, and reliability: making the right thing the easy thing so changes stay visible and reversible.",
      );
      await expect(hero.locator(".contact-links")).toHaveCount(0);
      expect(footerContactLinks).toEqual(EXPECTED_CONTACT_LINKS);
      expect(heroText).not.toMatch(
        /\b(?:résumé|resume|available|availability|based in|located in|\d+(?:\.\d+)?\s+years?)\b/i,
      );
    });

    test("renders the exact four-year narrative with six ordered beats and 18 labels", async ({ page }) => {
      // Given the homepage narrative arc
      await page.goto("/");
      const arc = page.locator("#arc");

      // When its authored introduction, beats, and study labels are read
      const paragraphs = await arc.locator(".section-intro > p").allTextContents();
      const beatNumbers = await arc.locator(".arc-number").allTextContents();
      const labels = await arc.locator(".arc-links a").allTextContents();

      // Then the approved four-year copy and authored sequence are exact
      await expect(arc.locator("h2")).toHaveText("Each layer made the next one possible");
      expect(paragraphs.map((paragraph) => paragraph.trim())).toEqual(EXPECTED_ARC_COPY);
      expect(beatNumbers.map((number) => number.trim())).toEqual(["01", "02", "03", "04", "05", "06"]);
      expect(labels.map((label) => label.trim())).toEqual(EXPECTED_ARC_LABELS);
      expect(new Set(labels.map((label) => label.trim())).size).toBe(18);
    });

    test("renders the metadata spotlight without an extra label or full article", async ({ page }) => {
      // Given the concise featured section
      await page.goto("/");
      const featured = page.locator("#featured");
      const spotlightLink = featured.locator("[data-open-study]");

      // When its source-driven proof and canonical destination are inspected
      const spotlightTitle = (await featured.locator("h3").textContent())?.trim() ?? "";
      const spotlightHref = await spotlightLink.getAttribute("href");
      const topics = await featured.locator(".topic-list span").allTextContents();

      // Then it contains only title, summary, proof, topics, and the enhanced canonical link
      await expect(featured).toContainText(SPOTLIGHT_SUMMARY);
      await expect(featured).toContainText(SPOTLIGHT_PROOF);
      expect(topics).toEqual(["reliability", "cost", "delivery"]);
      await expect(featured.locator(".topic-featured")).toHaveCount(0);
      await expect(featured).not.toContainText("The teardown problem had no off-the-shelf solution");
      expect(spotlightHref).toMatch(/^\/case-studies\/[a-z0-9-]+\/$/);
      await expect(spotlightLink).toHaveAttribute("data-open-study", /^\d+$/);

      // When the canonical study is loaded
      await page.goto(spotlightHref ?? "/");

      // Then the homepage title agrees with the canonical source title
      await expect(page.locator("h1")).toHaveText(spotlightTitle);
    });
  });
}
