import { execFile } from "node:child_process";
import { cp, copyFile, mkdtemp, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { expect, test } from "@playwright/test";

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const runFile = promisify(execFile);
const VIDEO_EXHIBITS = [
  {
    route: "/case-studies/03-buttons-instead-of-incantations/",
    source: "./atlantis-pr-buttons-demo.mp4",
    poster: "./atlantis-pr-buttons-demo-poster.png",
    width: 880,
    height: 588,
  },
  {
    route: "/case-studies/07-turning-a-terraform-repository-into-a-product/",
    source: "./terramate-stacks-explorer.mp4",
    poster: "./terramate-stacks-explorer-poster.png",
    width: 1440,
    height: 820,
  },
];
const TEXT_EXTENSIONS = new Set([".css", ".html", ".js", ".json", ".md", ".njk", ".txt", ".xml"]);

async function listFiles(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(root, entry.name);
      return entry.isDirectory() ? listFiles(path) : [path];
    }),
  );
  return nested.flat();
}

test("standalone recordings expose controlled poster-backed video", async ({ page, request }) => {
  // Given the two authored standalone motion exhibits
  let renderedVideos = 0;

  for (const expected of VIDEO_EXHIBITS) {
    // When each canonical study loads and its video metadata is available
    const response = await page.goto(expected.route);
    expect(response?.status()).toBe(200);
    const video = page.locator("video");
    await expect(video).toHaveCount(1);
    renderedVideos += await video.count();
    await expect.poll(() => video.evaluate((element) => element.readyState)).toBeGreaterThan(0);

    // Then the renderer exposes the accessible, non-autoplay contract and intrinsic shape
    const initial = await video.evaluate((element) => ({
      autoplay: element.autoplay,
      controls: element.controls,
      currentTime: element.currentTime,
      height: element.getAttribute("height"),
      loop: element.loop,
      muted: element.muted,
      paused: element.paused,
      playsInline: element.playsInline,
      poster: element.getAttribute("poster"),
      preload: element.preload,
      source: element.getAttribute("src"),
      videoHeight: element.videoHeight,
      videoWidth: element.videoWidth,
      width: element.getAttribute("width"),
    }));
    expect(initial).toEqual({
      autoplay: false,
      controls: true,
      currentTime: 0,
      height: String(expected.height),
      loop: false,
      muted: false,
      paused: true,
      playsInline: true,
      poster: expected.poster,
      preload: "metadata",
      source: expected.source,
      videoHeight: expected.height,
      videoWidth: expected.width,
      width: String(expected.width),
    });

    const sourceResponse = await request.get(new URL(expected.source, page.url()).href);
    const posterResponse = await request.get(new URL(expected.poster, page.url()).href);
    expect(sourceResponse.ok()).toBe(true);
    expect(posterResponse.ok()).toBe(true);

    // When playback is started, paused, and seeked through the native media API
    await video.evaluate((element) => element.play());
    await expect.poll(() => video.evaluate((element) => element.currentTime)).toBeGreaterThan(0);
    await video.evaluate(
      (element) =>
        new Promise((resolveSeek) => {
          element.pause();
          element.addEventListener("seeked", resolveSeek, { once: true });
          element.currentTime = Math.min(1, element.duration / 2);
        }),
    );

    // Then user-controlled playback remains paused at the requested position
    const settled = await video.evaluate((element) => ({
      currentTime: element.currentTime,
      paused: element.paused,
    }));
    expect(settled.paused).toBe(true);
    expect(settled.currentTime).toBeGreaterThan(0);
  }

  expect(renderedVideos).toBe(2);
});

test("reduced motion never starts either recording", async ({ browser }) => {
  // Given a browser context that requests reduced motion
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();

  try {
    for (const expected of VIDEO_EXHIBITS) {
      // When the study remains idle after metadata loads
      await page.goto(expected.route);
      const video = page.locator("video");
      await expect.poll(() => video.evaluate((element) => element.readyState)).toBeGreaterThan(0);
      await page.waitForTimeout(700);

      // Then no hidden playback has started
      expect(
        await video.evaluate((element) => ({
          currentTime: element.currentTime,
          paused: element.paused,
        })),
      ).toEqual({ currentTime: 0, paused: true });
    }
  } finally {
    await context.close();
  }
});

