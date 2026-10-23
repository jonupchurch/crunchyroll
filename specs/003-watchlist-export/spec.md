# Feature Specification: Export Watchlist for LLM Recommendations

**Feature Branch**: `003-watchlist-export`

**Created**: 2026-10-23

**Status**: Draft

**Input**: User description: "Watchlist export: an Export button on the Crunchyroll watchlist page that downloads the user's watchlist as a Markdown file (one table row per series: title, genres/categories, dub status from the existing EN DUB / no-en / no-dub logic, watch progress where the captured data has it) with a short header instruction asking an LLM to recommend similar titles available on Crunchyroll, excluding ones already listed. The user uploads the file to an LLM themselves; the extension never calls any external service. Watch history is out of scope (too large); watchlist only. Built from API responses the page hook already captures; no new auth-token handling."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Download my watchlist as a file (Priority: P1)

A viewer wants recommendations based on what they've saved. On the watchlist
page they click Export and get a Markdown file listing each series on their
watchlist, with a short instruction at the top. They drop the file into an LLM
chat and ask for recommendations; the instruction tells the LLM what to do.

**Why this priority**: This is the feature.

**Independent Test**: Open the watchlist, click Export, open the downloaded
file, and check every series shown on the page appears once with its title and
label.

**Acceptance Scenarios**:

1. **Given** the watchlist page has loaded, **When** the viewer clicks Export, **Then** a Markdown file downloads without leaving the page.
2. **Given** the file has downloaded, **When** the viewer opens it, **Then** it starts with a short instruction asking for recommendations of similar series available on Crunchyroll that aren't already listed, followed by a table with one row per series.
3. **Given** two watchlist entries belong to the same series, **When** the file is made, **Then** that series appears once.
4. **Given** the viewer uploads the file to an LLM with no other prompt, **When** the LLM replies, **Then** the reply is a list of recommendations (the instruction is enough on its own).

---

### User Story 2 - Richer rows (Priority: P2)

Each row carries the series' genres, its dub label, and how far the viewer has
got, so the LLM can weigh tastes and the viewer can ask for "English dubs
only" without editing the file.

**Why this priority**: Titles alone work; the extra columns make the
recommendations better but aren't required for a useful file.

**Independent Test**: Export, then compare a handful of rows against the
series pages and the cards on screen.

**Acceptance Scenarios**:

1. **Given** a series whose genres are known, **When** the file is made, **Then** its row lists them.
2. **Given** a series showing `EN DUB`, `no-en`, or `no-dub` on its card, **When** the file is made, **Then** its row shows the same label.
3. **Given** the captured data says whether the viewer has started or finished the episode the card points at, **When** the file is made, **Then** the row shows that progress.
4. **Given** any of these values is unknown for a series, **When** the file is made, **Then** that cell is blank and the row is still included.

---

### Edge Cases

- The watchlist is long and the page hasn't loaded every entry yet: the file contains what has loaded, and its header says how many series it holds so the viewer can tell if it's short. The extension does not fetch the rest itself.
- The watchlist is empty, or no watchlist data has been captured yet: Export does nothing harmful; the viewer is told there's nothing to export instead of getting an empty file.
- A title contains characters that would break a Markdown table (such as `|`): the row still renders as one row with the full title.
- The site's layout changes and there's nowhere to place the button: no button is shown, and badges and the rest of the page keep working.
- The viewer clicks Export twice: they get two downloads; nothing breaks.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: On the watchlist page, the extension MUST show an Export control near the top of the list.
- **FR-002**: Activating it MUST download a Markdown file to the viewer's computer, named so it's identifiable as a watchlist export and includes the date.
- **FR-003**: The file MUST open with a short instruction asking the reader to recommend series available on Crunchyroll that resemble the listed ones, excluding series already listed, with a brief reason for each.
- **FR-004**: The file MUST state how many series it contains and the date it was made.
- **FR-005**: The file MUST contain a table with one row per distinct series on the watchlist, with columns for title, genres, dub label, and progress.
- **FR-006**: The dub label MUST match what the badge feature shows for that series (`EN DUB`, `no-en`, `no-dub`, or blank when unknown).
- **FR-007**: Unknown values MUST leave the cell blank rather than drop the row.
- **FR-008**: Titles and other values MUST be written so they can't break the table layout.
- **FR-009**: The file MUST NOT include account details (email, account name, profile, or any identifier) — only series information and progress.
- **FR-010**: The extension MUST NOT send the file or its contents anywhere, and MUST NOT make requests of its own to build it.
- **FR-011**: With nothing to export, the extension MUST tell the viewer so instead of downloading an empty file.
- **FR-012**: The control MUST be operable by keyboard and labelled for assistive technology.
- **FR-013**: If export fails, the site, badges, and filter MUST keep working.

### Key Entities

- **Watchlist entry**: A series the viewer has saved, as shown on the watchlist page. Several entries can point at the same series.
- **Export row**: One series: title, genres, dub label, progress.
- **Export file**: The instruction, a count and date, and the rows.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every series visible on the watchlist page appears exactly once in the file, checked on a watchlist of at least 20 series.
- **SC-002**: Export takes one click and the download starts within one second.
- **SC-003**: Dub labels in the file match the cards on screen for every row checked.
- **SC-004**: Uploading the file alone to a mainstream LLM chat produces a recommendation list on the first try, without the viewer writing a prompt.
- **SC-005**: The file contains no account-identifying information.

## Assumptions

- Depends on the badge feature (`001-english-dub-badge`) for dub labels and on the existing capture of watchlist responses.
- Watch history is out of scope: too large and not yet captured.
- Markdown only. CSV and spreadsheet formats are out for this version.
- Genres and progress depend on what the captured watchlist data contains; this hasn't been checked on the live site yet. If genres aren't in the captured data, the column stays blank rather than the extension fetching them.
- Progress means what the data says about the episode each card points at (not started, in progress, finished). Series-level completion is out.
- The instruction text is fixed in this version; the viewer edits the file if they want something different.
- No sorting or filtering of the export, and no "copy to clipboard" in this version.
