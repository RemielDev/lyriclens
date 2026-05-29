"use strict";

const $ = (id) => document.getElementById(id);
const lyricsEl = $("lyrics");
const skeletonEl = $("skeleton");
const stateEl = $("state");
const metaEl = $("meta");
const songEl = $("song");
const artistEl = $("artist");
const sourceEl = $("source");
const queryEl = $("query");
const syncBtn = $("sync");
const toastEl = $("toast");

// --- UI state machine --------------------------------------------------------

function showSkeleton() {
  skeletonEl.classList.remove("hidden");
  stateEl.classList.add("hidden");
  lyricsEl.innerHTML = "";
}

function showState(icon, title, msg) {
  skeletonEl.classList.add("hidden");
  stateEl.classList.remove("hidden");
  lyricsEl.innerHTML = "";
  $("stateIcon").textContent = icon;
  $("stateTitle").textContent = title;
  $("stateMsg").innerHTML = msg;
}

function showLyricsPane() {
  skeletonEl.classList.add("hidden");
  stateEl.classList.add("hidden");
}

function showMeta(hit) {
  songEl.textContent = hit.title;
  artistEl.textContent = hit.artist || "";
  if (hit.url) {
    sourceEl.href = hit.url;
    sourceEl.textContent = `${hit.source || "Genius"} ↗`;
  } else {
    sourceEl.removeAttribute("href");
    sourceEl.textContent = hit.source || "";
  }
  metaEl.classList.remove("hidden");
}

function hideMeta() {
  metaEl.classList.add("hidden");
}

let toastTimer = null;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 1600);
}

// --- YouTube title cleaning --------------------------------------------------

const NOISE_PATTERNS = [
  /\(official\s*(music\s*)?(video|audio|lyric[s]?|visualizer|mv)\)/gi,
  /\[official\s*(music\s*)?(video|audio|lyric[s]?|visualizer|mv)\]/gi,
  /\(lyric[s]?\)/gi,
  /\[lyric[s]?\]/gi,
  /\(audio\)/gi,
  /\[audio\]/gi,
  /\(visualizer\)/gi,
  /\(hd\)/gi,
  /\(4k\)/gi,
  /\(explicit\)/gi,
  /\bofficial\s*(music\s*)?video\b/gi,
  /\bofficial\s*audio\b/gi,
  /\bofficial\s*lyric\s*video\b/gi,
  /\bofficial\b/gi,
  /\bmusic\s*video\b/gi,
  /\blyric\s*video\b/gi,
  /\bft\.?\s+[^()\[\]\-|]+/gi,
  /\bfeat\.?\s+[^()\[\]\-|]+/gi,
  /\bprod\.?\s*by\s+[^()\[\]\-|]+/gi,
];

const VERSION_PATTERNS = [
  /\(.*?\b(radio|club|extended|original|single|album|clean|dirty)?\s*(edit|mix|remix|version|edition)\b.*?\)/gi,
  /\[.*?\b(radio|club|extended|original|single|album|clean|dirty)?\s*(edit|mix|remix|version|edition)\b.*?\]/gi,
  /\(.*?\b(remaster(ed)?|remastered\s*\d{2,4}|live|acoustic|instrumental|demo|bonus\s*track|mono|stereo)\b.*?\)/gi,
  /\[.*?\b(remaster(ed)?|live|acoustic|instrumental|demo|bonus\s*track|mono|stereo)\b.*?\]/gi,
  /\b\d{4}\s*remaster(ed)?\b/gi,
];

function stripVersionTags(s) {
  let out = s;
  for (const re of VERSION_PATTERNS) out = out.replace(re, " ");
  return out.replace(/\s{2,}/g, " ").trim();
}

function cleanYouTubeTitle(rawTitle) {
  let t = rawTitle
    .replace(/\s*-\s*YouTube(\s*Music)?\s*$/i, "")
    .replace(/^\(\d+\)\s*/, "");

  for (const re of NOISE_PATTERNS) t = t.replace(re, " ");
  t = stripVersionTags(t);
  t = t.replace(/\s{2,}/g, " ").trim();

  const split = t.split(/\s+[-–—:]\s+/);
  let artist = "";
  let song = t;
  if (split.length >= 2) {
    artist = split[0].trim();
    song = split.slice(1).join(" - ").trim();
  }

  song = stripVersionTags(song).replace(/\([^)]*\)/g, "").replace(/\[[^\]]*\]/g, "").trim();
  artist = artist.replace(/\([^)]*\)/g, "").replace(/\[[^\]]*\]/g, "").trim();

  return { artist, song, query: [artist, song].filter(Boolean).join(" ") || t };
}

