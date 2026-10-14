/* Capture thesis appendix screenshots of the HACO Benchmark app.
   Reuses the launch recipe and data-testid selectors from e2e-smoke.mjs.

   Reference layout: HYDE Appendix D, whose figures are all full-window
   1920x1080 captures. Zoom is drawn inside the PNG by
   annotate_appendix_figures.py, never by Word-level cropping, so every base
   capture here is a full 1920x1080 frame at deviceScaleFactor 1. That is
   320 DPI at the 6in appendix column width.

   Several appendix figures share one page state (HYDE does the same: its
   42 figures come from far fewer distinct screens), so a base shot is taken
   once per state and mark() records any number of callout sets against it.

   Three correctness notes:
   1. runStore defaults engine="python", but outside the Tauri shell the
      python branch is guarded by isTauri() and silently falls through to
      the TypeScript engine. The header badge would therefore read
      "Python / NumPy PCG64" while Mulberry32 actually ran. We select the
      TypeScript engine explicitly and assert the badge, so the screenshots
      state the engine truthfully.
   2. Navigating away from a completed run takes several seconds to render
      (aggregateRun over 3 trials x 3 algos x T_max frames), so nav() polls
      for the destination heading instead of sleeping a fixed interval.
   3. mark() must resolve its regions against the frame that was just
      captured, so every mark() call sits immediately after its snap().

   Output: projects/image/haco-benchmark-NN-<slug>.png plus annotations.json,
   which annotate_appendix_figures.py consumes. */
import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.APP_URL || "http://localhost:1420";
const OUT = process.env.SHOT_DIR || "/home/joshua_bermas/projects/image";
const INSTANCE = process.env.INSTANCE || "eil76";
const TRIALS = process.env.TRIALS || "2";
const TMAX = process.env.TMAX || "500";

const VW = 1920;
const VH = 1080;

fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: "new",
  protocolTimeout: 900000,
  args: [
    "--no-sandbox",
    "--disable-gpu-sandbox",
    "--use-gl=swiftshader",
    "--enable-unsafe-swiftshader",
    `--window-size=${VW},${VH}`,
    "--force-device-scale-factor=1",
    "--hide-scrollbars",
  ],
});

const page = await browser.newPage();
await page.setViewport({ width: VW, height: VH, deviceScaleFactor: 1 });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Resolve one callout region to an absolute CSS-pixel rect.
 *
 * Spec forms:
 *   {sel, up}      querySelector, then walk up `up` ancestors
 *   {head, up}     the <h3> CardTitle with this exact text, then walk up
 *   {txt, up}      innermost element whose text starts with this, then walk up
 *   {cls, up}      first element whose className contains this substring
 *   {union: [...]} bounding box of several resolved regions combined
 *   {all}          resolve a selector to every match and take their union
 *   {pad}          outset applied to the final rect
 *   {inset}        also request a magnified inset of this region
 */
