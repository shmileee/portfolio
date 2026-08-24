import { expect, test } from "@playwright/test";

const VIEWPORTS = [
  { width: 320, height: 568 },
  { width: 375, height: 667 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
];
const STUDY_PATH = "/case-studies/14-environments-you-can-create-and-destroy-with-one-command/";
const THEME_STUDY_PATH =
  "/case-studies/21-customer-code-running-safely-self-service-cloud-functions/";
const CONTROL_SELECTOR = [
  ".brand-link",
  ".site-nav a",
  "[data-theme-toggle]",
  ".hero-actions > a",
  ".contact-links a",
  ".arc-links a",
  "[data-topic-filter]",
  "[data-grid-toggle]",
  "[data-reader-close]",
  "[data-reader-direction]",
  ".back-link",
  ".case-detail-footer a",
  "[data-back-to-top]",
].join(",");

async function expectNoOverflow(page) {
  const geometry = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth);
  return geometry;
}

async function expectNamedTargets(page) {
  const undersized = await page.locator(CONTROL_SELECTOR).evaluateAll((elements) =>
    elements
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          label: element.getAttribute("aria-label") || element.textContent?.trim(),
          width: rect.width,
          height: rect.height,
        };
      })
      .filter(({ width, height }) => width > 0 && height > 0 && (width < 39.99 || height < 39.99)),
  );
  expect(undersized).toEqual([]);
}

