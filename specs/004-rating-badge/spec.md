# Feature Specification: Rating Badge on Series Cards

**Feature Branch**: `004-rating-badge`

**Created**: 2026-10-23

**Status**: Draft

**Input**: User description: "what about adding the rating of each series in the upper left corner"

## Clarifications

### Session 2026-10-23

- Q: Which rating? → A: Both: the average star rating from Crunchyroll users and the maturity rating (TV-14, TV-MA, …). Offered with star-only and maturity-only as alternatives.
- Q: Season and episode counts too? → A: Yes (user request). Shown as a second line of the same badge (`2 seasons · 38 eps`) so the first line stays short enough to clear the dub label.
- Field names confirmed from a captured browse response: `rating.average` (string), `series_metadata.maturity_ratings`, `series_metadata.season_count`, `series_metadata.episode_count`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See how well-liked a series is at a glance (Priority: P1)

A viewer scanning a browse page wants to skip poorly rated shows without
opening each one. Each card shows the series' average star rating in its
upper-left corner, opposite the dub label.

**Why this priority**: The star rating is the part that helps choose what to
watch.

**Independent Test**: On a browse page, compare the star rating on several
cards against the rating shown on each series' own page.

**Acceptance Scenarios**:

1. **Given** a card whose series' star rating is known, **When** the card is on screen, **Then** its upper-left corner shows the average rating to one decimal place (e.g. `★4.8`).
2. **Given** a card whose series' star rating is not known, **When** the card is on screen, **Then** no star rating is shown (never a zero or a placeholder).
3. **Given** a card that is recycled to show a different series while scrolling, **When** it changes, **Then** the rating changes with it.

---

### User Story 2 - See the maturity rating too (Priority: P2)

Next to the star rating, the card shows the series' maturity rating, so a
viewer choosing something to watch with others can tell at a glance.

**Why this priority**: Useful, but secondary to the star rating for picking
shows.

**Independent Test**: Compare the maturity rating on several cards against
each series' own page.

**Acceptance Scenarios**:

1. **Given** a card whose series' maturity rating is known, **When** the card is on screen, **Then** the upper-left corner shows it alongside the star rating (e.g. `★4.8 · TV-14`).
2. **Given** only one of the two ratings is known, **When** the card is on screen, **Then** only that one is shown.
3. **Given** a series lists more than one maturity rating, **When** the card is on screen, **Then** only the strictest one is shown.

---

### Edge Cases

- A series with very few votes: the average is still shown; no vote count in this version.
- A narrow poster (search results): the rating gets the same compact treatment as the dub label and stays legible.
- The poster has the site's own marker in the upper-left corner: the rating must not hide anything the site shows there (to be checked on the live site; if it clashes, positioning is a plan decision).
- Pages where the rating data isn't part of what the site already loads: no rating is shown there rather than the extension fetching it, unless the plan finds a way that adds no visible slowdown (see Assumptions).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Series cards MUST show the series' average star rating, to one decimal place, in the poster's upper-left corner when it is known.
- **FR-002**: Cards MUST show the series' maturity rating in the same corner when it is known; when a series lists several, the strictest one is shown.
- **FR-002a**: Cards MUST show the series' season and episode counts on a second line of the same badge when known.
- **FR-003**: When none of these values is known, nothing MUST be shown in that corner.
- **FR-004**: The rating MUST always match the series the card currently shows, including after the site reuses cards while scrolling.
- **FR-005**: The rating MUST NOT cover the dub label, and the dub label and filter MUST keep working exactly as before.
- **FR-006**: The rating MUST be readable by assistive technology (e.g. "Rated 4.8 out of 5, TV-14").
- **FR-007**: If the rating feature fails, badges, filter, export, and the site MUST keep working.

### Key Entities

- **Star rating**: A series' average score from Crunchyroll users, out of 5.
- **Maturity rating**: A series' age classification as Crunchyroll lists it (e.g. TV-14).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On browse pages, at least 90% of cards show a star rating, checked across 50 cards.
- **SC-002**: Every rating checked (at least 10 series) matches the one on the series' own page.
- **SC-003**: No card ever shows a rating belonging to a different series, including after long scrolling.
- **SC-004**: Pages load and scroll no slower than without the feature.

## Assumptions

- Builds on the badge feature (`001-english-dub-badge`): same cards, same card-recycling handling; the dub label stays in the upper-right.
- Unverified on the live site: browse responses are believed to carry the star rating, and series data the maturity rating. Watchlist and home rows may not carry the star rating; there it is shown only if the plan finds the data without noticeable slowdown, otherwise those cards show maturity only.
- No vote counts, no colour-coding by score, and no filtering or sorting by rating in this version.
- Not added to the watchlist export in this version (worth doing, separately).
