import { expect, test } from "@playwright/test";

import { caseStudy } from "./case-studies.js";

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
];
const EXPECTED_ARC_COPY = [
  "For four years, I owned the platform foundation of an industrial IoT company. I joined when infrastructure changes were still applied by hand; by the end, a few hundred engineers were shipping through systems designed to make changes visible, reviewable, and reversible.",
  "The work did not arrive as isolated projects. Each layer unlocked the next: reviewable changes made faster feedback safe; automation turned maintenance into background work; rebuilt foundations made self-service possible; and those foundations supported the newest chapter in secure AI tooling and customer-facing platforms.",
  "This is that four-year story in the order it happened. Each label opens the case study behind the step:",
];
const arcLabel = (id, label) => `${caseStudy(id).number} · ${label}`;
const EXPECTED_ARC_LABELS = [
  arcLabel("infrastructure-changes", "infrastructure changes"),
  arcLabel("audited-approve", "/approve"),
  arcLabel("self-service-buttons", "buttons"),
  arcLabel("fast-feedback", "feedback loop"),
  arcLabel("tool-versions", "tool versions"),
  arcLabel("terraform-product", "terraform repository"),
  arcLabel("dependency-updates", "dependency updates"),
  arcLabel("kubernetes-upgrades", "kubernetes upgrades"),
  arcLabel("fleet-patching", "fleet patching"),
  arcLabel("network-rebuild", "the network"),
  arcLabel("ephemeral-environments", "environments"),
  arcLabel("acquisition-migration", "acquisition"),
  arcLabel("registry-migration", "docker hub"),
  arcLabel("container-supply-chain", "container images"),
  arcLabel("cloud-functions", "cloud functions"),
  arcLabel("ai-tooling", "ai tooling"),
  arcLabel("agent-ready-codebase", "ai agents"),
];
const SPOTLIGHT_PROOF =
  "Each cell contains its own failure domain, joins the network by policy, and verifies teardown before infrastructure state can disappear.";

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

    test("renders the exact four-year narrative with six ordered beats and 17 labels", async ({ page }) => {
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
      expect(new Set(labels.map((label) => label.trim())).size).toBe(17);
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

      // Then it contains only structured proof, topics, and the enhanced canonical link
      await expect(featured.locator("[data-case-proof] dt")).toHaveText(["Impact", "My role", "Evidence"]);
      await expect(featured.locator("[data-case-proof] dd")).toHaveCount(3);
      await expect(featured).toContainText(SPOTLIGHT_PROOF);
      expect(topics).toEqual(["reliability", "cost", "delivery"]);
      await expect(featured.locator(".topic-featured")).toHaveCount(0);
      await expect(featured).not.toContainText("The teardown problem had no off-the-shelf solution");
      expect(spotlightHref).toMatch(/^\/case-studies\/[a-z0-9-]+\/$/);
      await expect(spotlightLink).toHaveAttribute("data-open-study", /^[a-z0-9-]+$/);

      // When the canonical study is loaded
      await page.goto(spotlightHref ?? "/");

      // Then the homepage title agrees with the canonical source title
      await expect(page.locator("h1")).toHaveText(spotlightTitle);
    });
  });
}