test("Task 6 contains Study 03 reader media while preserving the standalone breakout", async ({ page }) => {
  for (const width of [320, 375, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(VIDEO_EXHIBITS[0].route, { waitUntil: "networkidle" });
    const standalone = await page.evaluate(() => {
      const prose = document.querySelector(".case-detail-prose").getBoundingClientRect();
      return [...document.querySelectorAll(".case-detail-prose .media-exhibit")].map((element) => ({
        left: getComputedStyle(element).left,
        maxWidth: getComputedStyle(element).maxWidth,
        proseWidth: prose.width,
        transform: getComputedStyle(element).transform,
        width: element.getBoundingClientRect().width,
      }));
    });
    await page.goto("/#study-3", { waitUntil: "networkidle" });
    await expect(page.locator("[data-reader]")).toBeVisible();
    const readerMedia = await page.evaluate(() => {
      const prose = document.querySelector(".reader-prose").getBoundingClientRect();
      return [...document.querySelectorAll(".reader-prose .media-exhibit")].map((element) => ({
        left: getComputedStyle(element).left,
        maxWidth: getComputedStyle(element).maxWidth,
        proseWidth: prose.width,
        transform: getComputedStyle(element).transform,
        width: element.getBoundingClientRect().width,
      }));
    });

    expect(readerMedia).toHaveLength(2);
    expect(standalone).toHaveLength(2);
    for (const media of readerMedia) {
      expect(media.left).toBe("0px");
      expect(media.maxWidth).toBe("100%");
      expect(media.transform).toBe("none");
      expect(media.width).toBeLessThanOrEqual(media.proseWidth + 0.01);
    }
    for (const media of standalone) {
      expect(media.left).not.toBe("auto");
      expect(media.maxWidth).toBe("none");
      if (width >= 1280) expect(media.width).toBeGreaterThan(media.proseWidth);
    }
  }
});

test("generated output contains exactly two videos and no GIF delivery", async () => {
  // Given the authored src tree and the freshly built site output
  const roots = [join(PROJECT_ROOT, "src"), join(PROJECT_ROOT, "_site")];
  const files = (await Promise.all(roots.map(listFiles))).flat();

  // When filenames and text-bearing source/output files are inspected
  const gifFiles = files.filter((path) => extname(path).toLowerCase() === ".gif");
  const gifReferences = [];
  let generatedVideoCount = 0;
  for (const path of files.filter((file) => TEXT_EXTENSIONS.has(extname(file).toLowerCase()))) {
    const content = await readFile(path, "utf8");
    if (/\.gif\b/i.test(content)) {
      gifReferences.push(relative(PROJECT_ROOT, path));
    }
    if (path.startsWith(join(PROJECT_ROOT, "_site")) && extname(path) === ".html") {
      generatedVideoCount += content.match(/<video\b/g)?.length ?? 0;
    }
  }

  // Then neither the Eleventy input nor generated site delivers GIF media
  expect(generatedVideoCount).toBe(2);
  expect(gifFiles).toEqual([]);
  expect(gifReferences).toEqual([]);
});

test("an MP4 without a poster fails at the shortcode boundary", async () => {
  // Given an external copy of the real Eleventy input with one poster omitted
  const fixtureRoot = await mkdtemp(join(tmpdir(), "portfolio-media-missing-poster-"));
  const studyPath = join(
    fixtureRoot,
    "src/content/case-studies/03-buttons-instead-of-incantations/index.md",
  );

  try {
    await cp(join(PROJECT_ROOT, "src"), join(fixtureRoot, "src"), { recursive: true });
    await cp(join(PROJECT_ROOT, "assets"), join(fixtureRoot, "assets"), { recursive: true });
    await copyFile(join(PROJECT_ROOT, ".eleventy.js"), join(fixtureRoot, ".eleventy.js"));
    await copyFile(join(PROJECT_ROOT, "package.json"), join(fixtureRoot, "package.json"));
    await symlink(join(PROJECT_ROOT, "node_modules"), join(fixtureRoot, "node_modules"), "dir");

    const authoredStudy = await readFile(studyPath, "utf8");
    const missingPosterStudy = authoredStudy.replace(
      ' poster: "./atlantis-pr-buttons-demo-poster.png",',
      "",
    );
    expect(missingPosterStudy).not.toBe(authoredStudy);
    await writeFile(studyPath, missingPosterStudy);

    // When Eleventy builds that isolated fixture
    let failure;
    try {
      await runFile(process.execPath, [join(PROJECT_ROOT, "node_modules/@11ty/eleventy/cmd.cjs")], {
        cwd: fixtureRoot,
      });
    } catch (error) {
      failure = error;
    }

    // Then the precise shortcode validation error rejects the build
    expect(failure).toBeDefined();
    expect(`${failure.stdout}\n${failure.stderr}`).toContain(
      "mediaExhibit: poster must be a non-empty string for MP4 sources",
    );
  } finally {
    await rm(fixtureRoot, { recursive: true, force: true });
  }
});
