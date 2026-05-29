const { chromium } = require("playwright-core");
const path = require("path");
const fs = require("fs");

const CHROME =
  process.env.CHROME_PATH ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const here = (p) => path.resolve(__dirname, p);
const fileUrl = (p) => "file:///" + here(p).replace(/\\/g, "/");

const MARK_SVG = (s) => `
<svg width="${s}" height="${s}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#7C5CFF"/><stop offset="1" stop-color="#FF4D8D"/>
  </linearGradient></defs>
  <rect x="1" y="1" width="30" height="30" rx="8" fill="url(#lg)"/>
  <rect x="8" y="9" width="16" height="2.6" rx="1.3" fill="#fff" opacity="0.95"/>
  <rect x="8" y="15" width="12" height="2.6" rx="1.3" fill="#fff" opacity="0.8"/>
  <path d="M8 21.5 L8 26 L12 23.75 Z" fill="#fff" opacity="0.95"/>
</svg>`;

// Stub chrome.* + fetch so popup.html renders real UI for QA.
const POPUP_STUBS = `
window.chrome = {
  tabs: { query: async () => [{ id: 1, url: "https://www.youtube.com/watch?v=demo", title: "AURELIA - Midnight Drive" }] },
  scripting: { executeScript: async () => [{ result: {
    pageTitle: "AURELIA - Midnight Drive", channel: "AURELIA - Topic",
    tabTitle: "AURELIA - Midnight Drive - YouTube", time: 12.5, paused: false, duration: 210
  }}] },
  storage: { local: { get: async () => ({}), set: async () => {} } },
};
const _SYNC = [
  "[00:05.00] City lights blur into the rain",
  "[00:09.00] Engine humming, easing off the pain",
  "[00:13.00] Wheels on chrome, the night is wide awake",
  "[00:17.00] Every mile another wall I break",
  "[00:21.00] So I drive, into the violet glow",
  "[00:25.00] Radio low, but my heart is loud",
  "[00:29.00] And I drive, the only road I know"
].join("\\n");
window.fetch = async (url) => {
  if (url.includes("genius.com/api/search")) return { ok: true, json: async () => ({ response: { sections: [] } }) };
  if (url.includes("lrclib.net/api/search")) return { ok: true, json: async () => ([{
    trackName: "Midnight Drive", artistName: "AURELIA",
    plainLyrics: _SYNC.replace(/\\[.*?\\] /g, ""), syncedLyrics: _SYNC
  }]) };
  return { ok: false, status: 404, json: async () => ({}), text: async () => "" };
};
`;

(async () => {
  const browser = await chromium.launch({
    executablePath: CHROME,
    args: ["--force-color-profile=srgb", "--hide-scrollbars", "--font-render-hinting=none"],
  });

  // ---- Marketing frames from assets.html ----
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  await page.goto(fileUrl("assets.html"), { waitUntil: "networkidle" });
  await page.waitForTimeout(300);

  const frames = [
    ["shot1", "out/screenshot-1-hero.png"],
    ["shot2", "out/screenshot-2-sync.png"],
    ["shot3", "out/screenshot-3-match.png"],
    ["shot4", "out/screenshot-4-sources.png"],
    ["shot5", "out/screenshot-5-features.png"],
    ["tileSmall", "out/promo-small-440x280.png"],
    ["tileMarquee", "out/promo-marquee-1400x560.png"],
  ];
  for (const [id, outp] of frames) {
    const el = await page.$("#" + id);
    await el.screenshot({ path: here(outp) });
    const box = await el.boundingBox();
    console.log("✓", outp, `${Math.round(box.width)}x${Math.round(box.height)}`);
  }

  // ---- Icons from the logo mark (fresh page per size) ----
  for (const s of [16, 32, 48, 128]) {
    const ip = await browser.newPage({ viewport: { width: s, height: s }, deviceScaleFactor: 1 });
    await ip.setContent(
      `<body style="margin:0;padding:0;background:transparent">${MARK_SVG(s)}</body>`,
      { waitUntil: "load" }
    );
    await ip.screenshot({
      path: here(`../icons/icon${s}.png`),
      omitBackground: true,
      clip: { x: 0, y: 0, width: s, height: s },
    });
    await ip.close();
    console.log("✓ icon", `${s}x${s}`);
  }
  // store-listing 128 copy
  fs.copyFileSync(here("../icons/icon128.png"), here("out/store-icon-128.png"));

  // ---- QA: render the REAL popup.html ----
  const qa = await browser.newPage({ viewport: { width: 384, height: 568 }, deviceScaleFactor: 2 });
  await qa.addInitScript(POPUP_STUBS);
  await qa.goto(fileUrl("../popup.html"), { waitUntil: "domcontentloaded" });
  await qa.waitForTimeout(900);
  await qa.screenshot({ path: here("out/qa-popup-real.png") });
  console.log("✓ qa-popup-real.png (live popup with stubs)");

  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
