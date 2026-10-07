# Feature Specification: English Dub Badge on Series Cards

**Feature Branch**: `001-english-dub-badge`

**Created**: 2026-10-07

**Status**: Draft

**Input**: User description: "English dub badge on series cards. On crunchyroll.com, wherever series cards appear (home, browse, search, watchlist), show a badge on a card only when that series has an English (en-US) audio version. No badge when it doesn't, and never list other audio languages. The badge must not break or noticeably slow the site, and must keep working as cards load in while scrolling or navigating. Badge placement (overlay on the poster vs. text beside the title) is not yet decided."

## Clarifications

### Session 2026-10-07

- Q: Where should the badge sit on a series card? → A: Overlaid on a corner of the poster image.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See at a glance which series have an English dub (Priority: P1)

A viewer who prefers English audio is browsing the catalog. Today they have to
open each series to find out whether it has an English dub. With the extension
installed, every series card that has an English audio version carries a badge,
so they can tell from the grid alone.

**Why this priority**: This is the whole feature. Without it there is nothing
to ship.

**Independent Test**: Open the browse page with the extension installed, pick
ten cards, and compare each card's badge (present or absent) against the audio
options listed on that series' own page.

**Acceptance Scenarios**:

1. **Given** a series that has an English audio version, **When** its card is shown on the browse page, **Then** the card shows the English dub badge.
2. **Given** a series with no English audio version, **When** its card is shown, **Then** the card shows no badge and looks exactly as it does without the extension.
3. **Given** a series whose original audio is English, **When** its card is shown, **Then** the card shows the badge (it has English audio).
4. **Given** a series with audio in several languages including English, **When** its card is shown, **Then** only the single English badge appears; no other languages are listed.

---

### User Story 2 - Badges on every page that shows series cards (Priority: P2)

The viewer finds series in more places than the browse page: the home page
rows, search results, and their watchlist. The badge behaves the same on all
of them.

**Why this priority**: Browse alone is useful, but a badge that appears in one
place and not another makes its absence meaningless elsewhere.

**Independent Test**: Find one series known to have an English dub and one
known not to, and check both on the home page, in search results, and in the
watchlist.

**Acceptance Scenarios**:

1. **Given** a series with an English audio version, **When** its card appears on the home page, in search results, or in the watchlist, **Then** it shows the badge.
2. **Given** a series with no English audio version, **When** its card appears on any of those pages, **Then** it shows no badge.

---

### User Story 3 - Badges keep up as the page changes (Priority: P3)

The site loads more cards as the viewer scrolls and swaps pages without a full
reload. Badges appear on newly loaded cards and stay correct after moving
between pages, with no refresh needed.

**Why this priority**: Without this the feature only works on the first screen
of the first page visited.

**Independent Test**: Scroll the browse page until several new batches of
cards load, then move to search and back, checking badges at each step without
reloading the tab.

**Acceptance Scenarios**:

1. **Given** the browse page is open, **When** the viewer scrolls and more cards load, **Then** the new cards get badges by the same rule as the first ones.
2. **Given** the viewer has moved from one page to another inside the site, **When** the new page's cards appear, **Then** they are badged correctly without a reload.
3. **Given** a card already has a badge, **When** the page re-renders or the viewer navigates away and back, **Then** the card has exactly one badge, never duplicates.

---

### Edge Cases

- Audio information for a series isn't known yet, or can't be obtained: no badge is shown. A missing badge is acceptable; a wrong badge is not.
- The same series appears in several places on one page (e.g. two home page rows): every instance is badged the same way.
- The site changes its layout so cards can't be recognised: the extension shows nothing and the site keeps working normally.
- A page has hundreds of cards after long scrolling: badging stays unobtrusive and scrolling stays smooth.
- The viewer is signed out or on a free account: badges still follow the same rule wherever the catalog is visible.
- English audio exists for only some seasons of a series: the series still counts as having an English audio version.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The extension MUST show an English dub badge on a series card when, and only when, that series has an English (en-US) audio version.
- **FR-002**: The extension MUST NOT show any badge, placeholder, or other marker on cards for series without an English audio version.
- **FR-003**: The extension MUST NOT list or indicate any audio language other than English.
- **FR-004**: The badge MUST apply on every page that shows series cards: home, browse, search results, and watchlist.
- **FR-005**: The badge MUST appear on cards that load after the initial page view (scrolling, in-site navigation) without a page reload.
- **FR-006**: A card MUST never carry more than one badge.
- **FR-007**: When the extension can't determine a series' audio languages, it MUST show no badge for that series.
- **FR-008**: The extension MUST NOT change, block, or delay the site's own behaviour; if any part of the extension fails, the site MUST work exactly as it does without it.
- **FR-009**: The badge MUST be overlaid on a corner of the card's poster image, in the same corner on every card, and MUST NOT change the card's size or layout.
- **FR-010**: The badge MUST be readable against any poster artwork or page background and MUST carry a text alternative saying an English dub is available.
- **FR-011**: The badge MUST NOT cover the card's title or interfere with clicking or hovering the card.

### Key Entities

- **Series**: A show or film listing in the catalog. Has a set of audio versions, each in one language.
- **Audio version**: One language track of a series. The only one that matters here is English (en-US).
- **Series card**: The tile representing a series on a page. One series can have several cards on screen at once.
- **Badge**: The marker added to a card to say the series has an English audio version.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a spot check of 50 cards across home, browse, search, and watchlist, every badge (and every absence of one) matches the audio options on the series' own page.
- **SC-002**: Zero cards for series without English audio show a badge.
- **SC-003**: Badges appear within 1 second of a card becoming visible in at least 95% of cases.
- **SC-004**: A viewer can tell whether a visible series has an English dub without opening it.
- **SC-005**: Page loading and scrolling feel no different with the extension on than with it off, including after scrolling through 500+ cards.
- **SC-006**: The site shows no new errors or broken behaviour attributable to the extension across a 15-minute browsing session.

## Assumptions

- "Series card" means a tile for a series or film listing. Episode tiles (e.g. Continue Watching, episode lists) are out of scope.
- "English" means the en-US audio locale only; other English variants, if they ever appear, are not counted.
- A series counts as having English audio if any of its seasons does.
- The series' own page (hero/detail view) is out of scope; it already shows audio options.
- Which poster corner is a design detail for planning: whichever one doesn't collide with the site's own poster overlays.
- The badge is a single fixed label; no settings, toggles, or other languages in this feature.
- Filtering or sorting the catalog by dub availability is out of scope.
- Target browser is Edge on desktop; other Chromium browsers are expected to work but aren't verified.
- The feature depends on the site's own undocumented catalog data, which can change without notice; when it does, the expected failure is "no badges", not a broken site.