// --- Active tab / video context ---------------------------------------------

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function isYouTube(url) {
  try {
    const u = new URL(url);
    return u.hostname.endsWith("youtube.com") || u.hostname.endsWith("youtu.be");
  } catch {
    return false;
  }
}

async function getYouTubeContext(tab) {
  if (!tab || !tab.url || !isYouTube(tab.url)) return null;
  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const sel =
          document.querySelector("h1.ytd-watch-metadata yt-formatted-string") ||
          document.querySelector("h1.title yt-formatted-string") ||
          document.querySelector("#title h1") ||
          document.querySelector("ytmusic-player-bar .title");
        const channel =
          document.querySelector("ytd-channel-name a") ||
          document.querySelector("#owner #channel-name a") ||
          document.querySelector("ytmusic-player-bar .byline a");
        return {
          pageTitle: sel ? sel.textContent.trim() : null,
          channel: channel ? channel.textContent.trim() : null,
          tabTitle: document.title,
        };
      },
    });
    return result || { tabTitle: tab.title };
  } catch {
    return { tabTitle: tab.title };
  }
}

async function getVideoState(tabId) {
  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const v = document.querySelector("video");
        if (!v) return null;
        return { time: v.currentTime, paused: v.paused, duration: v.duration };
      },
    });
    return result;
  } catch {
    return null;
  }
}

// --- Smart matching ----------------------------------------------------------

function normalize(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STOPWORDS = new Set(["the", "a", "an", "feat", "ft", "featuring", "with", "x"]);

function tokens(s) {
  return normalize(s).split(" ").filter((w) => w && !STOPWORDS.has(w));
}

function tokenSim(a, b) {
  if (!a.length || !b.length) return 0;
  const bSet = new Set(b);
  let inter = 0;
  const seen = new Set();
  for (const t of a) {
    if (bSet.has(t) && !seen.has(t)) {
      inter++;
      seen.add(t);
    }
  }
  return (2 * inter) / (new Set(a).size + new Set(b).size);
}

function coverage(target, cand) {
  if (!target.length) return 0;
  const candSet = new Set(cand);
  let hit = 0;
  for (const t of new Set(target)) if (candSet.has(t)) hit++;
  return hit / new Set(target).size;
}

function scoreResult(res, target) {
  const resTitle = stripVersionTags(res.title_with_featured || res.title || "");
  const resArtist = res.primary_artist?.name || "";
  const titleTok = tokens(resTitle);
  const artistTok = tokens(resArtist);

  const titleCov = coverage(target.songTokens, titleTok);
  const titleDice = tokenSim(target.songTokens, titleTok);

  let artistScore = 0.5;
  if (target.artistTokens.length) {
    artistScore = Math.max(
      coverage(target.artistTokens, artistTok),
      coverage(artistTok, target.artistTokens)
    );
  }

  let score = titleCov * 0.6 + titleDice * 0.15 + artistScore * 0.25;
  if (titleCov < 0.5) score *= 0.3;
  if (target.artistTokens.length && artistScore === 0) score *= 0.12;

  return { score, titleCov, artistScore };
}

// --- Providers ---------------------------------------------------------------

async function fetchHits(query) {
  const url = `https://genius.com/api/search/multi?q=${encodeURIComponent(query)}`;
  const r = await fetch(url, { credentials: "omit" });
  if (!r.ok) return [];
  const data = await r.json();
  const sections = data?.response?.sections || [];
  const out = [];
  for (const sec of sections) {
    for (const h of sec.hits || []) {
      const res = h.result;
      if (
        res &&
        res.url &&
        (res._type === "song" ||
          res.lyrics_state === "complete" ||
          res.url.endsWith("-lyrics"))
      ) {
        out.push(res);
      }
    }
  }
  return out;
}

async function searchGenius(target) {
  const artist = (target.artist || "").trim();
  const song = (target.song || "").trim();

  const queries = [];
  if (artist && song) queries.push(`${artist} ${song}`, `${song} ${artist}`);
  if (song) queries.push(song);
  if (target.raw && !queries.includes(target.raw)) queries.push(target.raw);
  if (!queries.length) throw new Error("Nothing to search for.");

  const scoreTarget = {
    songTokens: tokens(song || target.raw || ""),
    artistTokens: tokens(artist),
  };

  const byUrl = new Map();
  const batches = await Promise.all(queries.map((q) => fetchHits(q)));
  for (const batch of batches) {
    for (const res of batch) if (!byUrl.has(res.url)) byUrl.set(res.url, res);
  }
  if (!byUrl.size) throw new Error("No Genius match found");

  let best = null;
  for (const res of byUrl.values()) {
    const s = scoreResult(res, scoreTarget);
    if (!best || s.score > best.s.score) best = { res, s };
  }
  if (!best || best.s.score < 0.25) throw new Error("No confident Genius match.");

  return {
    url: best.res.url,
    title: best.res.title_with_featured || best.res.title,
    artist: best.res.primary_artist?.name || "",
  };
}

async function provideGenius(target) {
  const hit = await searchGenius(target);
  const lyrics = await fetchLyrics(hit.url);
  return { title: hit.title, artist: hit.artist, url: hit.url, lyrics, synced: null, source: "Genius" };
}

async function provideLrclib(target) {
  const q = [target.artist, target.song].filter(Boolean).join(" ") || target.raw;
  if (!q) return null;
  const r = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(q)}`, {
    credentials: "omit",
  });
  if (!r.ok) return null;
  const arr = await r.json();
  if (!Array.isArray(arr) || !arr.length) return null;

  const st = {
    songTokens: tokens(target.song || target.raw || ""),
    artistTokens: tokens(target.artist),
  };
  let best = null;
  for (const it of arr) {
    if (!it.plainLyrics && !it.syncedLyrics) continue;
    const s = scoreResult({ title: it.trackName, primary_artist: { name: it.artistName } }, st);
    if (!best || s.score > best.s.score) best = { it, s };
  }
  if (!best || best.s.score < 0.25) return null;

  let text = best.it.plainLyrics;
  if (!text && best.it.syncedLyrics) {
    text = best.it.syncedLyrics.replace(/^\[\d+:\d+(?:\.\d+)?\]\s?/gm, "");
  }
  text = (text || "").trim();
  if (!text) return null;
  return {
    title: best.it.trackName,
    artist: best.it.artistName,
    lyrics: text,
    synced: best.it.syncedLyrics || null,
    source: "LRCLIB",
  };
}

async function provideOvh(target) {
  if (!target.artist || !target.song) return null;
  const r = await fetch(
    `https://api.lyrics.ovh/v1/${encodeURIComponent(target.artist)}/${encodeURIComponent(target.song)}`,
    { credentials: "omit" }
  );
  if (!r.ok) return null;
  let d;
  try {
    d = await r.json();
  } catch {
    return null;
  }
  const text = (d.lyrics || "").replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!text) return null;
  return { title: target.song, artist: target.artist, lyrics: text, synced: null, source: "lyrics.ovh" };
}

