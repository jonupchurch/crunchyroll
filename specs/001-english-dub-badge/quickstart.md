# Quickstart: Validating the English Dub Badge

## Prerequisites

- Node 22+ (tests only)
- Edge with the extension loaded unpacked (see the README)
- A Crunchyroll account, for the watchlist check

## 1. Unit tests

```sh
npm test
```

Expected: all tests pass. Covers indexing (see
[data-model.md](data-model.md)) and href parsing (see
[contracts/internal-interfaces.md](contracts/internal-interfaces.md)).

## 2. Browse page (User Story 1)

1. Reload the extension, open `crunchyroll.com/videos/popular`.
2. Frieren: Beyond Journey's End shows an `EN DUB` pill on its poster.
3. Pick a card with no pill, open the series, and confirm it has no dub.
   Pick a card with a red `no-en` tag and confirm its audio options include
   a dub but no English.
4. Pick five more cards at random and check each against its series page.
5. Hover and click a badged card: hover state and navigation behave as usual.

## 3. Scrolling and navigation (User Story 3)

1. Scroll until at least three more batches of cards load. New cards get pills
   by the same rule; scrolling stays smooth.
2. Search for a series, then go back to browse without reloading. Pills are
   right on both, and no card has two.

## 4. Other pages (User Story 2)

Check one known-dubbed and one known-undubbed series on the home page, in
search results, and in the watchlist.

## 5. Failure behaviour

1. With DevTools open, confirm the console shows no errors from the extension
   during a few minutes of browsing.
2. Disable the extension and reload: the site looks identical apart from the
   pills being gone.