async function resolveRegion(spec) {
  // Resolve one {sel|head|txt|cls, up, all} spec to absolute CSS-pixel rect(s).
  const single = async (s) =>
    page.evaluate(
      (kind, value, up, wantAll) => {
        let found = [];
        if (kind === "sel") {
          found = wantAll ? [...document.querySelectorAll(value)] : [document.querySelector(value)].filter(Boolean);
        } else if (kind === "head") {
          const h = [...document.querySelectorAll("h3")].find((e) => e.textContent.trim() === value);
          found = h ? [h] : [];
        } else if (kind === "cls") {
          found = [...document.querySelectorAll("*")].filter((e) =>
            typeof e.className === "string" && e.className.includes(value)
          ).slice(0, 1);
        } else {
          const all = [...document.querySelectorAll("*")];
          const leaf = all.find((e) => e.children.length === 0 && (e.textContent || "").trim().startsWith(value));
          found = [leaf ?? all.find((e) => (e.textContent || "").trim().startsWith(value))].filter(Boolean);
        }
        const rects = [];
        for (const el0 of found) {
          let el = el0;
          for (let i = 0; i < up; i++) {
            el = el.parentElement;
            if (!el) break;
          }
          if (!el) continue;
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) rects.push({ x: r.x, y: r.y, width: r.width, height: r.height });
        }
        return rects;
      },
      s.sel ? "sel" : s.head ? "head" : s.cls ? "cls" : "txt",
      s.sel ?? s.head ?? s.cls ?? s.txt,
      s.up ?? 0,
      Boolean(s.all)
    );

  const parts = spec.union ? await Promise.all(spec.union.map((s) => single(s))) : [await single(spec)];
  const ok = parts.flat().filter(Boolean);
  if (!ok.length) return null;

  let rect;
  if (spec.union || spec.all) {
    const x = Math.min(...ok.map((b) => b.x));
    const y = Math.min(...ok.map((b) => b.y));
    const x2 = Math.max(...ok.map((b) => b.x + b.width));
    const y2 = Math.max(...ok.map((b) => b.y + b.height));
    rect = { x, y, width: x2 - x, height: y2 - y };
  } else {
    rect = ok[0];
  }
  if (spec.pad) {
    rect = {
      x: rect.x - spec.pad,
      y: rect.y - spec.pad,
      width: rect.width + spec.pad * 2,
      height: rect.height + spec.pad * 2,
    };
  }
  // A code row is laid out at its full unwrapped width and merely clipped by
  // the scrolling panel, so its rect runs past the visible area. Intersecting
  // with the panel keeps both the callout box and any inset on screen.
  if (spec.clipTo) {
    const host = await single(spec.clipTo);
    if (host) {
      const h = host[0];
      const x0 = Math.max(rect.x, h.x);
      const y0 = Math.max(rect.y, h.y);
      const x1 = Math.min(rect.x + rect.width, h.x + h.width);
      const y1 = Math.min(rect.y + rect.height, h.y + h.height);
      if (x1 > x0 && y1 > y0) rect = { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
    }
  }
  return rect;
}

/**
 * Record one callout set against the base shot just captured.
 *
 * `slug` names the appendix figure; several slugs may share one base file.
 * A box with `inset` gets a magnified inset in annotate_appendix_figures.py,
 * zoomed from its own rect (HYDE's idiom for controls too small to read at
 * the 6in column width). The zoom factor is derived there from a target inset
 * height, so a wide panel and a 28px toolbar button both land legible
 * instead of overflowing the frame.
 */
/**
 * How far a resolved rect pokes outside the captured frame. The Run page's
 * chart row ends flush against the window edge (and a few px past it, because
 * h-screen plus min-h on the map overflows by a hair), so a small overflow is
 * clamped rather than treated as an error.
 */
const OVERFLOW_TOL = 24;

function overflowOf(rect) {
  return {
    left: -rect.x,
    top: -rect.y,
    right: rect.x + rect.width - VW,
    bottom: rect.y + rect.height - VH,
  };
}

function worstOverflow(rect) {
  const o = overflowOf(rect);
  return Math.max(o.left, o.top, o.right, o.bottom);
}

/**
 * Resolve one callout region, scrolling it into view if it has fallen outside
 * the captured frame. getBoundingClientRect is viewport-relative, so a region
 * in a scrolled pane would otherwise land off-canvas and silently vanish.
 * Returns null when the region cannot be resolved at all.
 */