async function fetchLyrics(url) {
  const r = await fetch(url, { credentials: "omit" });
  if (!r.ok) throw new Error(`Couldn't load Genius page (${r.status})`);
  const html = await r.text();
  return parseLyricsFromHtml(html);
}

// Non-lyric junk Genius nests inside the lyrics container (contributor counts,
// translation dropdowns, the "X Lyrics" header, song bio, embedded images).
const JUNK_SELECTOR = [
  '[data-exclude-from-selection="true"]',
  "noscript",
  "img",
  "svg",
  "button",
  '[class*="LyricsHeader"]',
  '[class*="Contributors"]',
  '[class*="Dropdown"]',
  '[class*="RightSidebar"]',
  '[class*="SongDescription"]',
  '[class*="LyricsEditButton"]',
  '[class*="InreadAd"]',
].join(",");

function parseLyricsFromHtml(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const containers = doc.querySelectorAll('[data-lyrics-container="true"]');
  if (containers.length) {
    const out = [];
    containers.forEach((c) => out.push(extractText(c)));
    return cleanupLyrics(out.join("\n"));
  }
  const old = doc.querySelector(".lyrics");
  if (old) return cleanupLyrics(extractText(old));
  throw new Error("Couldn't find lyrics on that page");
}

function extractText(node) {
  const clone = node.cloneNode(true);
  clone.querySelectorAll(JUNK_SELECTOR).forEach((el) => el.remove());
  const html = clone.innerHTML
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div)>/gi, "\n");
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent;
}

