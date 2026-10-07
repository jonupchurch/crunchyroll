# Changelog

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Manifest V3 extension skeleton with a fetch hook that captures Crunchyroll
  catalog API responses and forwards them to the content script.
- ai-tools toolkit and Spec-Kit engine for planning.
- Spec and implementation plan for the English dub badge
  (`specs/001-english-dub-badge/`).
- `EN DUB` badge on series cards whose series has English audio, built from
  the card data the site already loads. Unit tests via `npm test`.
- Red `no-en` tag on cards whose series is dubbed but not in English, and a
  black `no-dub` label on subtitled-only series. `EN DUB` is green.
- Spec for filtering browse cards by label (`specs/002-label-filter/`).
- Smaller badge on narrow posters so it doesn't swamp the thumbnail.

### Changed

- The content script now runs at `document_start` so early responses aren't
  missed.
