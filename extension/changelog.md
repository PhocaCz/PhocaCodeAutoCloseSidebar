# Change Log

All notable changes to "Phoca Auto Close Sidebar" are documented in this file.

## [2.0.0] - 2026-11-26

- Renamed to "Phoca Auto Close Sidebar" (`phoca.auto-close-sidebar`, the extension ID stays the same).
- License changed from GPL-3.0-or-later to GPL-2.0-only, author set to Jan Pavelka (Phoca).
- Added icon, gallery banner, repository and homepage links.
- Settings are unchanged (`autoCloseSidebar.*`), existing configuration keeps working. They are now ordered in the Settings UI.
- The debug Output channel is named "Phoca Auto Close Sidebar".

## [1.2.1] - 2026-11-15

- Fix: opening a second file with a single click closed the sidebar, because the replaced preview tab counted as a closed tab.
- Added `autoCloseSidebar.debug` to log which trigger closed the sidebar.

## [1.2.0]

- `onOpenFile` replaced by `onSingleClickOpen` (default off) and `onDoubleClickOpen` (default on).
- `delay` now defaults to 0.

## [1.1.0]

- Added `autoCloseSidebar.delay` (default 500 ms) so a double click on a file in the Explorer works.

## [1.0.0]

- Initial release.
- Settings: `onOpenFile`, `onSwitchToOpenFile`, `onCloseTab`, `onEditorClick` (all on by default).