function cleanupLyrics(text) {
  return text
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// --- LRC (synced) parsing ----------------------------------------------------

function parseLRC(lrc) {
  const out = [];
  for (const raw of lrc.split("\n")) {
    const m = raw.match(/^((?:\[\d+:\d+(?:\.\d+)?\])+)(.*)$/);
    if (!m) continue;
    const text = m[2].trim();
    const stamps = m[1].match(/\[(\d+):(\d+(?:\.\d+)?)\]/g) || [];
    for (const st of stamps) {
      const mm = st.match(/\[(\d+):(\d+(?:\.\d+)?)\]/);
      const t = parseInt(mm[1], 10) * 60 + parseFloat(mm[2]);
      out.push({ t, text });
    }
  }
  out.sort((a, b) => a.t - b.t);
  return out;
}

// --- Rendering ---------------------------------------------------------------

let lineEls = []; // for synced highlight: [{t, el}]

function renderPlain(raw) {
  lyricsEl.classList.remove("synced");
  lyricsEl.innerHTML = "";
  lineEls = [];
  const frag = document.createDocumentFragment();
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (trimmed === "") {
      const b = document.createElement("span");
      b.className = "blank";
      frag.appendChild(b);
    } else if (/^\[.*\]$/.test(trimmed)) {
      const h = document.createElement("span");
      h.className = "section-header";
      h.textContent = trimmed;
      frag.appendChild(h);
    } else {
      const s = document.createElement("span");
      s.className = "line";
      s.textContent = line;
      frag.appendChild(s);
    }
  }
  lyricsEl.appendChild(frag);
  flash();
}

function renderSynced(lrcLines) {
  lyricsEl.classList.add("synced");
  lyricsEl.innerHTML = "";
  lineEls = [];
  const frag = document.createDocumentFragment();
  for (const { t, text } of lrcLines) {
    const s = document.createElement("span");
    if (text === "") {
      s.className = "blank";
    } else if (/^\[.*\]$/.test(text)) {
      s.className = "section-header";
      s.textContent = text;
    } else {
      s.className = "line";
      s.textContent = text || "♪";
    }
    frag.appendChild(s);
    lineEls.push({ t, el: s });
  }
  lyricsEl.appendChild(frag);
  flash();
}

function flash() {
  lyricsEl.classList.remove("show");
  void lyricsEl.offsetWidth;
  lyricsEl.classList.add("show");
  lyricsEl.scrollTop = 0;
}

function plainText() {
  return Array.from(lyricsEl.querySelectorAll(".line, .section-header"))
    .map((el) => el.textContent)
    .join("\n");
}

// --- Sync engine -------------------------------------------------------------

let syncState = {
  enabled: false,
  available: false,
  tabId: null,
  lrc: null,
  timer: null,
  lastIdx: -1,
  userScrolledAt: 0,
};

function setSyncAvailable(available, tabId, lrc) {
  syncState.available = available;
  syncState.tabId = tabId;
  syncState.lrc = lrc;
  syncBtn.hidden = !available;
  if (!available) stopSync();
}

function startSync() {
  if (!syncState.available || syncState.enabled) return;
  syncState.enabled = true;
  syncBtn.setAttribute("aria-pressed", "true");
  renderSynced(syncState.lrc);
  syncState.lastIdx = -1;
  tickSync();
  syncState.timer = setInterval(tickSync, 400);
}

function stopSync() {
  syncState.enabled = false;
  syncBtn.setAttribute("aria-pressed", "false");
  clearInterval(syncState.timer);
  syncState.timer = null;
}

async function tickSync() {
  if (!syncState.enabled) return;
  const vs = await getVideoState(syncState.tabId);
  if (!vs || typeof vs.time !== "number") return;
  const time = vs.time;
  let idx = -1;
  for (let i = 0; i < lineEls.length; i++) {
    if (lineEls[i].t <= time + 0.15) idx = i;
    else break;
  }
  if (idx === syncState.lastIdx) return;
  syncState.lastIdx = idx;

  lineEls.forEach((l, i) => {
    l.el.classList.toggle("active", i === idx);
    l.el.classList.toggle("passed", i < idx);
  });

  // Auto-scroll unless the user scrolled in the last 4s.
  if (idx >= 0 && Date.now() - syncState.userScrolledAt > 4000) {
    const el = lineEls[idx].el;
    const top = el.offsetTop - lyricsEl.clientHeight / 2 + el.clientHeight / 2;
    lyricsEl.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }
}

lyricsEl.addEventListener("wheel", () => (syncState.userScrolledAt = Date.now()), { passive: true });
lyricsEl.addEventListener("touchmove", () => (syncState.userScrolledAt = Date.now()), { passive: true });

// --- Font scaling ------------------------------------------------------------

let fontScale = 1;
function applyFontScale() {
  document.documentElement.style.setProperty("--font-scale", fontScale.toFixed(2));
}
function bumpFont(delta) {
  fontScale = Math.min(1.5, Math.max(0.8, +(fontScale + delta).toFixed(2)));
  applyFontScale();
  chrome.storage?.local.set({ fontScale });
}

