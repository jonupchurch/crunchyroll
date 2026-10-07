# Feature Specification: Filter Browse Cards by Dub Label

**Feature Branch**: `002-label-filter`

**Created**: 2026-10-07

**Status**: Draft

**Input**: User description: "would it be possible to add filtering at the top of the browse pages that lets me filter out or show only the ones I want to?"

## Clarifications

### Session 2026-10-07

- Q: What form should the control take? → A: Three toggle chips, one per label (`EN DUB`, `no-en`, `no-dub`), beside the site's own sort and filter controls. Proposed with a dropdown as the alternative; no objection raised.
- Q: Which pages? → A: Browse-style grids only for the first version. The watchlist is out: its list has fixed row positions, so hiding cards would leave holes.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Hide the cards I don't care about (Priority: P1)

A viewer who only watches English dubs is on a browse page. The cards are
already labelled, but they still have to scan past everything else. They switch
off `no-en` and `no-dub` at the top of the page and the grid shows only
`EN DUB` cards, closed up with no gaps.

**Why this priority**: This is the feature.

**Independent Test**: On a browse page with a mix of labels, switch each chip
off and on and check that exactly the cards with that label disappear and
return.

**Acceptance Scenarios**:

1. **Given** a browse page with all three chips on, **When** the viewer switches `no-dub` off, **Then** every card labelled `no-dub` disappears and the remaining cards close up.
2. **Given** `no-dub` is off, **When** the viewer switches it back on, **Then** those cards reappear in their original order.
3. **Given** only `EN DUB` is on, **When** the page shows cards, **Then** only `EN DUB` cards and cards with no label are visible.
4. **Given** all three chips are off, **When** the page shows cards, **Then** only cards with no label remain, and the chips stay available to switch back on.

---

### User Story 2 - The filter keeps applying (Priority: P2)

The viewer scrolls, more cards load, and they move to another browse page. The
filter keeps applying without being set again.

**Why this priority**: A filter that resets on every scroll or page is more
work than not having one.

**Independent Test**: Switch a chip off, scroll until new cards load, move to
another browse page, then close and reopen the tab.

**Acceptance Scenarios**:

1. **Given** a chip is off, **When** more cards load while scrolling, **Then** new cards with that label are hidden as they arrive.
2. **Given** a chip is off, **When** the viewer goes to another browse page or reloads, **Then** the chip is still off and the filter is applied.
3. **Given** a chip is off, **When** a card's label only becomes known after it is on screen, **Then** the card is hidden once the label is known.

---

### Edge Cases

- A card the extension has no data for (no label): always shown. Hiding something the viewer can't see a reason for would look like a bug.
- The filter leaves very few cards on screen: the page keeps working, and more matching cards appear as the site loads further batches. The extension does not fetch anything itself.
- The site's own sort/filter controls can't be found (layout change): no chips are shown, nothing is hidden, and badges still work.
- The viewer applies the site's own filter or sort while a chip is off: the chip filter applies to whatever cards the site then shows.
- Pages without a card grid of this kind (home rows, watchlist, series pages): no chips and nothing hidden, even if a chip was switched off elsewhere.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: On browse pages, the extension MUST show three toggle controls, one each for `EN DUB`, `no-en`, and `no-dub`, next to the site's own sort and filter controls.
- **FR-002**: All three MUST be on the first time; switching one off MUST hide every card carrying that label, and switching it on MUST show them again.
- **FR-003**: Hidden cards MUST leave no gap; remaining cards keep their original order.
- **FR-004**: Cards with no label MUST never be hidden.
- **FR-005**: The filter MUST apply to cards that load or get labelled after it was set, without further action.
- **FR-006**: The chosen on/off state MUST persist across browse pages, reloads, and browser restarts.
- **FR-007**: Each control MUST show clearly whether it is on or off, be operable by keyboard, and expose its state to assistive technology.
- **FR-008**: The extension MUST NOT hide anything on pages where the controls are not shown.
- **FR-009**: The extension MUST NOT make requests of its own or alter the site's requests to satisfy a filter.
- **FR-010**: If any part of the filter fails, the site and the badges MUST keep working as they do without it.

### Key Entities

- **Label**: One of `EN DUB`, `no-en`, `no-dub`, as already shown on a card by the badge feature.
- **Filter setting**: For each label, whether cards with it are shown. Belongs to the viewer's browser, not their account.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: With one chip off, zero visible cards on a browse page carry that label, checked across at least 100 loaded cards.
- **SC-002**: Switching a chip takes one click and the grid updates within half a second.
- **SC-003**: The chip state survives a reload and a move between browse pages in every attempt.
- **SC-004**: No labelled card is hidden while its chip is on, and no unlabelled card is ever hidden.
- **SC-005**: Scrolling a filtered page feels no different from an unfiltered one.

## Assumptions

- Depends on the badge feature (`001-english-dub-badge`) for labels.
- "Browse pages" means pages with the site's own sort/filter controls above a card grid (e.g. `/videos/popular`).
- Watchlist, home page rows, and search results are out of scope for this version.
- The setting is stored in the browser only; it does not sync to the viewer's account.
- No "hidden N cards" counter, no per-language filtering, and no reordering in this version.
- Filtering works on what the site has loaded. A heavily filtered page may need more scrolling to fill.
