import { expect, test } from "@playwright/test";

const VIEWPORTS = [
  { name: "narrow", width: 375, height: 667 },
  { name: "desktop", width: 1440, height: 900 },
];

const EXPECTED_SECTION_ORDER = ["top", "index", "featured", "arc", "how-i-work"];
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
const SPOTLIGHT_SUMMARY =
  "Entering a new region became an infrastructure change, not an infrastructure project.";
const SPOTLIGHT_PROOF =
  "Environments became genuinely independent — a problem in one cannot spread to the others — their costs actually end when they are deleted, and entering a new region became an infrastructure change, not an infrastructure project.";

for (const viewport of VIEWPORTS) {
  test.describe(`homepage at ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });

    test("orders work before narrative and exposes the four-item navigation", async ({ page }) => {
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

      // Then the hiring journey reaches the work index first and preserves every target
      expect(sectionOrder).toEqual(EXPECTED_SECTION_ORDER);
      expect(navigation).toEqual(EXPECTED_NAVIGATION);
      expect(actions).toEqual(EXPECTED_ACTIONS);
      await expect(page.locator("main")).toHaveAttribute("tabindex", "-1");
      await expect(page.locator("[data-case-card]:visible")).toHaveCount(9);
    });

    test("renders the supported hiring snapshot and repository contact links", async ({ page }) => {
      // Given the homepage hiring hero
      await page.goto("/");
      const hero = page.locator("#top");

      // When its authored claims and contact destinations are read
      const heroText = (await hero.textContent()) ?? "";
      const contactLinks = await hero.locator(".contact-links a").evaluateAll((links) =>
        links.map((link) => link.getAttribute("href") ?? ""),
      );

      // Then only repository-supported hiring context is present
      await expect(hero).toContainText(
        "I'm a Platform & Site Reliability Engineer with several years owning the foundation used by a few hundred engineers.",
      );
      await expect(hero).toContainText(
        "My focus is AWS, Kubernetes, delivery, and reliability: making the right thing the easy thing so changes stay visible and reversible.",
      );
      expect(contactLinks).toEqual(EXPECTED_CONTACT_LINKS);
      expect(heroText).not.toMatch(
        /\b(?:résumé|resume|available|availability|based in|located in|\d+(?:\.\d+)?\s+years?)\b/i,
      );
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
