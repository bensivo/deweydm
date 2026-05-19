# Notes Editor Fixes

## Overview
The Lexical-based notes editor added in commit `d7f4827` ("feat: notes basic ui") has a handful of UX bugs. This plan addresses all of them with targeted changes to the existing `NoteEditorComponent` — no new files, no new dependencies.

## Issues to Fix
1. **List keyboard handling**: While inside a bulleted or numbered list, pressing `Enter` on an empty list item or `Shift+Tab` does not outdent / exit the list.
2. **Tab handling**: Pressing `Tab` inside the editor moves focus out of the contenteditable instead of indenting a list item.
3. **Toolbar active state**: The Bold / Italic / Heading / List / Code toolbar buttons never visually indicate whether the formatting is currently active at the caret.
4. **Line spacing**: Spacing between lines (paragraphs and list items) is visibly too large.

## Reference Files
- `webapp/src/app/pages/note-detail/note-editor/note-editor.component.ts` — editor wiring
- `webapp/src/app/pages/note-detail/note-editor/note-editor.component.html` — toolbar markup
- `webapp/src/app/pages/note-detail/note-editor/note-editor.component.less` — editor styles
- `docs/plans/notes-feature.md` — original feature plan
- `docs/style-guides/typescript-style-guide.md`, `less-style-guide.md`, `angular-codebase-design.md` — style rules to follow

## Style Guide Reminders
- TS: 4-space indent, single quotes, `camelCase`, `Signal` suffix for signals, `on`-prefixed event handlers, JSDoc for non-obvious functions.
- LESS: 4-space indent, Ant color tokens (`#1890ff`, `#d9d9d9`, etc.), spacing multiples of 4px, max 2–3 levels of nesting.
- Angular: components read state and emit events only; no business logic in templates; reactivity via Signals (no observables).

## Fix Details

### 1 & 2. List + Tab keyboard handling
Lexical's `@lexical/list` package ships commands and a `registerList()` helper that wires the correct keyboard behavior (Enter on empty list-item exits the list; Tab / Shift+Tab indent / outdent list items). The current editor registers `registerRichText` and `registerMarkdownShortcuts` but does **not** register the list plugin, so Lexical's default rich-text behavior takes over and `Tab` falls through to the browser (moving focus).

Changes in `note-editor.component.ts`:
- Import `registerList`, `INSERT_ORDERED_LIST_COMMAND` (already present: `INSERT_UNORDERED_LIST_COMMAND`), and the list node imports already present.
- After `registerRichText(...)`, push `registerList(this.editor)` onto `unregisterFns`.
- Add a keyboard handler registered via `editor.registerCommand(KEY_TAB_COMMAND, ...)` that:
  - On `Tab`: dispatches `INDENT_CONTENT_COMMAND` and calls `event.preventDefault()` — but only when the selection is inside a `ListItemNode`. Otherwise, let it fall through (no preventDefault) so non-list Tab still does whatever the user expects.
  - On `Shift+Tab`: dispatches `OUTDENT_CONTENT_COMMAND` with preventDefault, again only inside a list item.
- `registerList` already handles the `Enter`-on-empty-list-item exit behavior, so no extra wiring needed for that.

Imports to add:
```ts
import { registerList, INSERT_ORDERED_LIST_COMMAND } from '@lexical/list';
import {
    KEY_TAB_COMMAND,
    INDENT_CONTENT_COMMAND,
    OUTDENT_CONTENT_COMMAND,
    COMMAND_PRIORITY_LOW,
    $getSelection,
    $isRangeSelection,
} from 'lexical';
import { $getNearestNodeOfType } from '@lexical/utils';
import { ListItemNode } from '@lexical/list';
```

Note: `@lexical/utils` is already a transitive dep of the lexical packages installed in the last commit — no new package needs to be added.

New helper inside the component:
```ts
private registerTabHandler(): () => void {
    return this.editor!.registerCommand(
        KEY_TAB_COMMAND,
        (event: KeyboardEvent) => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) return false;
            const anchorNode = selection.anchor.getNode();
            const listItem = $getNearestNodeOfType(anchorNode, ListItemNode);
            if (!listItem) return false;
            event.preventDefault();
            this.editor!.dispatchCommand(
                event.shiftKey ? OUTDENT_CONTENT_COMMAND : INDENT_CONTENT_COMMAND,
                undefined,
            );
            return true;
        },
        COMMAND_PRIORITY_LOW,
    );
}
```
Push its return into `unregisterFns` from `ngAfterViewInit`.