async function resolveInFrame(spec) {
  let rect = await resolveRegion(spec);
  if (rect && worstOverflow(rect) <= OVERFLOW_TOL) return rect;
  await page.evaluate(
    (kind, value, up) => {
      let el = null;
      if (kind === "sel") el = document.querySelector(value);
      else if (kind === "head") {
        el = [...document.querySelectorAll("h3")].find((e) => e.textContent.trim() === value) ?? null;
      } else if (kind === "cls") {
        el = [...document.querySelectorAll("*")].find((e) =>
          typeof e.className === "string" && e.className.includes(value)
        ) ?? null;
      } else {
        const all = [...document.querySelectorAll("*")];
        el =
          all.find((e) => e.children.length === 0 && (e.textContent || "").trim().startsWith(value)) ??
          all.find((e) => (e.textContent || "").trim().startsWith(value)) ??
          null;
      }
      for (let i = 0; i < up; i++) {
        el = el?.parentElement ?? null;
      }
      el?.scrollIntoView({ block: "center", inline: "nearest" });
    },
    spec.sel ? "sel" : spec.head ? "head" : spec.cls ? "cls" : "txt",
    spec.sel ?? spec.head ?? spec.cls ?? spec.txt,
    spec.up ?? 0
  );
  await sleep(400);
  return await resolveRegion(spec);
}

/**
 * Capture one base frame and record any number of callout sets against it.
 *
 * Every region is resolved (and scrolled into view if needed) BEFORE the
 * screenshot is taken, so the recorded rects always describe the frame that
 * was actually captured. `groups` is [{slug, specs}].
 */
async function snapFigures(baseSlug, groups) {
  const resolved = [];
  for (const group of groups) {
    const boxes = [];
    for (const spec of group.specs) {
      const rect = await resolveInFrame(spec);
      const over = rect ? worstOverflow(rect) : Infinity;
      if (!rect || over > OVERFLOW_TOL) {
        // The benchmark takes ~10 min to reach these screens, so a region that
        // has gone missing is recorded and reported rather than thrown: one
        // bad selector must not throw away the whole run.
        skipped.push(
          `${group.slug} step ${spec.step} (${rect ? `off-frame by ${over.toFixed(0)}px` : "not found"})`
        );
        console.log(`WARN  ${group.slug} step ${spec.step}: skipped (${skipped.at(-1)})`);
        continue;
      }
      if (over > 0.5) {
        console.log(`       ${group.slug} step ${spec.step}: clamped ${over.toFixed(0)}px at the frame edge`);
      }
      const pad = spec.pad ?? 0;
      const x = Math.max(0, rect.x - pad);
      const y = Math.max(0, rect.y - pad);
      const box = { step: spec.step, x, y, width: rect.width + pad * 2, height: rect.height + pad * 2 };
      // Re-clamp the far edge so the outset never draws the border off-figure.
      box.width = Math.min(box.width, VW - x);
      box.height = Math.min(box.height, VH - y);
      if (spec.inset) box.inset = { target: spec.target ?? 260 };
      boxes.push(box);
    }
    resolved.push({ slug: group.slug, boxes });
  }

  await snap(baseSlug);
  for (const { slug, boxes } of resolved) {
    annotations.push({
      slug,
      file: path.basename(lastShot.file),
      clip: lastShot.clip,
      scale: lastShot.scale,
      boxes,
    });
    const insetSteps = boxes.filter((b) => b.inset).map((b) => b.step);
    console.log(
      `       ${slug}: callouts ${boxes.map((b) => b.step).join(", ")}` +
        (insetSteps.length ? ` | insets ${insetSteps.join(", ")}` : "")
    );
  }
}

/** Wait until Recharts has actually drawn bars, then let the enter animation
 *  finish. Without this a BarChart captured right after a resize shows
 *  zero-height bars and reads as a blank panel. */
async function waitForBars(timeout = 60000) {
  await page.waitForFunction(
    () => {
      const rects = [...document.querySelectorAll(".recharts-rectangle")];
      return rects.filter((r) => parseFloat(r.getAttribute("height") || "0") > 3).length >= 2;
    },
    { timeout, polling: 250 }
  );
  await sleep(2000);
}

const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(String(e)));
page.on("console", (m) => {
  if (m.type() === "error") pageErrors.push("console: " + m.text());
});
const hardErrors = () =>
  pageErrors.filter((e) => !/WebGL|swiftshader|GroupMarkerNotSet|Automatic fallback|willReadFrequently/i.test(e));

