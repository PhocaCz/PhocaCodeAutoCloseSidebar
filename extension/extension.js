/**
 * Phoca Auto Close Sidebar
 * Automatically closes the sidebar whenever you work in the editor: opening a
 * file (single or double click), switching to an open file, closing a tab or
 * clicking into the text.
 *
 * Copyright (C) 2026 Jan Pavelka - Phoca
 * https://github.com/PhocaCz/PhocaCodeAutoCloseSidebar
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 2 only,
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * SPDX-License-Identifier: GPL-2.0-only
 */
const vscode = require('vscode');

const STARTUP_GRACE_MS = 3000;   // ignore restored tabs at startup
const NEW_TAB_WINDOW_MS = 400;   // a tab opened this recently is "new", not "already open"

const DEFAULTS = {
    onSingleClickOpen: false,
    onDoubleClickOpen: true,
    onSwitchToOpenFile: true,
    onCloseTab: true,
    onEditorClick: true,
    delay: 0,
    debug: false
};

const PREVIEW_REPLACE_WINDOW_MS = 150; // closed + opened this close together = a preview tab being replaced

function setting(name) {
    return vscode.workspace.getConfiguration('autoCloseSidebar').get(name, DEFAULTS[name]);
}

function delayMs() {
    const value = setting('delay');
    return Number.isFinite(value) && value > 0 ? value : 0;
}

function uriKey(tab) {
    const input = tab.input;
    return input && input.uri ? input.uri.toString() : null;
}

function activate(context) {
    const startedAt = Date.now();
    const recentlyOpened = new Map(); // uri -> timestamp
    const previews = new Set();       // uris currently shown in a preview tab
    let openKeys = new Set();
    let timer;
    let pendingClose;
    let lastOpenedAt = 0;
    let output;

    function log(message) {
        if (!setting('debug')) return;
        if (!output) output = vscode.window.createOutputChannel('Phoca Auto Close Sidebar');
        output.appendLine(new Date().toISOString().slice(11, 23) + '  ' + message);
    }

    function refreshOpenKeys() {
        openKeys = new Set();
        for (const group of vscode.window.tabGroups.all) {
            for (const tab of group.tabs) {
                const key = uriKey(tab);
                if (key) openKeys.add(key);
                if (key && tab.isPreview) previews.add(key);
            }
        }
    }
    refreshOpenKeys();

    function runClose() {
        timer = undefined;
        vscode.commands.executeCommand('workbench.action.closeSidebar');
    }

    // delay > 0: close later (lets a double click reach the Explorer first)
    function closeSidebar(delay, reason) {
        if (Date.now() - startedAt < STARTUP_GRACE_MS) return;
        log('close (' + reason + (delay > 0 ? ', delay ' + delay + ' ms' : '') + ')');
        if (timer) clearTimeout(timer);
        if (delay > 0) {
            timer = setTimeout(runClose, delay);
        } else {
            runClose();
        }
    }

    context.subscriptions.push(
        { dispose: () => { if (timer) clearTimeout(timer); if (pendingClose) clearTimeout(pendingClose); if (output) output.dispose(); } },

        vscode.window.tabGroups.onDidChangeTabs(e => {
            const now = Date.now();
            let closeNow = false;
            let closeDelayed = false;

            if (e.opened.length > 0) {
                lastOpenedAt = now;
                if (pendingClose) { clearTimeout(pendingClose); pendingClose = undefined; }
            }

            for (const tab of e.opened) {
                const key = uriKey(tab);
                if (!key) continue;
                recentlyOpened.set(key, now);
                if (tab.isPreview) {
                    previews.add(key);
                    if (setting('onSingleClickOpen')) closeDelayed = true;
                } else if (setting('onDoubleClickOpen')) {
                    closeNow = true; // opened straight as a permanent tab
                }
            }

            for (const tab of e.changed) {
                const key = uriKey(tab);
                if (!key) continue;
                if (tab.isPreview) {
                    previews.add(key);
                } else if (previews.has(key)) {
                    previews.delete(key); // preview tab became permanent
                    if (setting('onDoubleClickOpen')) closeNow = true;
                }
            }

            let closedPreview = false;
            let closedOther = false;
            for (const tab of e.closed) {
                const key = uriKey(tab);
                if (tab.isPreview || (key && previews.has(key))) closedPreview = true;
                else closedOther = true;
                if (key) previews.delete(key);
            }

            log('tabs: opened=' + e.opened.length + ' changed=' + e.changed.length + ' closed=' + e.closed.length +
                (e.opened[0] ? ' preview=' + e.opened[0].isPreview : ''));

            // A tab was closed by the user. Opening another file in preview closes the old preview tab
            // as a side effect; that must not count, so a closed preview tab is only acted on if no
            // new tab opens right around it.
            let closeTabNow = false;
            if (e.closed.length > 0 && e.opened.length === 0 && setting('onCloseTab')) {
                if (closedPreview && !closedOther) {
                    if (now - lastOpenedAt >= PREVIEW_REPLACE_WINDOW_MS) {
                        if (pendingClose) clearTimeout(pendingClose);
                        pendingClose = setTimeout(() => {
                            pendingClose = undefined;
                            closeSidebar(0, 'close tab');
                        }, PREVIEW_REPLACE_WINDOW_MS);
                    }
                } else {
                    closeTabNow = true;
                }
            }

            refreshOpenKeys();

            if (closeNow) closeSidebar(0, 'file became permanent tab');
            else if (closeTabNow) closeSidebar(0, 'close tab');
            else if (closeDelayed) closeSidebar(delayMs(), 'file opened in preview');
        }),

        // The editor switched to a file that was already open.
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (!editor || !setting('onSwitchToOpenFile')) return;
            const key = editor.document.uri.toString();
            const openedAt = recentlyOpened.get(key);
            const isNewTab = openedAt !== undefined && Date.now() - openedAt < NEW_TAB_WINDOW_MS;
            log('active editor changed: new=' + isNewTab + ' alreadyOpen=' + openKeys.has(key));
            if (!isNewTab && openKeys.has(key)) closeSidebar(delayMs(), 'switch to open file');
        }),

        // Mouse click inside the text editor.
        vscode.window.onDidChangeTextEditorSelection(e => {
            if (e.kind !== vscode.TextEditorSelectionChangeKind.Mouse) return;
            if (e.textEditor !== vscode.window.activeTextEditor) return;
            if (setting('onEditorClick')) closeSidebar(0, 'click in editor');
        })
    );
}

function deactivate() {}

module.exports = { activate, deactivate };