// --- Main flow ---------------------------------------------------------------

async function run(overrideQuery) {
  hideMeta();
  stopSync();
  setSyncAvailable(false, null, null);
  showSkeleton();

  let target = null;
  let tabId = null;

  if (overrideQuery) {
    const parsed = cleanYouTubeTitle(overrideQuery);
    target = { artist: parsed.artist, song: parsed.song || overrideQuery, raw: overrideQuery };
    queryEl.value = overrideQuery;
    const tab = await getActiveTab();
    if (tab && isYouTube(tab.url)) tabId = tab.id;
  } else {
    const tab = await getActiveTab();
    const ctx = await getYouTubeContext(tab);
    if (!ctx) {
      showState(
        "🎬",
        "Open a YouTube video",
        "Play a song on <b>YouTube</b>, then click LyricLens. Or search any song below."
      );
      return;
    }
    tabId = tab.id;
    const rawTitle = ctx.pageTitle || ctx.tabTitle || "";
    const parsed = cleanYouTubeTitle(rawTitle);
    if (!parsed.artist && ctx.channel) {
      parsed.artist = ctx.channel.replace(/\s*-?\s*topic$/i, "").trim();
    }
    if (!parsed.song && !parsed.artist) {
      showState("🔎", "Couldn't read the title", "Try searching for the song manually below.");
      return;
    }
    target = { artist: parsed.artist, song: parsed.song, raw: rawTitle };
    queryEl.value = [parsed.artist, parsed.song].filter(Boolean).join(" ");
  }

  let result = null;

  // Sync is the headline feature, and only LRCLIB carries timestamps. So when
  // we're on a YouTube tab, check LRCLIB first: if it has time-synced lyrics,
  // use them so sync actually engages instead of being short-circuited by a
  // plain-text Genius hit.
  if (tabId) {
    try {
      const lr = await provideLrclib(target);
      if (lr && lr.synced && parseLRC(lr.synced).length >= 4) result = lr;
    } catch {
      /* fall through to the normal chain */
    }
  }

  if (!result) {
    const providers = [provideGenius, provideLrclib, provideOvh];
    for (const fn of providers) {
      try {
        const res = await fn(target);
        if (res && res.lyrics) {
          result = res;
          break;
        }
      } catch {
        /* try next provider */
      }
    }
  }

  if (!result) {
    showState(
      "🤷",
      "No lyrics found",
      "We checked Genius, LRCLIB &amp; lyrics.ovh. Try refining the search below, e.g. <b>artist song</b>."
    );
    return;
  }

  showMeta(result);
  showLyricsPane();
  renderPlain(result.lyrics);

  // Offer synced mode when LRC data + a YouTube tab are available.
  if (result.synced && tabId) {
    const lrc = parseLRC(result.synced);
    if (lrc.length >= 4) {
      setSyncAvailable(true, tabId, lrc);
      startSync(); // auto-enable, it's the headline feature
    }
  }
}

// --- Events ------------------------------------------------------------------

$("refresh").addEventListener("click", () => run());
$("inc").addEventListener("click", () => bumpFont(0.1));
$("dec").addEventListener("click", () => bumpFont(-0.1));

$("copy").addEventListener("click", async () => {
  const text = plainText();
  if (!text) return toast("Nothing to copy");
  try {
    await navigator.clipboard.writeText(text);
    toast("Lyrics copied");
  } catch {
    toast("Copy failed");
  }
});

syncBtn.addEventListener("click", () => {
  if (syncState.enabled) {
    stopSync();
    renderPlain(plainTextFromLrc());
  } else {
    startSync();
  }
});

function plainTextFromLrc() {
  return (syncState.lrc || []).map((l) => l.text).join("\n");
}

$("search").addEventListener("click", () => {
  const q = queryEl.value.trim();
  if (q) run(q);
});
queryEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const q = queryEl.value.trim();
    if (q) run(q);
  }
});

document.addEventListener("keydown", (e) => {
  if (e.target === queryEl) return;
  if (e.key === "+" || e.key === "=") bumpFont(0.1);
  if (e.key === "-") bumpFont(-0.1);
});

// --- Boot --------------------------------------------------------------------

(async function init() {
  try {
    const stored = await chrome.storage?.local.get("fontScale");
    if (stored && typeof stored.fontScale === "number") fontScale = stored.fontScale;
  } catch {}
  applyFontScale();
  run();
})();
