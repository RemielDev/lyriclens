# Privacy Policy: LyricLens

_Last updated: 2026-05-28_

LyricLens is a browser extension that shows lyrics for the YouTube video you are
watching. Your privacy is simple to explain because **LyricLens has no server and
collects no personal data.**

## What LyricLens accesses

- **The title and channel of the active YouTube tab**, only when you click the
  extension icon. This is used to identify the song.
- **The video's current playback time**, only while the lyrics panel is open and
  synced highlighting is active, to follow along with the song.
- **Your preferred text size**, stored locally in your browser via
  `chrome.storage.local` so it persists between sessions.

## What LyricLens sends, and to whom

To find lyrics, LyricLens sends the song title or your search query to public
lyrics providers:

- Genius (`genius.com`)
- LRCLIB (`lrclib.net`)
- lyrics.ovh (`api.lyrics.ovh`)

These requests are made **without cookies** (`credentials: "omit"`) and contain
only the search text needed to look up the song. Those providers' own privacy
policies govern how they handle requests to their services.

## What LyricLens does NOT do

- No user accounts or sign-in.
- No analytics, telemetry, tracking pixels, or advertising.
- No collection, storage, or sale of personal data.
- No reading of any tab other than the active one, and only when you click the icon.
- No background activity. The extension only runs when you open the popup.

## Contact

Questions? Open an issue on the project repository or email the developer listed
on the Chrome Web Store listing.