let shotNo = 0;
let lastShot = null;
const written = [];
const annotations = [];
const skipped = [];

async function snap(slug) {
  shotNo += 1;
  const file = `${OUT}/haco-benchmark-${String(shotNo).padStart(2, "0")}-${slug}.png`;
  await page.screenshot({ path: file });
  written.push(file);
  lastShot = { file, clip: { x: 0, y: 0, width: VW, height: VH }, scale: 1 };
  console.log(`SHOT ${shotNo}  ${slug}`);
  return file;
}

/** Click a sidebar nav item with a real mouse event, then wait for its heading.
 *  Retries, because a single click occasionally lands while the previous
 *  scale change is still re-laying out the page. */
async function nav(label, expectH1, timeout = 45000) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    const hs = await page.$$("nav a");
    for (const h of hs) {
      if ((await h.evaluate((e) => e.textContent.trim())) === label) {
        await h.click();
        break;
      }
    }
    try {
      await page.waitForFunction(
        (want) => [...document.querySelectorAll("h1")].some((e) => e.textContent.trim() === want),
        { timeout, polling: 300 },
        expectH1
      );
      await sleep(600);
      return;
    } catch {
      const diag = await page.evaluate(() => ({
        url: location.pathname,
        h1: [...document.querySelectorAll("h1")].map((e) => e.textContent.trim()),
      }));
      console.log(`  nav("${label}") attempt ${attempt} did not reach "${expectH1}"; state ${JSON.stringify(diag)}`);
    }
  }
  throw new Error(`nav to "${label}" never rendered "${expectH1}"`);
}

/** Bring every scrollable pane to the top so callout rects land inside the frame. */
async function scrollToTop() {
  await page.evaluate(() => {
    for (const el of document.querySelectorAll("*")) {
      if (el.scrollHeight > el.clientHeight + 4) el.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  });
  await sleep(400);
}

async function setInput(testid, value) {
  await page.evaluate(
    (id, v) => {
      const el = document.querySelector(`[data-testid="${id}"]`);
      if (!el) throw new Error(`input not found: ${id}`);
      const proto = el.tagName === "SELECT" ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, "value").set.call(el, v);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    },
    testid,
    value
  );
}

