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
- Index of which series have English audio, built from captured responses,
  with unit tests (`npm test`).

### Changed

- The content script now runs at `document_start` so early responses aren't
  missed.