async function getContrastFacts(page) {
  return page.evaluate(() => {
    const rgba = (value) => {
      const probe = document.createElement("span");
      probe.style.color = value;
      document.body.append(probe);
      const channels = getComputedStyle(probe).color.match(/[\d.]+/g).map(Number);
      probe.remove();
      return [channels[0], channels[1], channels[2], channels[3] ?? 1];
    };
    const composite = (foreground, background) => foreground.slice(0, 3).map(
      (channel, index) => channel * foreground[3] + background[index] * (1 - foreground[3]),
    );
    const luminance = (color) => {
      const linear = color.slice(0, 3).map((channel) => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
    };
    const ratio = (foreground, background) => {
      const first = luminance(composite(rgba(foreground), rgba(background)));
      const second = luminance(rgba(background));
      return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
    };
    const body = getComputedStyle(document.body);
    const footer = getComputedStyle(document.querySelector(".footer-note"));
    const root = getComputedStyle(document.documentElement);
    return {
      body: ratio(body.color, body.backgroundColor),
      focus: ratio(root.getPropertyValue("--focus-ring"), body.backgroundColor),
      tertiary: ratio(footer.color, body.backgroundColor),
    };
  });
}

async function getExhibitThemeFacts(page) {
  return page.evaluate(() => {
    const parseColor = (value) => {
      const channels = value.match(/[\d.]+/g)?.map(Number);
      if (!channels || channels.length < 3) throw new TypeError(`Unable to parse color: ${value}`);
      return [channels[0], channels[1], channels[2], channels[3] ?? 1];
    };
    const composite = (foreground, background) => {
      const alpha = foreground[3] + background[3] * (1 - foreground[3]);
      if (alpha === 0) return [0, 0, 0, 0];
      return [
        ...foreground.slice(0, 3).map(
          (channel, index) =>
            (channel * foreground[3] + background[index] * background[3] * (1 - foreground[3])) /
            alpha,
        ),
        alpha,
      ];
    };
    const background = (element) => {
      const layers = [];
      for (let current = element; current; current = current.parentElement) {
        layers.push(parseColor(getComputedStyle(current).backgroundColor));
      }
      return layers.reverse().reduce((result, layer) => composite(layer, result), [255, 255, 255, 1]);
    };
    const luminance = (color) => {
      const linear = color.slice(0, 3).map((channel) => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
    };
    const ratio = (foreground, backdrop) => {
      const foregroundLuminance = luminance(composite(parseColor(foreground), backdrop));
      const backgroundLuminance = luminance(backdrop);
      return (
        (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
        (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
      );
    };
    const query = (selector) => {
      const element = document.querySelector(selector);
      if (!element) throw new TypeError(`Missing exhibit element: ${selector}`);
      return element;
    };
    const style = (selector) => getComputedStyle(query(selector));
    const resolveColor = (value) => {
      const probe = document.createElement("span");
      probe.style.color = value;
      document.body.append(probe);
      const resolved = getComputedStyle(probe).color;
      probe.remove();
      return resolved;
    };

    const codeElement = query(".code-exhibit");
    const toolbarElement = query(".code-exhibit .exhibit-toolbar");
    const filenameElement = query(".code-exhibit .exhibit-filename");
    const badgeElement = query(".code-exhibit .exhibit-badge");
    const preElement = query(".code-exhibit pre");
    const commentElement = query(".code-exhibit .token.comment");
    const keywordElement = query(".code-exhibit .token.keyword, .code-exhibit .token.key");
    const valueElement = query(".code-exhibit .token.string, .code-exhibit .token.number");
    const diagramElement = query(".diagram-exhibit");
    const diagramLabelElement = query(".diagram-exhibit-label");
    const svgRectElement = query(".diagram-exhibit svg rect");
    const svgPrimaryTextElement = query(".diagram-exhibit svg text[font-weight='500']");
    const svgSecondaryTextElement = query(".diagram-exhibit svg text:not([font-weight='500'])");
    const svgEmphasisTextElement = query(".diagram-exhibit svg text[fill*='--w7']");
    const svgConnectorElement = query(".diagram-exhibit svg path[stroke]");
    const svgMarkerElement = query(".diagram-exhibit svg marker path");
    const codeStyle = getComputedStyle(codeElement);
    const toolbarStyle = getComputedStyle(toolbarElement);
    const preStyle = getComputedStyle(preElement);
    const diagramStyle = getComputedStyle(diagramElement);
    const svgRectStyle = getComputedStyle(svgRectElement);
    const diagramBackground = background(diagramElement);
    const codeBackground = background(codeElement);
    const root = getComputedStyle(document.documentElement);
    const variables = Object.fromEntries(
      ["--bg", "--w88", "--w45", "--w42", "--w5", "--w7", "--ab4"].map((name) => [
        name,
        resolveColor(diagramStyle.getPropertyValue(name)),
      ]),
    );
    const dialog = document.querySelector("[data-reader]");

    return {
      theme: document.documentElement.dataset.theme,
      tokens: {
        codeSurface: resolveColor(root.getPropertyValue("--code-surface")),
        diagramSurface: resolveColor(root.getPropertyValue("--diagram-surface")),
      },
      styles: {
        codeSurface: codeStyle.backgroundColor,
        codeBorder: codeStyle.borderColor,
        toolbarSurface: toolbarStyle.backgroundColor,
        toolbarBorder: toolbarStyle.borderBottomColor,
        codeText: preStyle.color,
        diagramSurface: diagramStyle.backgroundColor,
        diagramBorder: diagramStyle.borderColor,
        svgNodeFill: svgRectStyle.fill,
        svgNodeStroke: svgRectStyle.stroke,
        svgPrimaryText: getComputedStyle(svgPrimaryTextElement).fill,
        svgSecondaryText: getComputedStyle(svgSecondaryTextElement).fill,
        svgEmphasisText: getComputedStyle(svgEmphasisTextElement).fill,
        svgConnector: getComputedStyle(svgConnectorElement).stroke,
        svgMarker: getComputedStyle(svgMarkerElement).fill,
      },
      variables,
      contrast: {
        codeText: ratio(preStyle.color, background(preElement)),
        filename: ratio(getComputedStyle(filenameElement).color, background(filenameElement)),
        badge: ratio(getComputedStyle(badgeElement).color, background(badgeElement)),
        comment: ratio(getComputedStyle(commentElement).color, background(commentElement)),
        keyword: ratio(getComputedStyle(keywordElement).color, background(keywordElement)),
        value: ratio(getComputedStyle(valueElement).color, background(valueElement)),
        diagramLabel: ratio(getComputedStyle(diagramLabelElement).color, diagramBackground),
        diagramPrimary: ratio(getComputedStyle(svgPrimaryTextElement).fill, diagramBackground),
        diagramSecondary: ratio(getComputedStyle(svgSecondaryTextElement).fill, diagramBackground),
        diagramEmphasis: ratio(getComputedStyle(svgEmphasisTextElement).fill, diagramBackground),
        codeBorder: ratio(codeStyle.borderColor, background(codeElement.parentElement)),
        toolbarBorder: ratio(toolbarStyle.borderBottomColor, codeBackground),
        diagramBorder: ratio(diagramStyle.borderColor, background(diagramElement.parentElement)),
        nodeBorder: ratio(svgRectStyle.stroke, parseColor(svgRectStyle.fill)),
        connector: ratio(getComputedStyle(svgConnectorElement).stroke, diagramBackground),
      },
      overflow: {
        pageClientWidth: document.documentElement.clientWidth,
        pageScrollWidth: document.documentElement.scrollWidth,
        dialogClientWidth: dialog?.clientWidth ?? null,
        dialogScrollWidth: dialog?.scrollWidth ?? null,
      },
    };
  });
}

for (const viewport of VIEWPORTS) {
  test(`responsive geometry and targets at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expectNoOverflow(page);
    await expectNamedTargets(page);

    if (viewport.width <= 900) {
      await page.locator("#index").evaluate((element) => element.scrollIntoView());
      const positions = await page.evaluate(() => ({
        headerBottom: document.querySelector("[data-site-header]").getBoundingClientRect().bottom,
        sectionTop: document.querySelector("#index").getBoundingClientRect().top,
      }));
      expect(positions.sectionTop).toBeGreaterThanOrEqual(positions.headerBottom - 1);
    }

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(page.locator("[data-back-to-top]")).toHaveAttribute("data-visible", "true");
    const overlap = await page.evaluate(() => {
      const button = document.querySelector("[data-back-to-top]").getBoundingClientRect();
      return [...document.querySelectorAll(".footer-brand, .footer-note, .footer-inner .contact-links")]
        .map((element) => element.getBoundingClientRect())
        .reduce((area, footer) => {
          const width = Math.max(0, Math.min(button.right, footer.right) - Math.max(button.left, footer.left));
          const height = Math.max(0, Math.min(button.bottom, footer.bottom) - Math.max(button.top, footer.top));
          return area + width * height;
        }, 0);
    });
    expect(overlap).toBe(0);

    await page.locator('[data-open-study="14"]:visible').first().click();
    await expect(page.locator("[data-reader]")).toBeVisible();
    await expectNoOverflow(page);
    const reader = await page.locator(".reader-shell").boundingBox();
    expect(reader).not.toBeNull();
    expect(reader.x).toBeGreaterThanOrEqual(0);
    expect(reader.x + reader.width).toBeLessThanOrEqual(viewport.width);
    await expectNamedTargets(page);
    const readerProse = page.locator("[data-reader-prose]");
    await expect(readerProse.locator(":scope > h2")).toHaveCount(0);
    const readerSections = readerProse.locator(":scope > h3");
    expect(await readerSections.count()).toBeGreaterThan(0);
    const readerSectionStyle = await readerSections.first().evaluate((section) => {
      const style = getComputedStyle(section);
      return {
        afterHeight: getComputedStyle(section, "::after").height,
        display: style.display,
        fontFamily: style.fontFamily,
        textTransform: style.textTransform,
      };
    });
    expect(readerSectionStyle.display).toBe("flex");
    expect(readerSectionStyle.fontFamily).toContain("IBM Plex Mono");
    expect(readerSectionStyle.textTransform).toBe("uppercase");
    expect(readerSectionStyle.afterHeight).toBe("1px");
    const readerAlignment = await readerProse.locator(":scope > p").first().evaluate(
      (paragraph) => getComputedStyle(paragraph).textAlign,
    );
    expect(["left", "start"]).toContain(readerAlignment);
    await page.locator("[data-reader]").evaluate((dialog) => dialog.close());

    await page.goto(STUDY_PATH);
    await expectNoOverflow(page);
    await expectNamedTargets(page);
    const standaloneAlignment = await page.locator(".case-detail-prose > p").first().evaluate(
      (paragraph) => getComputedStyle(paragraph).textAlign,
    );
    expect(["left", "start"]).toContain(standaloneAlignment);
  });
}

test("320px layout fits beside a classic vertical scrollbar", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });

  for (const path of ["/", STUDY_PATH]) {
    await page.goto(path);
    await page.addStyleTag({ content: "html { overflow-y: scroll; scrollbar-gutter: stable; }" });
    const geometry = await page.evaluate(() => {
      const probe = document.createElement("div");
      probe.style.cssText = "position: fixed; inset: 0; pointer-events: none";
      document.body.append(probe);
      const viewportRight = probe.getBoundingClientRect().right;
      const bodyRight = document.body.getBoundingClientRect().right;
      probe.remove();
      return { bodyRight, scrollWidth: document.documentElement.scrollWidth, viewportRight };
    });
    expect(geometry.bodyRight, `${path} body exceeds the scrollbar-adjusted viewport`).toBeLessThanOrEqual(
      geometry.viewportRight,
    );
    expect(geometry.scrollWidth, `${path} scrolls horizontally beside a classic scrollbar`).toBeLessThanOrEqual(
      geometry.viewportRight,
    );
  }
});

for (const theme of ["dark", "light"]) {
  test(`${theme} theme meets contrast and keyboard-focus thresholds`, async ({ page }) => {
    await page.addInitScript((selectedTheme) => localStorage.setItem("om-theme", selectedTheme), theme);
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    const contrast = await getContrastFacts(page);
    expect(contrast.body).toBeGreaterThanOrEqual(4.5);
    expect(contrast.tertiary).toBeGreaterThanOrEqual(4.5);
    expect(contrast.focus).toBeGreaterThanOrEqual(3);

    await page.keyboard.press("Tab");
    const focus = await page.locator(":focus-visible").evaluate((element) => {
      const style = getComputedStyle(element);
      return { color: style.outlineColor, style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
    });
    expect(focus.style).toBe("solid");
    expect(focus.width).toBeGreaterThanOrEqual(3);
    expect(focus.color).not.toBe("rgba(0, 0, 0, 0)");
  });
}

test("code and inline diagrams adapt across standalone and reader themes", async ({ browser }) => {
  const facts = {};

  for (const viewport of [{ width: 375, height: 900 }, { width: 1440, height: 900 }]) {
    facts[viewport.width] = {};
    for (const surface of ["standalone", "reader"]) {
      facts[viewport.width][surface] = {};
      for (const theme of ["dark", "light"]) {
        const context = await browser.newContext({ viewport });
        await context.addInitScript((selectedTheme) => {
          localStorage.setItem("om-theme", selectedTheme);
        }, theme);
        const page = await context.newPage();
        const path = surface === "standalone" ? THEME_STUDY_PATH : "/#study-21";
        await page.goto(path, { waitUntil: "networkidle" });
        if (surface === "reader") await expect(page.locator("[data-reader]")).toBeVisible();
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        const state = await getExhibitThemeFacts(page);
        facts[viewport.width][surface][theme] = state;
        expect(state.overflow.pageScrollWidth).toBeLessThanOrEqual(state.overflow.pageClientWidth);
        if (surface === "reader") {
          expect(state.overflow.dialogScrollWidth).toBeLessThanOrEqual(state.overflow.dialogClientWidth);
        }
        await context.close();
      }

      const { dark, light } = facts[viewport.width][surface];
      expect(light.styles.codeSurface).not.toBe("rgb(11, 18, 32)");
      expect(light.styles.diagramSurface).not.toBe("rgb(17, 24, 39)");
      expect(light.styles.codeSurface).not.toBe(dark.styles.codeSurface);
      expect(light.styles.diagramSurface).not.toBe(dark.styles.diagramSurface);
      expect(light.styles.codeSurface).toBe(light.tokens.codeSurface);
      expect(light.styles.diagramSurface).toBe(light.tokens.diagramSurface);

      for (const state of [dark, light]) {
        for (const [name, contrast] of Object.entries(state.contrast)) {
          const threshold = /Border|connector/.test(name) ? 3 : 4.5;
          expect(contrast, `${viewport.width}px ${surface} ${state.theme} ${name}`).toBeGreaterThanOrEqual(
            threshold,
          );
        }
        expect(state.styles.svgNodeFill).toBe(state.variables["--bg"]);
        expect(state.styles.svgNodeStroke).toBe(state.variables["--ab4"]);
        expect(state.styles.svgPrimaryText).toBe(state.variables["--w88"]);
        expect(state.styles.svgSecondaryText).toBe(state.variables["--w45"]);
        expect(state.styles.svgEmphasisText).toBe(state.variables["--w7"]);
        expect(state.styles.svgConnector).toBe(state.variables["--w42"]);
        expect(state.styles.svgMarker).toBe(state.variables["--w5"]);
      }
    }
  }
});

test("forced colors uses a solid system focus outline", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto("/");
  await page.keyboard.press("Tab");
  const forcedFocus = await page.locator(":focus-visible").evaluate((element) => {
    const style = getComputedStyle(element);
    const usesHighlight = [...document.styleSheets].some((sheet) =>
      [...sheet.cssRules].some((rule) =>
        rule.conditionText === "(forced-colors: active)" && /outline-color:\s*highlight/i.test(rule.cssText),
      ),
    );
    return {
      boxShadow: style.boxShadow,
      outlineStyle: style.outlineStyle,
      outlineWidth: parseFloat(style.outlineWidth),
      usesHighlight,
    };
  });
  expect(forcedFocus).toEqual({
    boxShadow: "none",
    outlineStyle: "solid",
    outlineWidth: 3,
    usesHighlight: true,
  });
});

test("reduced motion disables smooth scrolling and truncates motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const motion = await page.evaluate(() => {
    const seconds = (value) => Math.max(...value.split(",").map((part) => parseFloat(part) || 0));
    const card = getComputedStyle(document.querySelector(".case-card"));
    return {
      animation: seconds(card.animationDuration),
      scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
      transition: seconds(card.transitionDuration),
    };
  });
  expect(motion.scrollBehavior).toBe("auto");
  expect(motion.animation).toBeLessThanOrEqual(0.00001);
  expect(motion.transition).toBeLessThanOrEqual(0.00001);
});