### 3. Toolbar active state
The toolbar currently has no notion of caret-context. Add a signal-backed state object that tracks which formats are active at the current selection and reflect it on the `nz-button` via `[nzType]` ('primary' when active, 'default' otherwise) plus an `active` CSS class for non-color affordances.

Changes in `note-editor.component.ts`:
- Add a private signal `toolbarStateSignal = signal<{ bold: boolean; italic: boolean; code: boolean; heading: boolean; list: boolean }>({...all false})`.
- Expose readonly `toolbarState = this.toolbarStateSignal.asReadonly()`.
- Register `editor.registerUpdateListener(...)` (or extend the existing one) to compute current selection state in `editorState.read(() => {...})`:
  - `bold = selection.hasFormat('bold')`, etc.
  - `heading = nearest block is HeadingNode`.
  - `list = nearest ancestor of type ListNode exists`.
  - Call `this.toolbarStateSignal.set(...)` with the computed object.
- Also call this on `SELECTION_CHANGE_COMMAND` via `editor.registerCommand(SELECTION_CHANGE_COMMAND, ...)` so the toolbar updates as the caret moves without typing.

Changes in `note-editor.component.html`:
- Bind each button's `[nzType]` to `toolbarState().bold ? 'primary' : 'default'` (etc.), and add `[class.active]="toolbarState().bold"` for an additional visual hook.

Changes in `note-editor.component.less`:
- Optional `.note-editor-toolbar button.active { background-color: #e6f4ff; border-color: #1890ff; color: #1890ff; }` for clarity beyond the nz-primary blue, matching the Ant active-background token.

### 4. Line spacing
The `.editor-paragraph` and list margins are 8px bottom plus `line-height: 1.6` on the container, which compounds into visible gaps. Tighten:

Changes in `note-editor.component.less`:
- `.note-editor-content { line-height: 1.5; }` (down from 1.6).
- `.editor-paragraph { margin: 0; }` (remove the 8px bottom margin).
- `.editor-ul`, `.editor-ol`: `margin: 0 0 4px 0;` (down from 8px).
- `.editor-li`: add `margin: 0;` to ensure list items don't inherit paragraph spacing from rich-text defaults.
- Headings: keep top/bottom but trim to half — `.editor-h1 { margin: 8px 0 4px 0; }`, h2/h3 likewise scaled.

## File Change Summary

### Edited files
- `webapp/src/app/pages/note-detail/note-editor/note-editor.component.ts`
  - Add list plugin registration (`registerList`).
  - Add Tab / Shift+Tab command handler scoped to list items.
  - Add `toolbarStateSignal` and update it from update + selection-change listeners.
- `webapp/src/app/pages/note-detail/note-editor/note-editor.component.html`
  - Bind `[nzType]` and `[class.active]` on each toolbar button to the corresponding `toolbarState()` flag.
- `webapp/src/app/pages/note-detail/note-editor/note-editor.component.less`
  - Reduce `line-height` and per-block margins.
  - Add `.active` style for toolbar buttons.

### New files
None.

### New dependencies
None. All required APIs come from `lexical`, `@lexical/list`, and `@lexical/utils`, which are already installed.

## Manual Test Plan
- Create a new note. In a bulleted list, press `Enter` on an empty bullet: caret should exit the list back to a paragraph.
- In a nested bullet, press `Shift+Tab`: should outdent one level; another `Shift+Tab` from the top level should exit the list.
- Press `Tab` inside a bullet: should indent. Press `Tab` outside a list: focus should NOT leave the editor (selection is in a paragraph — Tab is a no-op, command handler returns false, browser default also a no-op since we're in a contenteditable). If the no-op-default still steals focus, extend the handler to `preventDefault()` unconditionally inside the editor.
- Toggle Bold / Italic / Code with caret in formatted vs unformatted text — toolbar button should reflect state.
- Place caret in a heading vs paragraph — heading button reflects state. Same for list.
- Type several paragraphs and a list — vertical spacing should look noticeably tighter and consistent with Ant typography.

## Out of Scope
- Auto-save behavior.
- Markdown import/export UI.
- Additional toolbar buttons (underline, strikethrough, links, ordered-list toggle button) — note that `INSERT_ORDERED_LIST_COMMAND` is imported here only because the active-state detection looks at any list ancestor; adding an ordered-list toolbar button is a separate enhancement.
