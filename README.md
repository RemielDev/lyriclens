<p align="center">
  <img src="brand/banner.png" alt="LyricLens - synced lyrics for YouTube" width="100%" />
</p>

<h3 align="center">
  Synced, scrollable lyrics for any YouTube song.
</h3>

<p align="center">
  One click. Three sources with smart matching. No account, no tracking.
</p>

<p align="center">
  <a href="https://chromewebstore.google.com/detail/lyriclens-lyrics-for-yout/pbgjpolljeefnaoplmonmdbpkkmfkdol"><img alt="Add to Chrome" src="https://img.shields.io/badge/Add%20to%20Chrome-Free-0e0f14?style=for-the-badge&logo=googlechrome&logoColor=eab308&labelColor=0e0f14&color=c084fc" /></a>
  <a href="LICENSE"><img alt="MIT License" src="https://img.shields.io/badge/license-MIT-0e0f14?style=for-the-badge&labelColor=0e0f14&color=10b981" /></a>
  <a href="https://remieldev.github.io/lyriclens/"><img alt="Website" src="https://img.shields.io/badge/site-lyriclens-0e0f14?style=for-the-badge&labelColor=0e0f14&color=1d1d25" /></a>
</p>

<p align="center">
  <a href="https://chromewebstore.google.com/detail/lyriclens-lyrics-for-yout/pbgjpolljeefnaoplmonmdbpkkmfkdol"><img alt="Chrome Web Store users" src="https://img.shields.io/chrome-web-store/users/pbgjpolljeefnaoplmonmdbpkkmfkdol?label=users&style=flat-square&color=c084fc&labelColor=1c1f26" /></a>
  <a href="https://chromewebstore.google.com/detail/lyriclens-lyrics-for-yout/pbgjpolljeefnaoplmonmdbpkkmfkdol"><img alt="Chrome Web Store rating" src="https://img.shields.io/chrome-web-store/rating/pbgjpolljeefnaoplmonmdbpkkmfkdol?label=rating&style=flat-square&color=f472b6&labelColor=1c1f26" /></a>
  <img alt="Manifest V3" src="https://img.shields.io/badge/Manifest-V3-1c1f26?style=flat-square&color=f472b6" />
  <img alt="No deps" src="https://img.shields.io/badge/runtime%20deps-none-1c1f26?style=flat-square&color=2ea44f" />
  <img alt="Sources" src="https://img.shields.io/badge/Genius%20·%20LRCLIB%20·%20lyrics.ovh-1c1f26?style=flat-square" />
</p>

---

## Install

The easiest way: grab it from the **[Chrome Web Store](https://chromewebstore.google.com/detail/lyriclens-lyrics-for-yout/pbgjpolljeefnaoplmonmdbpkkmfkdol)** in one click. Works in Chrome, Edge, Brave, Arc, and any other Chromium browser.

For development or to run unmodified source, see the unpacked install below.

---

A Chrome extension that shows **synced, scrollable lyrics** for the YouTube song you're watching, in one click. Pulls from **Genius, then LRCLIB, then lyrics.ovh** with smart song matching, so you get the *right* lyrics far more often than any single-source tool.

![hero](store/out/screenshot-1-hero.png)

## Features

- **One-click lyrics** for any `youtube.com/watch` or `music.youtube.com` song.
- **Synced, karaoke-style highlighting** that follows the song in real time and
  auto-scrolls when time-synced lyrics exist (LRCLIB).
- **Smart matching** that cleans the title (`Official Video`, `feat.`, `Remix`...),
  reads the real artist from the channel, and scores by title **and** artist so
  same-named or wrong songs are rejected. Says "not found" instead of guessing.
- **Three sources with auto fallback:** Genius, then LRCLIB, then lyrics.ovh.
- **Reading comfort:** adjustable text size (remembered), one-tap copy, smooth
  scrolling, styled section headers, dark UI.
- **Private:** no account, no tracking, no background activity. Runs only on click.

## Install (unpacked, for development)

1. Open `chrome://extensions`
2. Toggle **Developer mode** (top right)
3. **Load unpacked** and select this folder
4. Pin the extension and open it on a YouTube song

> After editing code, click the reload icon on the extension card.

## Use

- Play a song on YouTube, then click the LyricLens icon.
- It auto-detects the song and shows lyrics; if LRCLIB has synced lyrics, the
  **Sync** badge lights up and lines highlight in time.
- Wrong match? Type `artist song` in the search box and press Enter.
- `A- / A+` resize text. `Copy` copies all lyrics.

## How it works

- `popup.js` reads the active tab's video title and channel via
  `chrome.scripting.executeScript`.
- Searches providers, scores results (`scoreResult`) on title/artist token overlap,
  and renders the best confident match.
- Genius lyrics are parsed from `[data-lyrics-container="true"]`, with non-lyric
  nodes (`data-exclude-from-selection`, images, headers) stripped first. LRCLIB
  returns plain plus LRC synced lyrics; lyrics.ovh returns plain text.
- Synced mode polls the page `<video>.currentTime` every 400 ms to highlight and
  auto-scroll the active line.

No API keys. No server.

## Project layout

```
manifest.json        MV3 manifest
popup.html/.css/.js  the extension UI and logic
icons/               16/32/48/128 PNG icons (generated from the logo)
store/
  assets.html        source template for all marketing graphics
  render.js          renders screenshots, promo tiles, icons, and a QA popup shot
  out/               generated store assets (screenshots, tiles, icon, QA)
  STORE_LISTING.md   copy/paste-ready Chrome Web Store listing
  PRIVACY.md         privacy policy (host this and link it in the listing)
```

## Building store assets

```bash
cd store
npm install            # installs playwright-core (uses your system Chrome)
npm run render         # regenerates everything in store/out/ and icons/
```

`render.js` launches your installed Chrome via `playwright-core`, with no browser download. Override the path with `CHROME_PATH=... node render.js` if needed.

## Packaging for the Web Store

```bash
npm run pack           # from repo root, builds dist/lyriclens.zip
```

Then upload `dist/lyriclens.zip` in the [Developer Dashboard](https://chrome.google.com/webstore/devconsole) and fill in the fields from `store/STORE_LISTING.md`.

## Notes and disclaimers

- Not affiliated with YouTube, Google, or Genius. Lyrics belong to their respective owners and are fetched from public providers.
- If a provider changes its markup or API, update the relevant `provide*` function in `popup.js`.

## License

[MIT](LICENSE).
