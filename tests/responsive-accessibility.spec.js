import { expect, test } from "@playwright/test";

const VIEWPORTS = [
  { width: 320, height: 568 },
  { width: 375, height: 667 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1280, height: 900 },
  { width: 1440, height: 900 },
];
const ACCEPTANCE_WIDTHS = [320, 375, 768, 1280, 1440];
const APPROVE_STUDY_PATH = "/case-studies/02-approve-the-audited-escape-hatch/";
const STUDY_PATH = "/case-studies/14-environments-you-can-create-and-destroy-with-one-command/";
const THEME_STUDY_PATH =
  "/case-studies/21-customer-code-running-safely-self-service-cloud-functions/";
const DIAGRAM_STUDIES = [
  {
    number: "12",
    path: "/case-studies/12-the-fleet-that-patches-itself/",
    variables: [
      ["--ab4", "--bg", "--w42", "--w45", "--w5", "--w88"],
      ["--ab4", "--bg", "--w42", "--w45", "--w5", "--w55", "--w7", "--w88"],
    ],
  },
  {
    number: "21",
    path: THEME_STUDY_PATH,
    variables: [["--ab4", "--bg", "--w42", "--w45", "--w5", "--w7", "--w88"]],
  },
  {
    number: "23",
    path: "/case-studies/23-a-codebase-whose-newest-users-are-ai-agents/",
    variables: [
      ["--ab4", "--bg", "--ok", "--okb5", "--w42", "--w45", "--w5", "--w55", "--w7", "--w88"],
    ],
  },
];
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

async function adjacentControlFacts(control) {
  return control.evaluate((element) => {
    const style = getComputedStyle(element);
    const title = element.querySelector("[data-reader-case-title], .case-detail-adjacent-title");
    const rect = element.getBoundingClientRect();
    const dialog = element.closest("dialog");
    return {
      geometry: {
        height: rect.height,
        left: rect.left,
        pageClientWidth: document.documentElement.clientWidth,
        pageScrollWidth: document.documentElement.scrollWidth,
        scrollHeight: dialog?.scrollHeight ?? document.documentElement.scrollHeight,
        scrollWidth: dialog?.scrollWidth ?? document.documentElement.scrollWidth,
        top: rect.top,
        width: rect.width,
      },
      interaction: {
        background: style.backgroundColor,
        border: style.borderColor,
        boxShadow: style.boxShadow,
        outlineColor: style.outlineColor,
        outlineStyle: style.outlineStyle,
        outlineWidth: Number.parseFloat(style.outlineWidth),
        text: getComputedStyle(title).color,
        transform: style.transform,
        transitionProperty: style.transitionProperty,
      },
    };
  });
}

async function closeControlFacts(control) {
  return control.evaluate((element) => {
    const style = getComputedStyle(element);
    const icon = element.querySelector("svg");
    const rect = element.getBoundingClientRect();
    return {
      geometry: {
        height: rect.height,
        left: rect.left,
        top: rect.top,
        width: rect.width,
      },
      interaction: {
        background: style.backgroundColor,
        border: style.borderColor,
        boxShadow: style.boxShadow,
        iconColor: icon ? getComputedStyle(icon).color : null,
        outlineColor: style.outlineColor,
        outlineOffset: Number.parseFloat(style.outlineOffset),
        outlineStyle: style.outlineStyle,
        outlineWidth: Number.parseFloat(style.outlineWidth),
        text: style.color,
        transform: style.transform,
        transitionProperty: style.transitionProperty,
      },
    };
  });
}

async function paddedControlScreenshot(page, control, padding = 8) {
  const rect = await control.boundingBox();
  if (!rect) throw new Error("Close control has no bounding box");
  const viewport = page.viewportSize();
  const x = Math.max(0, rect.x - padding);
  const y = Math.max(0, rect.y - padding);
  const right = Math.min(viewport.width, rect.x + rect.width + padding);
  const bottom = Math.min(viewport.height, rect.y + rect.height + padding);
  return page.screenshot({ clip: { x, y, width: right - x, height: bottom - y } });
}

