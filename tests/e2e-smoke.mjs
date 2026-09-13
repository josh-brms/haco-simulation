/* E2E smoke test: launches real Chrome, loads the app, starts a benchmark,
   verifies the simulation advances, charts draw, and no page errors occur. */
import puppeteer from "puppeteer-core";

const BASE = process.env.APP_URL || "http://localhost:4173";

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? " - " + detail : ""}`);
};

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--window-size=1440,900"],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") pageErrors.push("console: " + m.text());
  });

  await page.goto(BASE, { waitUntil: "networkidle2", timeout: 30000 });
  check("app loads", true);

  // branding
  const brand = await page.evaluate(() => document.body.innerText.includes("ACO Mission Control"));
  check("branded as ACO Mission Control", brand);

  // sidebar + parameter config stage visible first (no visuals yet)
  await page.waitForSelector('[data-testid="start-btn"]', { timeout: 10000 });
  check("Run page shows parameter configuration first", true);
  const configOnly = await page.evaluate(
    () =>
      !!document.querySelector('[data-testid="instance-select"]') &&
      !document.querySelector('[data-testid="chart-convergence"]') &&
      !document.querySelector('[data-testid="code-panel"]')
  );
  check("visuals hidden on the config stage", configOnly);

  // reduce trials for a fast run
  await page.evaluate(() => {
    const input = document.querySelector('[data-testid="trials"]');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    setter.call(input, "1");
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });

  // start benchmark -> loader -> visual stage
  await page.click('[data-testid="start-btn"]');
  const loaderShown = await page.evaluate(() => !!document.querySelector('[data-testid="loader"]'));
  check("loader animation shows while preparing", loaderShown);
  await new Promise((r) => setTimeout(r, 3000));
  const status = await page.evaluate(() => document.body.innerText.includes("running"));
  check("benchmark status shows running", status);
  const loaderGone = await page.evaluate(() => !document.querySelector('[data-testid="loader"]'));
  check("loader hides once running", loaderGone);

  // frame advances (HUD shows Iter N/M with N > 0)
  await new Promise((r) => setTimeout(r, 2500));
  const iterText = await page.evaluate(() => {
    const m = document.body.innerText.match(/Iter (\d+)\/(\d+)/);
    return m ? { frame: Number(m[1]), total: Number(m[2]) } : null;
  });
  check("simulation advances iterations", !!iterText && iterText.frame > 0, JSON.stringify(iterText));

  // canvas mounted (3D map) + python source panel
  const hasCanvas = await page.evaluate(() => !!document.querySelector('[data-testid="map3d-canvas"] canvas'));
  check("3D canvas mounted", hasCanvas);
  const pyCode = await page.evaluate(() => {
    const panel = document.querySelector('[data-testid="code-panel"]');
    return !!panel && panel.textContent.includes("def _run_adaptive");
  });
  check("source code panel shows Python", pyCode);

  // no page errors so far (WebGL warnings ignored)
  const hardErrors = pageErrors.filter((e) => !/WebGL|swiftshader|GroupMarkerNotSet|Automatic fallback/i.test(e));
  check("no page errors", hardErrors.length === 0, hardErrors.slice(0, 3).join(" | "));

  // let the trial finish (tMax=500 at 2 iters/tick, 30 ticks/s ~ <= 10s) and check completion
  await page.waitForFunction(
    () => document.body.innerText.includes("completed") || document.body.innerText.includes("Trial 2/1"),
    { timeout: 60000, polling: 500 }
  ).catch(() => {});
  const completed = await page.evaluate(() => document.body.innerText.includes("completed"));
  check("benchmark reaches completed", completed);

  // results page has the archived run
  await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll("a"));
    const resultsLink = links.find((a) => a.textContent.trim() === "Results");
    if (resultsLink) resultsLink.click();
  });
  await page.waitForSelector('[data-testid="history-table"]', { timeout: 10000 }).catch(() => {});
  const hasHistory = await page.evaluate(() => !!document.querySelector('[data-testid="history-table"]'));
  check("results page lists completed run", hasHistory);

  // run detail opens
  const viewBtn = await page.$('[data-testid^="view-"]');
  if (viewBtn) {
    await viewBtn.click();
    await page.waitForSelector('[data-testid="export-pdf"]', { timeout: 10000 }).catch(() => {});
    const detail = await page.evaluate(
      () =>
        !!document.querySelector('[data-testid="export-pdf"]') &&
        !!document.querySelector('[data-testid="export-html"]') &&
        !!document.querySelector('[data-testid="export-md"]')
    );
    check("run detail shows export buttons (PDF/HTML/MD)", detail);
  } else {
    check("run detail shows export buttons (PDF/HTML/MD)", false, "no view button");
  }

  // simulate page works
  await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll("a"));
    const simLink = links.find((a) => a.textContent.trim() === "Simulate");
    if (simLink) simLink.click();
  });
  await page.waitForSelector('[data-testid="sim-play"]', { timeout: 10000 });
  await page.click('[data-testid="sim-play"]');
  await new Promise((r) => setTimeout(r, 1500));
  const simFrame = await page.evaluate(() => {
    const m = document.body.innerText.match(/Iter (\d+)\/(\d+)/);
    return m ? Number(m[1]) : -1;
  });
  check("simulate page advances", simFrame > 0, `frame=${simFrame}`);

  const hardErrors2 = pageErrors.filter((e) => !/WebGL|swiftshader|GroupMarkerNotSet|Automatic fallback/i.test(e));
  check("no page errors at end", hardErrors2.length === 0, hardErrors2.slice(0, 3).join(" | "));
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
