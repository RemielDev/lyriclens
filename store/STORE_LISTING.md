# Chrome Web Store: Listing Kit

Everything you need to publish **LyricLens - Lyrics for YouTube**. Copy/paste each field into the Developer Dashboard. All assets are in `store/out/`.

---

## 1. Basics

| Field | Value |
|---|---|
| **Item name** (max 75 chars) | `LyricLens - Lyrics for YouTube` |
| **Summary** (max 132 chars) | `Instantly see synced, scrollable lyrics for any YouTube song. Pulls from Genius, LRCLIB & more. One click, no setup.` |
| **Category** | `Entertainment` |
| **Language** | `English (United States)` |
| **Default locale** | `en` |

---

## 2. Detailed description (paste into "Description")

```
See the lyrics to whatever you're playing on YouTube, instantly.

LyricLens adds a one-click lyrics viewer to your toolbar. Open any song on
YouTube, click the icon, and the matching lyrics appear in a clean, scrollable
panel. No copy-pasting song titles, no ad-riddled lyrics sites, no setup.

★ SYNCED, KARAOKE-STYLE HIGHLIGHTING
When time-synced lyrics are available, LyricLens follows the song in real time,
highlights the current line, and auto-scrolls so you can read along hands-free.

★ SMART SONG MATCHING
LyricLens reads the video title and channel, strips the noise ("Official Video",
"feat.", "Remix", "4K"...), and scores results by both title AND artist, so it
finds the right song instead of a same-named one. If it isn't confident, it tells
you rather than showing the wrong lyrics.

★ THREE SOURCES, ONE CLICK
It checks Genius, then LRCLIB, then lyrics.ovh automatically. If one library is
missing the track, the next one usually has it, so you get lyrics far more often
than any single-source tool.

★ BUILT FOR READING
• Adjustable text size (A- / A+), remembered between sessions
• One-tap copy to clipboard
• Smooth, distraction-free scrolling
• Section headers (Verse, Chorus...) styled for quick scanning
• Dark by design, easy on the eyes
• Works on youtube.com and music.youtube.com

★ PRIVATE BY DEFAULT
No account. No sign-in. No tracking or analytics. LyricLens only does anything
when you click it, and it only reads the title of the tab you're on to find the
right song.

Wrong match? Type "artist song" in the search box and hit Enter to override.

Not affiliated with YouTube, Google, or Genius. Lyrics are provided by their
respective sources (Genius, LRCLIB, lyrics.ovh) and belong to their owners.
```

---

## 3. Single-purpose description (paste into "Single purpose")

```
LyricLens has one purpose: to display the lyrics of the song in the YouTube
video the user is currently watching. When the user clicks the toolbar icon, it
reads the current tab's video title, looks up the matching lyrics from public
lyrics providers, and shows them in the popup.
```

---

## 4. Permission justifications (paste each into its field)

**`activeTab`**
```
Used only when the user clicks the toolbar icon, to access the current YouTube
tab so we can read the video title and the player's current playback time
(for synced lyrics). No access to any tab unless the user explicitly clicks the
extension.
```

**`scripting`**
```
Used to read the video's title and the channel name from the active YouTube page,
and to read the <video> element's current time for time-synced lyric highlighting.
We never modify the page; we only read these values to find and sync lyrics.
```

**`storage`**
```
Used to remember the user's preferred lyrics text size between sessions. No
personal data is stored.
```

**Host permission: `https://www.youtube.com/*`, `https://music.youtube.com/*`**
```
Required to read the title of the song the user is watching so we can look up its
lyrics, and to read playback time for synced highlighting.
```

**Host permission: `https://genius.com/*`, `https://lrclib.net/*`, `https://api.lyrics.ovh/*`**
```
Required to search for and fetch song lyrics from these public lyrics providers.
These are the sources the extension displays lyrics from.
```

---

## 5. Privacy practices (Data usage form)

- **Does this item collect or use user data?** Answer: **No data is collected.**
- Check the certification: *"I do not sell or transfer user data to third parties, outside of the approved use cases."* Answer: **True**
- *"I do not use or transfer user data for purposes unrelated to my item's single purpose."* Answer: **True**
- *"I do not use or transfer user data to determine creditworthiness or for lending."* Answer: **True**
- **Privacy policy URL:** host `store/PRIVACY.md` (e.g. on GitHub Pages or a Gist) and paste the URL. Required even though no data is collected.

> Note: The video title and search query are sent to the lyrics providers
> (Genius/LRCLIB/lyrics.ovh) **only** to look up lyrics, with `credentials: omit`
> (no cookies). Nothing is stored on our side. We have no server.

---

## 6. Assets checklist (all in `store/out/`)

| Asset | Spec | File |
|---|---|---|
| Store icon | 128x128 PNG | `store-icon-128.png` (also `icons/icon128.png`) |
| Screenshot 1 (hero) | 1280x800 PNG | `screenshot-1-hero.png` |
| Screenshot 2 (sync) | 1280x800 PNG | `screenshot-2-sync.png` |
| Screenshot 3 (matching) | 1280x800 PNG | `screenshot-3-match.png` |
| Screenshot 4 (sources) | 1280x800 PNG | `screenshot-4-sources.png` |
| Screenshot 5 (features) | 1280x800 PNG | `screenshot-5-features.png` |
| Small promo tile | 440x280 PNG | `promo-small-440x280.png` |
| Marquee promo tile | 1400x560 PNG | `promo-marquee-1400x560.png` |

**Screenshot captions (optional, but boosts conversion):**
1. Lyrics for any YouTube song, instantly.
2. Karaoke-style line highlighting that follows the song.
3. Smart matching finds the right song, not just any match.
4. Three sources, one click: Genius, LRCLIB & lyrics.ovh.
5. Adjustable text, copy, and a clean dark UI.

---

## 7. Search-optimization (keywords woven into the description already)

`youtube lyrics`, `lyrics for youtube`, `synced lyrics`, `karaoke`, `song lyrics`,
`genius lyrics`, `lrclib`, `music lyrics`, `lyric viewer`, `sing along`.

> Tip: The store ranks heavily on the **item name** and **first 2 lines of the
> description**. Both lead with "lyrics" + "YouTube" on purpose.

---

## 8. Submission checklist

- [ ] Bump `version` in `manifest.json` for each new upload (already `1.1.0`).
- [ ] Run `npm run pack` (see README) to build `dist/lyriclens.zip`.
- [ ] Create item in the [Developer Dashboard](https://chrome.google.com/webstore/devconsole) ($5 one-time dev fee).
- [ ] Upload `dist/lyriclens.zip`.
- [ ] Paste fields from sections 1 to 5 above.
- [ ] Upload icon + 5 screenshots + 2 promo tiles from `store/out/`.
- [ ] Add a privacy policy URL (host `PRIVACY.md`).
- [ ] Set visibility (Public) and submit for review.

---

## 9. Growth notes (to gain traction)

- **Name is SEO.** "Lyrics for YouTube" in the title captures the highest-intent search.
- **First screenshot does the selling.** The hero shot leads. Keep it #1.
- **Ask for reviews** in a friendly post-install state later; star rating drives ranking.
- **Cross-post** a 15s screen recording to Reddit r/chrome, r/youtube, and Product Hunt.
- **Synced lyrics is the hook.** Lead with it in any post; few free YouTube lyric tools sync.
