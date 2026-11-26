# Phoca Auto Close Sidebar

Automatically closes the VS Code sidebar (Explorer, Search, ...) whenever you start working in the editor, so the code gets the full width.

## Features

- Closes the sidebar after a double click on a file (single click optional)
- Closes it when you switch to a file that is already open
- Closes it when you close a tab
- Closes it when you click with the mouse inside the text editor
- Every behavior is a separate setting and can be switched off on its own
- Optional delay, so a double click still works when the single click closes the sidebar
- Debug log that tells you which trigger closed the sidebar

## Settings

| Setting | Default | Closes the sidebar when... |
| --- | --- | --- |
| `autoCloseSidebar.onSingleClickOpen` | off | a file opens in a preview tab (single click in the Explorer) |
| `autoCloseSidebar.onDoubleClickOpen` | on | a file becomes a permanent tab (double click in the Explorer) |
| `autoCloseSidebar.onSwitchToOpenFile` | on | the editor switches to a file that is already open |
| `autoCloseSidebar.onCloseTab` | on | you close a tab |
| `autoCloseSidebar.onEditorClick` | on | you click with the mouse inside the text editor |
| `autoCloseSidebar.delay` | 0 | (not a trigger) milliseconds to wait before closing after a single-click open or a switch |
| `autoCloseSidebar.debug` | off | (not a trigger) log events and the reason for every close to Output > Phoca Auto Close Sidebar |

```json
{
  "autoCloseSidebar.onSingleClickOpen": true,
  "autoCloseSidebar.onDoubleClickOpen": false,
  "autoCloseSidebar.delay": 400
}
```

## Single click vs. double click

VS Code does not report mouse clicks to extensions. The extension reads the tab that a click produces instead: a single click opens a *preview* tab (italic title), a double click turns it into a *permanent* tab. That is why the two settings are separate.

- By default only the double click closes the sidebar, so you can browse files with single clicks.
- If you enable `onSingleClickOpen`, the sidebar would close before a double click can happen. Use `delay` (for example 400) to leave time for the second click.
- If you changed `workbench.list.openMode` to `doubleClick`, the double click is what opens the preview.

## Notes and limitations

- Already open files: VS Code cannot tell a single from a double click when you switch to an open file, so `onSwitchToOpenFile` reacts to both. Turn it off if you want strictly double-click behavior.
- VS Code does not tell extensions where a file was opened from. The sidebar also closes when you open a file through `Ctrl+P` or from the Search view.
- Clicking the file that is already active in the Explorer changes nothing in the editor, so VS Code reports no event. Click once inside the text (`onEditorClick`) to close the sidebar.
- Closing the active tab makes VS Code switch to another tab, which counts as a switch for `onSwitchToOpenFile`.
- Tabs restored while VS Code starts are ignored for the first few seconds.
- The extension has to listen to editor events, so it starts together with VS Code (`onStartupFinished`) and cannot be activated lazily.

## Compatibility

Requires VS Code 1.70 or newer. The extension uses only the standard extension API, so it should also work in VS Code-based editors such as VSCodium.

## Links

- Source and issues: <https://github.com/PhocaCz/PhocaCodeAutoCloseSidebar>
- Phoca: <https://www.phoca.cz>

## License

Copyright (C) 2026 Jan Pavelka - Phoca

Licensed under the GNU General Public License version 2 only (GPL-2.0-only). See [LICENSE.txt](https://github.com/PhocaCz/PhocaCodeAutoCloseSidebar/blob/HEAD/LICENSE.txt).

Source: <https://github.com/PhocaCz/PhocaCodeAutoCloseSidebar>