async function screenshotDiffRatio(page, before, after) {
  return page.evaluate(async ({ beforeBase64, afterBase64 }) => {
    const decode = async (base64) => {
      const image = new Image();
      image.src = `data:image/png;base64,${base64}`;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      context.drawImage(image, 0, 0);
      return { data: context.getImageData(0, 0, image.width, image.height).data, width: image.width, height: image.height };
    };
    const first = await decode(beforeBase64);
    const second = await decode(afterBase64);
    if (first.width !== second.width || first.height !== second.height) throw new Error("Screenshot dimensions differ");
    let changed = 0;
    for (let index = 0; index < first.data.length; index += 4) {
      const channelDelta = Math.max(
        Math.abs(first.data[index] - second.data[index]),
        Math.abs(first.data[index + 1] - second.data[index + 1]),
        Math.abs(first.data[index + 2] - second.data[index + 2]),
        Math.abs(first.data[index + 3] - second.data[index + 3]),
      );
      if (channelDelta >= 12) changed += 1;
    }
    return changed / (first.width * first.height);
  }, { beforeBase64: before.toString("base64"), afterBase64: after.toString("base64") });
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

async function inlineCodeFacts(locator) {
  return locator.evaluate((code) => {
    const paragraph = code.closest("p");
    const codeStyle = getComputedStyle(code);
    const paragraphStyle = getComputedStyle(paragraph);
    return {
      code: {
        clientWidth: code.clientWidth,
        display: codeStyle.display,
        lineRects: code.getClientRects().length,
        maxWidth: codeStyle.maxWidth,
        overflowX: codeStyle.overflowX,
        scrollWidth: code.scrollWidth,
        whiteSpace: codeStyle.whiteSpace,
      },
      containerWidth: paragraph.clientWidth,
      paragraph: {
        hyphens: paragraphStyle.hyphens,
        overflowWrap: paragraphStyle.overflowWrap,
        textWrap: paragraphStyle.textWrap,
      },
      page: {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      },
    };
  });
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

async function getSharedDiagramFacts(page) {
  return page.evaluate(() => {
    const parseColor = (value) => {
      const channels = value.match(/[\d.]+/g)?.map(Number);
      if (!channels || channels.length < 3) throw new TypeError(`Unable to parse color: ${value}`);
      return [channels[0], channels[1], channels[2], channels[3] ?? 1];
    };
    const composite = (foreground, background) => [
      ...foreground.slice(0, 3).map(
        (channel, index) => channel * foreground[3] + background[index] * (1 - foreground[3]),
      ),
      1,
    ];
    const luminance = (color) => {
      const linear = color.slice(0, 3).map((channel) => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
    };
    const ratio = (foreground, background) => {
      const first = luminance(composite(parseColor(foreground), background));
      const second = luminance(background);
      return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
    };
    const resolveVariable = (wrapper, name) => {
      const probe = document.createElement("span");
      probe.style.color = `var(${name})`;
      wrapper.append(probe);
      const value = getComputedStyle(probe).color;
      probe.remove();
      return value;
    };
    const dialog = document.querySelector("[data-reader]");
    const wrappers = [...document.querySelectorAll(".diagram-exhibit")];

    return {
      diagrams: wrappers.flatMap((wrapper, wrapperIndex) => {
        const wrapperStyle = getComputedStyle(wrapper);
        const diagramBackground = parseColor(wrapperStyle.backgroundColor);
        const svgs = [...wrapper.querySelectorAll(":scope > svg")];

        return svgs.map((svg, svgIndex) => {
          const variableElements = [...svg.querySelectorAll("[fill*='var(--'], [stroke*='var(--']")];
          const usedVariables = [...new Set(variableElements.flatMap((element) =>
            [element.getAttribute("fill"), element.getAttribute("stroke")]
              .filter(Boolean)
              .map((value) => value.match(/var\((--[\w-]+)/)?.[1])
              .filter(Boolean),
          ))].sort();
          const variables = Object.fromEntries(usedVariables.map((name) => [
            name,
            {
              raw: wrapperStyle.getPropertyValue(name).trim(),
              resolved: resolveVariable(wrapper, name),
            },
          ]));
          const nodeBackground = parseColor(variables["--bg"]?.resolved || wrapperStyle.backgroundColor);
          const checks = [];

          for (const element of variableElements) {
            const tag = element.tagName.toLowerCase();
            for (const attribute of ["fill", "stroke"]) {
              const authored = element.getAttribute(attribute);
              const variable = authored?.match(/var\((--[\w-]+)/)?.[1];
              if (!variable) continue;
              const style = getComputedStyle(element);
              const color = style[attribute];

              if (tag === "text" && attribute === "fill") {
                checks.push({
                  color,
                  contrast: Math.min(ratio(color, diagramBackground), ratio(color, nodeBackground)),
                  label: element.textContent.trim(),
                  role: "text",
                  threshold: 4.5,
                  variable,
                });
              } else if (attribute === "stroke" && parseFloat(style.strokeWidth) > 0) {
                const background = tag === "rect" ? parseColor(style.fill) : diagramBackground;
                checks.push({
                  color,
                  contrast: ratio(color, background),
                  label: tag,
                  role: "boundary",
                  threshold: 3,
                  variable,
                });
              } else if (attribute === "fill" && element.closest("marker")) {
                checks.push({
                  color,
                  contrast: ratio(color, diagramBackground),
                  label: "marker",
                  role: "marker",
                  threshold: 3,
                  variable,
                });
              }
            }
          }

          const svgRect = svg.getBoundingClientRect();
          const viewBoxWidth = svg.viewBox.baseVal.width;
          const scale = svgRect.width / viewBoxWidth;
          const fontSizes = [...svg.querySelectorAll("text")].map((element) =>
            parseFloat(element.getAttribute("font-size")),
          );
          const textHeights = [...svg.querySelectorAll("text")].map(
            (element) => element.getBoundingClientRect().height,
          );
          const strokeWidths = [...svg.querySelectorAll("[stroke*='var(--']")].map((element) =>
            parseFloat(element.getAttribute("stroke-width")),
          );

          return {
            checks,
            geometry: {
              minimumConnectorWidth: Math.min(...strokeWidths) * scale,
              minimumFontSize: Math.min(...fontSizes) * scale,
              minimumTextHeight: Math.min(...textHeights),
              svgHeight: svgRect.height,
              svgWidth: svgRect.width,
              viewBoxWidth,
            },
            svgIndex,
            usedVariables,
            variables,
            wrapperIndex,
          };
        });
      }),
      overflow: {
        dialogClientWidth: dialog?.clientWidth ?? null,
        dialogScrollWidth: dialog?.scrollWidth ?? null,
        pageClientWidth: document.documentElement.clientWidth,
        pageScrollWidth: document.documentElement.scrollWidth,
        wrappers: wrappers.map((wrapper) => {
          const style = getComputedStyle(wrapper);
          return {
            clientWidth: wrapper.clientWidth,
            overflowX: style.overflowX,
            scrollWidth: wrapper.scrollWidth,
            touchAction: style.touchAction,
          };
        }),
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

test("Task 6 arc labels use the exact dense geometry at every acceptance width", async ({ page }) => {
  for (const width of ACCEPTANCE_WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const facts = await page.locator(".arc-links").first().evaluate((links) => {
      const link = links.querySelector("a");
      const linksStyle = getComputedStyle(links);
      const linkStyle = getComputedStyle(link);
      const rect = link.getBoundingClientRect();
      return {
        columnGap: linksStyle.columnGap,
        fontFamily: linkStyle.fontFamily,
        fontSize: linkStyle.fontSize,
        height: rect.height,
        lineHeight: parseFloat(linkStyle.lineHeight),
        paddingLeft: linkStyle.paddingLeft,
        paddingRight: linkStyle.paddingRight,
        rowGap: linksStyle.rowGap,
      };
    });

    expect(facts, `${width}px arc geometry`).toMatchObject({
      columnGap: "6px",
      fontSize: "11.5px",
      paddingLeft: "10px",
      paddingRight: "10px",
      rowGap: "6px",
    });
    expect(facts.fontFamily).toContain("IBM Plex Mono");
    expect(facts.lineHeight).toBeGreaterThanOrEqual(16);
    expect(facts.height).toBeGreaterThanOrEqual(40);
    await expectNoOverflow(page);
  }
});

test("Task 6 prose and approve commands wrap editorially without escaping their local box", async ({ page }) => {
  for (const width of ACCEPTANCE_WIDTHS) {
    await page.setViewportSize({ width, height: 900 });

    for (const surface of ["standalone", "reader"]) {
      await page.goto(surface === "standalone" ? APPROVE_STUDY_PATH : "/#study-2", {
        waitUntil: "networkidle",
      });
      if (surface === "reader") await expect(page.locator("[data-reader]")).toBeVisible();
      const root = page.locator(surface === "standalone" ? ".case-detail-prose" : ".reader-prose");
      const command = root.locator("code").filter({ hasText: '/approve reason="emergency: prod fix"' });
      const facts = await inlineCodeFacts(command);

      expect(facts.paragraph, `${width}px ${surface} prose wrapping`).toEqual({
        hyphens: "none",
        overflowWrap: "break-word",
        textWrap: "pretty",
      });
      expect(facts.code, `${width}px ${surface} inline code`).toMatchObject({
        display: "inline-block",
        lineRects: 1,
        maxWidth: "100%",
        overflowX: "auto",
        whiteSpace: "nowrap",
      });
      expect(facts.code.clientWidth).toBeLessThanOrEqual(facts.containerWidth + 0.01);
      if (facts.code.scrollWidth > facts.code.clientWidth) {
        expect(facts.code.scrollWidth).toBeGreaterThan(facts.containerWidth);
      }
      expect(facts.page.scrollWidth).toBeLessThanOrEqual(facts.page.clientWidth);
    }
  }
});

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

test("Task 6 adjacent cards expose perceptible hover without moving and keep stronger focus", async ({
  browser,
}) => {
  test.setTimeout(120_000);

  for (const theme of ["dark", "light"]) {
    for (const surface of ["reader", "standalone"]) {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      await context.addInitScript((selectedTheme) => localStorage.setItem("om-theme", selectedTheme), theme);
      const page = await context.newPage();
      await page.goto(
        surface === "reader" ? "/#study-12" : "/case-studies/12-the-fleet-that-patches-itself/",
        { waitUntil: "networkidle" },
      );
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      if (surface === "reader") await expect(page.locator("[data-reader]")).toBeVisible();

      const control = page.locator(
        surface === "reader"
          ? '[data-reader-direction="next"]'
          : '.case-detail-adjacent [data-study-direction="next"]',
      );
      await control.scrollIntoViewIfNeeded();
      await page.mouse.move(0, 0);
      const resting = await adjacentControlFacts(control);

      await control.hover();
      expect(await control.evaluate((element) => element.matches(":hover"))).toBe(true);
      await control.evaluate((element) => Promise.all(element.getAnimations().map((animation) => animation.finished)));
      const hovered = await adjacentControlFacts(control);
      const deltas = ["border", "background", "text", "boxShadow"].filter(
        (property) => resting.interaction[property] !== hovered.interaction[property],
      );
      expect(
        deltas.length,
        `${surface} ${theme} hover must visibly change at least two painted properties: ` +
          JSON.stringify({ resting: resting.interaction, hovered: hovered.interaction }),
      ).toBeGreaterThanOrEqual(2);
      expect(hovered.geometry).toEqual(resting.geometry);
      expect(hovered.interaction.transform).toBe("none");
      expect(hovered.interaction.transitionProperty).not.toContain("transform");

      await page.mouse.move(0, 0);
      await control.focus();
      await expect(control).toBeFocused();
      await control.evaluate((element) => Promise.all(element.getAnimations().map((animation) => animation.finished)));
      const focused = await adjacentControlFacts(control);
      expect(focused.geometry).toEqual(resting.geometry);
      expect(focused.interaction.outlineStyle).toBe("solid");
      expect(focused.interaction.outlineWidth).toBeGreaterThanOrEqual(3);
      expect(focused.interaction.outlineColor).not.toBe(hovered.interaction.outlineColor);
      expect(focused.interaction.transform).toBe("none");
      await context.close();
    }
  }
});

test("Task 6 reader Close hover is perceptible without moving and focus remains stronger", async ({ browser }) => {
  test.setTimeout(120_000);

  for (const viewport of [{ width: 375, height: 900 }, { width: 1280, height: 900 }]) {
    for (const theme of ["dark", "light"]) {
      const context = await browser.newContext({ viewport });
      await context.addInitScript((selectedTheme) => localStorage.setItem("om-theme", selectedTheme), theme);
      const page = await context.newPage();
      await page.goto("/#study-12", { waitUntil: "networkidle" });
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await expect(page.locator("[data-reader]")).toBeVisible();
      const control = page.locator("[data-reader-close]");
      await page.mouse.move(0, 0);
      const resting = await closeControlFacts(control);
      const restingCrop = await paddedControlScreenshot(page, control);

      await control.hover();
      expect(await control.evaluate((element) => element.matches(":hover"))).toBe(true);
      await control.evaluate((element) => Promise.all(element.getAnimations().map((animation) => animation.finished)));
      const hovered = await closeControlFacts(control);
      const hoveredCrop = await paddedControlScreenshot(page, control);
      const hoverDiffRatio = await screenshotDiffRatio(page, restingCrop, hoveredCrop);
      const deltas = ["border", "background", "text", "boxShadow"].filter(
        (property) => resting.interaction[property] !== hovered.interaction[property],
      );
      expect(
        deltas.length,
        `${viewport.width}px ${theme} Close hover needs at least two painted deltas: ` +
          JSON.stringify({ resting: resting.interaction, hovered: hovered.interaction, hoverDiffRatio }),
      ).toBeGreaterThanOrEqual(2);
      expect(
        hovered.interaction.background,
        `${viewport.width}px ${theme} Close hover must tint its fill: ` +
          JSON.stringify({ resting: resting.interaction, hovered: hovered.interaction, hoverDiffRatio }),
      ).not.toBe(resting.interaction.background);
      expect(hoverDiffRatio, `${viewport.width}px ${theme} Close hover crop is not perceptibly different`).toBeGreaterThanOrEqual(0.2);
      expect(hovered.geometry).toEqual(resting.geometry);
      expect(resting.geometry.width).toBe(44);
      expect(resting.geometry.height).toBe(44);
      expect(hovered.interaction.transform).toBe(resting.interaction.transform);
      expect(hovered.interaction.transitionProperty).not.toContain("transform");

      await page.mouse.move(0, 0);
      await control.focus();
      await expect(control).toBeFocused();
      await control.evaluate((element) => Promise.all(element.getAnimations().map((animation) => animation.finished)));
      const focused = await closeControlFacts(control);
      const focusedCrop = await paddedControlScreenshot(page, control);
      const focusDiffRatio = await screenshotDiffRatio(page, restingCrop, focusedCrop);
      const hoverFocusDiffRatio = await screenshotDiffRatio(page, hoveredCrop, focusedCrop);
      expect(focused.geometry).toEqual(resting.geometry);
      expect(focused.interaction.outlineStyle).toBe("solid");
      expect(focused.interaction.outlineWidth).toBeGreaterThanOrEqual(3);
      expect(focused.interaction.outlineOffset).toBeGreaterThanOrEqual(3);
      expect(focusDiffRatio).toBeGreaterThanOrEqual(0.15);
      expect(hoverFocusDiffRatio).toBeGreaterThanOrEqual(0.1);
      expect(focused.interaction.outlineColor).not.toBe(hovered.interaction.outlineColor);
      expect(focused.interaction.transform).toBe(resting.interaction.transform);
      await context.close();
    }
  }
});

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

test("shared inline diagram variables meet contrast across themes and surfaces", async ({ browser }) => {
  const failures = [];

  for (const study of DIAGRAM_STUDIES) {
    for (const surface of ["standalone", "reader"]) {
      for (const theme of ["dark", "light"]) {
        const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
        await context.addInitScript((selectedTheme) => localStorage.setItem("om-theme", selectedTheme), theme);
        const page = await context.newPage();
        await page.goto(surface === "standalone" ? study.path : `/#study-${study.number}`, {
          waitUntil: "networkidle",
        });
        if (surface === "reader") await expect(page.locator("[data-reader]")).toBeVisible();
        const facts = await getSharedDiagramFacts(page);
        const state = `study ${study.number} ${surface} ${theme}`;

        if (facts.diagrams.length !== study.variables.length) {
          failures.push(`${state}: expected ${study.variables.length} SVGs, found ${facts.diagrams.length}`);
        }
        for (const [index, diagram] of facts.diagrams.entries()) {
          const expectedVariables = study.variables[index] ?? [];
          if (JSON.stringify(diagram.usedVariables) !== JSON.stringify(expectedVariables)) {
            failures.push(
              `${state} SVG ${index}: variables ${diagram.usedVariables.join(",")} != ${expectedVariables.join(",")}`,
            );
          }
          for (const [name, variable] of Object.entries(diagram.variables)) {
            if (!variable.raw) failures.push(`${state} SVG ${index}: ${name} is undefined`);
            if (!/^rgba?\(/.test(variable.resolved)) {
              failures.push(`${state} SVG ${index}: ${name} did not resolve (${variable.resolved})`);
            }
          }
          for (const check of diagram.checks) {
            if (check.contrast < check.threshold) {
              failures.push(
                `${state} SVG ${index}: ${check.variable} ${check.role} ${check.label} ` +
                  `${check.contrast.toFixed(4)} < ${check.threshold}`,
              );
            }
          }
        }
        if (facts.overflow.pageScrollWidth > facts.overflow.pageClientWidth) {
          failures.push(`${state}: page overflow ${facts.overflow.pageScrollWidth}/${facts.overflow.pageClientWidth}`);
        }
        if (
          surface === "reader" &&
          facts.overflow.dialogScrollWidth > facts.overflow.dialogClientWidth
        ) {
          failures.push(
            `${state}: dialog overflow ${facts.overflow.dialogScrollWidth}/${facts.overflow.dialogClientWidth}`,
          );
        }
        await context.close();
      }
    }
  }

  expect(failures).toEqual([]);
});

test("mobile inline diagrams remain readable through local scrolling", async ({ browser }) => {
  test.setTimeout(120_000);
  const failures = [];

  for (const viewport of [{ width: 375, height: 900 }, { width: 1440, height: 900 }]) {
    for (const study of DIAGRAM_STUDIES) {
      for (const surface of ["standalone", "reader"]) {
        const context = await browser.newContext({ hasTouch: viewport.width === 375, viewport });
        await context.addInitScript(() => localStorage.setItem("om-theme", "dark"));
        const page = await context.newPage();
        await page.goto(surface === "standalone" ? study.path : `/#study-${study.number}`, {
          waitUntil: "domcontentloaded",
        });
        if (surface === "reader") await expect(page.locator("[data-reader]")).toBeVisible();
        const facts = await getSharedDiagramFacts(page);
        const state = `study ${study.number} ${surface} ${viewport.width}px`;

        if (facts.overflow.pageScrollWidth > facts.overflow.pageClientWidth) {
          failures.push(`${state}: page overflow ${facts.overflow.pageScrollWidth}/${facts.overflow.pageClientWidth}`);
        }
        if (
          surface === "reader" &&
          facts.overflow.dialogScrollWidth > facts.overflow.dialogClientWidth
        ) {
          failures.push(
            `${state}: dialog overflow ${facts.overflow.dialogScrollWidth}/${facts.overflow.dialogClientWidth}`,
          );
        }

        for (const diagram of facts.diagrams) {
          const geometry = diagram.geometry;
          if (viewport.width === 375) {
            if (geometry.minimumFontSize < 9.5) {
              failures.push(`${state} SVG ${diagram.svgIndex}: font ${geometry.minimumFontSize.toFixed(2)}px`);
            }
            if (geometry.minimumTextHeight < 8) {
              failures.push(`${state} SVG ${diagram.svgIndex}: text ${geometry.minimumTextHeight.toFixed(2)}px high`);
            }
            if (geometry.minimumConnectorWidth < 0.95) {
              failures.push(
                `${state} SVG ${diagram.svgIndex}: connector ${geometry.minimumConnectorWidth.toFixed(2)}px`,
              );
            }
          } else if (geometry.svgWidth > geometry.viewBoxWidth + 0.01) {
            failures.push(`${state} SVG ${diagram.svgIndex}: desktop width grew to ${geometry.svgWidth}px`);
          }
        }

        for (const [index, overflow] of facts.overflow.wrappers.entries()) {
          if (viewport.width === 375) {
            const locallyScrollable = overflow.overflowX === "auto" && overflow.scrollWidth > overflow.clientWidth;
            if (!locallyScrollable) {
              failures.push(
                `${state} exhibit ${index}: no local scroll ${overflow.scrollWidth}/${overflow.clientWidth}`,
              );
            }
            if (overflow.touchAction === "none") failures.push(`${state} exhibit ${index}: touch disabled`);
            if (locallyScrollable) {
              const wrapper = page.locator(".diagram-exhibit").nth(index);
              const keyboardFocused = await wrapper.evaluate((element) => {
                element.scrollLeft = 0;
                element.focus();
                return document.activeElement === element;
              });
              const keyboardScrollLeft = await wrapper.evaluate((element) => {
                element.scrollLeft = 100;
                return element.scrollLeft;
              });
              if (!keyboardFocused || keyboardScrollLeft <= 0) {
                failures.push(
                  `${state} exhibit ${index}: focusable local scroll unavailable ` +
                    `(focused=${keyboardFocused}, scrollLeft=${keyboardScrollLeft})`,
                );
              }
            }
          } else if (overflow.scrollWidth > overflow.clientWidth) {
            failures.push(`${state} exhibit ${index}: desktop forced scroll ${overflow.scrollWidth}/${overflow.clientWidth}`);
          }
        }
        await context.close();
      }
    }
  }

  expect(failures).toEqual([]);
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
