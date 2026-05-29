# Contributing to LyricLens

Thanks for your interest in improving LyricLens. Contributions of all sizes are
welcome, from typo fixes to new lyrics providers.

## Getting started

1. Fork and clone the repo.
2. Load the extension unpacked:
   - Open `chrome://extensions`
   - Enable **Developer mode**
   - **Load unpacked** and select the repo folder
3. Make your changes, then click the reload icon on the extension card to test.

There is no build step for the extension itself. It is plain HTML, CSS, and
JavaScript (Manifest V3) with no runtime dependencies.

## Project layout

| Path | What it is |
|---|---|
| `popup.html` / `popup.css` / `popup.js` | The entire extension UI and logic |
| `manifest.json` | MV3 manifest (permissions, action, host permissions) |
| `icons/` | Toolbar icons, generated from the logo |
| `store/` | Marketing assets, the asset renderer, and the Web Store listing kit |
| `scripts/pack.js` | Builds `dist/lyriclens.zip` for upload |

## How lyrics matching works

`popup.js` reads the active YouTube tab's title and channel, cleans the title,
then queries providers and scores results in `scoreResult` by title and artist
token overlap. The provider chain is Genius, then LRCLIB, then lyrics.ovh, with
LRCLIB preferred on YouTube tabs when it has time-synced lyrics.

## Adding a lyrics provider

1. Write an async `provideX(target)` that returns
   `{ title, artist, url?, lyrics, synced?, source }` or `null`.
2. Reuse `scoreResult` so you only return confident matches.
3. Add its host to `host_permissions` in `manifest.json`.
4. Slot it into the provider chain in `run()`.

## Pull requests

- Keep changes focused; one logical change per PR.
- Match the existing code style (no framework, no new runtime dependencies
  without discussion).
- Run `node --check popup.js` before pushing.
- If you change the UI, include a before/after screenshot.
- If you change matching logic, mention the songs you tested it against.

## Reporting bugs

Open an issue with:
- The YouTube URL or video title.
- What lyrics it showed vs. what you expected.
- Whether sync was involved.

## License

By contributing, you agree that your contributions are licensed under the
project's [MIT License](LICENSE).