function frameNo() {
  return page.evaluate(() => {
    const m = document.body.innerText.match(/Iter (\d+)\//);
    return m ? Number(m[1]) : -1;
  });
}

async function waitForFrameAtLeast(frac, timeout = 180000) {
  const target = Math.floor(Number(TMAX) * frac);
  const started = Date.now();
  for (;;) {
    const f = await frameNo();
    if (f >= target) return f;
    if (Date.now() - started > timeout) throw new Error(`frame ${f} never reached ${target}`);
    await sleep(250);
  }
}

try {
  await page.goto(BASE, { waitUntil: "networkidle2", timeout: 60000 });

  const brand = await page.evaluate(() => document.body.innerText.includes("HACO Benchmark"));
  if (!brand) throw new Error('branding "HACO Benchmark" not found in sidebar');
  console.log('branding OK: "HACO Benchmark"');

  /* ---------- BASE 1: Run page, configuration stage ---------- */
  await page.waitForSelector('[data-testid="instance-select"]', { timeout: 20000 });
  await page.waitForSelector('[data-testid="start-btn"]', { timeout: 20000 });

  // Select the TypeScript engine BEFORE the first screenshot, so figure 1 does
  // not show the app's default Python selection while every later figure
  // reports TypeScript / Mulberry32 as the engine that actually ran.
  const buttons = await page.$$("button");
  let picked = false;
  for (const b of buttons) {
    if ((await b.evaluate((e) => e.textContent)).startsWith("TypeScript")) {
      await b.click();
      picked = true;
      break;
    }
  }
  if (!picked) throw new Error("TypeScript engine button not found");
  await sleep(400);

  const PLAYBACK_ROW = { txt: "Playback speed", up: 2, pad: 4 };

  // Appendix D figures 1-5. Numbering restarts per section, as in HYDE.
  await snapFigures("run-config", [
    { slug: "run-sidebar", specs: [
      { step: 1, sel: 'nav[data-testid="sidebar"] ul a', all: true, pad: 6, inset: true },
    ] },
    { slug: "run-instance", specs: [
      { step: 2, head: "Problem Instance", up: 2, pad: 4, inset: true },
    ] },
    { slug: "run-engine", specs: [
      { step: 3, head: "Engine", up: 2, pad: 4, inset: true },
    ] },
    { slug: "run-parameters", specs: [
      { step: 4, head: "Experiment Design", up: 2, pad: 4, inset: true },
      { step: 4, head: "Algorithm Parameters", up: 2, pad: 4 },
    ] },
    { slug: "run-start", specs: [
      // up 2 is the run-summary bar the button sits in; up 3 is the whole
      // configuration column, which says nothing about this callout.
      { step: 5, sel: '[data-testid="start-btn"]', up: 2, pad: 4, inset: true },
    ] },
  ]);

  await setInput("instance-select", INSTANCE);
  await setInput("trials", TRIALS);
  await setInput("tmax", TMAX);
  await setInput("ants", "30");
  await setInput("seed", "0");
  await sleep(400);

  await page.click('[data-testid="start-btn"]');
  await page.waitForSelector('[data-testid="map3d-canvas"] canvas', { timeout: 180000 });

  const engineBadge = await page.evaluate(() =>
    document.body.innerText.match(/(TypeScript \/ Mulberry32|Python \/ NumPy PCG64)/)?.[1] ?? null
  );
  if (engineBadge !== "TypeScript / Mulberry32") {
    throw new Error(`engine badge is "${engineBadge}", expected "TypeScript / Mulberry32"`);
  }
  console.log("engine badge OK:", engineBadge);

  await page.waitForFunction(() => /Iter [1-9]\d*\//.test(document.body.innerText), { timeout: 180000 });
  await waitForFrameAtLeast(0.4);
  await sleep(1200); // let trails and chart series accumulate

  /* ---------- BASE 2: Run page, live ---------- */
  // Appendix D figures 6-9.
  await snapFigures("run-live", [
    { slug: "run-live-panels", specs: [
      { step: 1, head: "Progress", up: 2, pad: 4, inset: true },
      { step: 2, head: "Parameters in effect", up: 2, pad: 4, inset: true },
    ] },
    { slug: "run-live-map", specs: [
      // No inset: the map is the one region already large enough to read.
      { step: 5, sel: '[data-testid="map3d-canvas"]', pad: 0 },
    ] },
    { slug: "run-live-signals", specs: [
      { step: 6, sel: "div:has(> [data-testid='chart-convergence'])", pad: 3, inset: true },
      { step: 7, sel: "div:has(> [data-testid='chart-entropy'])", pad: 3 },
      { step: 8, sel: "div:has(> [data-testid='chart-pdr'])", pad: 3, inset: true },
    ] },
    { slug: "run-live-controls", specs: [
      { step: 3, ...PLAYBACK_ROW, inset: true },
      { step: 4, sel: '[data-testid="algo-tab-0"]', up: 1, pad: 4, inset: true },
    ] },
    { slug: "run-transport", specs: [
      {
        step: 10,
        union: [
          { sel: '[data-testid="pause-btn"]', pad: 4 },
          { sel: '[data-testid="stop-btn"]', pad: 4 },
        ],
        inset: true,
        target: 150,
      },
    ] },
  ]);

  // Wait for completion. new-run-btn only renders when status === "completed";
  // matching the word "completed" would false-positive on the chart caption
  // "mean over N completed trials".
  await page.waitForSelector('[data-testid="new-run-btn"]', { timeout: 1800000, polling: 1000 });
  await sleep(2500); // let the archive effect push the run into resultsStore

  /* ---------- BASE 3: Run page, completed ---------- */
  await waitForBars();

  // Appendix D figure 11. The transport controls (Pause / Resume / Stop) are
  // replaced by "New Run" once the run completes, so step 10 is called out on
  // the live frame instead.
  await snapFigures("run-complete", [
    { slug: "run-complete", specs: [
      { step: 9, txt: "Algorithm comparison", up: 1, pad: 4, inset: true },
    ] },
  ]);

  // Tear the run down before leaving the page. Clicking "New Run" calls stop(),
  // which clears the three engines and drops the live WebGL scene. Navigating
  // away while that scene is still mounted leaves the router URL updated but
  // the Run page still rendered, because React Router pushes the URL
  // synchronously in navigate() and only then schedules the re-render.
  // The archived run stays in resultsStore, so the Results page still has it.
  await page.click('[data-testid="new-run-btn"]');
  await page.waitForFunction(
    () => !document.querySelector('[data-testid="new-run-btn"]'),
    { timeout: 60000, polling: 300 }
  );
  await sleep(1200);

  /* ---------- BASE 4: Results page, history ---------- */
  await nav("Results", "Results");
  await page.waitForSelector('[data-testid="history-table"]', { timeout: 120000 });
  await sleep(1000);

  // Appendix D figures 16 and 20. "Clear history" lives on this page, so the
  // last item of the export section is called out here.
  await snapFigures("results-history", [
    { slug: "results-history", specs: [
      { step: 1, sel: '[data-testid="history-table"]', pad: 6, inset: true },
    ] },
    { slug: "results-clear-history", specs: [
      { step: 4, sel: '[data-testid="clear-all"]', pad: 6, inset: true, target: 150 },
    ] },
  ]);

  // open the run detail view
  await page.evaluate(() => {
    const btn = document.querySelector('[data-testid="history-table"] button');
    if (!btn) throw new Error("no open button in history table");
    btn.click();
  });
  await page.waitForSelector('[data-testid="export-pdf"]', { timeout: 120000 });
  await sleep(2500);
  await waitForBars();

  /* ---------- BASE 5: Results page, run detail ---------- */
  await scrollToTop();

  // Appendix D figures 17-19.
  await snapFigures("results-detail", [
    { slug: "results-detail-cards", specs: [
      // up 3 reaches the 4-card grid: CardTitle -> CardHeader -> Card -> grid.
      { step: 2, txt: "Standard ACO", up: 3, pad: 6, inset: true },
      { step: 3, head: "Convergence: mean L*(t)", up: 2, pad: 4, inset: true },
    ] },
    { slug: "results-detail-charts", specs: [
      { step: 4, head: "Quality vs time comparison", up: 2, pad: 4, inset: true },
      { step: 5, sel: '[data-testid="back-btn"]', pad: 6, inset: true, target: 150 },
    ] },
    { slug: "results-export", specs: [
      // Three distinct buttons, one magnified. A union box here would nest the
      // HTML and Markdown boxes inside it and read as a duplicate callout.
      { step: 1, sel: '[data-testid="export-pdf"]', pad: 4, inset: true, target: 180 },
      { step: 2, sel: '[data-testid="export-html"]', pad: 4 },
      { step: 3, sel: '[data-testid="export-md"]', pad: 4 },
    ] },
  ]);

  /* ---------- BASE 6: Simulate page, playing ---------- */
  await nav("Simulate", "Simulation");
  await page.waitForSelector('[data-testid="sim-play"]', { timeout: 60000 });

  // Run the simulation at 5 iters/sec. At the default 20 the trial can reach
  // T_max while mark()'s round-trips are still in flight, which detaches the
  // Pause button mid-click. 5 iters/sec still yields well over a hundred
  // iterations, so the process log fills with trigger events.
  await setInput("sim-rate", "5");
  await sleep(300);
  await page.click('[data-testid="sim-play"]');

  await page.waitForSelector('[data-testid="map3d-canvas"] canvas', { timeout: 240000 });
  await page.waitForFunction(() => /Iter [1-9]\d*\//.test(document.body.innerText), { timeout: 240000 });
  // accumulate iterations so the process log has trigger entries
  await page.waitForFunction(
    (target) => {
      const m = document.body.innerText.match(/Iter (\d+)\//);
      return m && Number(m[1]) >= target;
    },
    { timeout: 240000, polling: 300 },
    120
  );

  // Appendix D figures 11-15.
  await snapFigures("sim-playing", [
    // No insets on either figure: every control they labelled is already legible
    // at the 6in column width, so a magnified copy only duplicated the badge,
    // covered the code panel or its own chart, and clipped at the frame edge.
    { slug: "sim-setup", specs: [
      { step: 1, txt: "Iters / sec", up: 3, pad: 6 },
      { step: 2, sel: '[data-testid="map3d-canvas"]', pad: 0 },
      { step: 3, txt: "Convergence L*(t)", up: 1, pad: 4 },
    ] },
    { slug: "sim-pipeline", specs: [
      { step: 4, txt: "Run Structure", up: 1, pad: 4 },
      { step: 5, sel: '[data-testid="var-inspector"]', pad: 3 },
      { step: 7, sel: '[data-testid="sim-scrubber"]', up: 1, pad: 4 },
    ] },
    { slug: "sim-transport", specs: [
      {
        step: 6,
        union: [
          { sel: '[data-testid="sim-pause"]', pad: 4 },
          { sel: '[data-testid="sim-step"]', pad: 4 },
          { sel: '[data-testid="sim-reset"]', pad: 4 },
        ],
        inset: true,
        target: 160,
      },
    ] },
    { slug: "sim-code", specs: [
      { step: 8, sel: '[data-testid="code-panel"]', pad: 0 },
      // Scoped to tr so it cannot match an active Run Structure chip, which
      // carries the same bg-green-600/20 class.
      {
        step: 8,
        sel: 'tr[class*="bg-green-600/20"]',
        pad: 4,
        inset: true,
        target: 200,
        clipTo: { sel: '[data-testid="code-panel"]' },
      },
    ] },
    { slug: "sim-log", specs: [
      { step: 9, sel: '[data-testid="process-log"]', pad: 3, inset: true },
      { step: 10, txt: "2-opt activations", up: 2, pad: 4, inset: true },
    ] },
  ]);

  const errs = hardErrors();
  if (errs.length) {
    console.log("PAGE ERRORS:", errs.slice(0, 5).join(" | "));
    process.exitCode = 1;
  } else {
    console.log("no hard page errors");
  }

  // Sidecar of callout rectangles, consumed by annotate_appendix_figures.py.
  const sidecar = path.join(OUT, "annotations.json");
  fs.writeFileSync(
    sidecar,
    JSON.stringify(
      {
        viewport: { width: VW, height: VH },
        // measured from the reference document's annotated figures
        style: { color: [255, 0, 0], strokeWidth: 3, radius: 8, badgeRadius: 13, badgeOffset: [10, 4] },
        insetStyle: { color: [255, 0, 0], strokeWidth: 5, radius: 18, leaderWidth: 4, maxZoom: 4.5 },
        figures: annotations,
      },
      null,
      2
    )
  );
  if (skipped.length) {
    console.log(`SKIPPED ${skipped.length} callout(s):`);
    for (const s of skipped) console.log("  - " + s);
    process.exitCode = 2;
  }
  const totalBoxes = annotations.reduce((n, a) => n + a.boxes.length, 0);
  const totalInsets = annotations.reduce((n, a) => n + a.boxes.filter((b) => b.inset).length, 0);
  console.log(
    `wrote ${sidecar} (${annotations.length} figures over ${written.length} base captures, ` +
      `${totalBoxes} callouts, ${totalInsets} insets)`
  );

  console.log(`captured ${written.length} screenshots into ${OUT}`);
  written.forEach((f) => console.log("  " + f));
} finally {
  await browser.close();
}