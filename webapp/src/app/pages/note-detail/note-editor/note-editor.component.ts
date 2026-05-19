import {
    AfterViewInit,
    Component,
    ElementRef,
    OnChanges,
    OnDestroy,
    SimpleChanges,
    ViewChild,
    input,
    output,
    signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import {
    $getRoot,
    $getSelection,
    $isRangeSelection,
    createEditor,
    FORMAT_TEXT_COMMAND,
    LexicalEditor,
    KEY_TAB_COMMAND,
    INDENT_CONTENT_COMMAND,
    OUTDENT_CONTENT_COMMAND,
    SELECTION_CHANGE_COMMAND,
    COMMAND_PRIORITY_LOW,
} from 'lexical';
import {
    $createHeadingNode,
    $isHeadingNode,
    HeadingNode,
    QuoteNode,
    registerRichText,
} from '@lexical/rich-text';
import {
    INSERT_UNORDERED_LIST_COMMAND,
    ListItemNode,
    ListNode,
    registerList,
} from '@lexical/list';
import { $getNearestNodeOfType } from '@lexical/utils';
import { LinkNode } from '@lexical/link';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { $setBlocksType } from '@lexical/selection';
import { registerHistory, createEmptyHistoryState } from '@lexical/history';
import {
    $convertFromMarkdownString,
    registerMarkdownShortcuts,
    TRANSFORMERS,
} from '@lexical/markdown';

/**
 * Lexical-based rich text editor for notes. Emits contentJson (serialized
 * Lexical editor state) and contentText (plain text projection) on change.
 */
@Component({
    selector: 'app-note-editor',
    imports: [CommonModule, NzButtonModule, NzIconModule],
    templateUrl: './note-editor.component.html',
    styleUrl: './note-editor.component.less',
})
export class NoteEditorComponent implements AfterViewInit, OnChanges, OnDestroy {
    initialContentJson = input<string>('');
    readonly = input<boolean>(false);
    contentChange = output<{ contentJson: string; contentText: string }>();

    @ViewChild('editorRoot', { static: true }) editorRootRef!: ElementRef<HTMLDivElement>;

    private editor: LexicalEditor | null = null;
    private unregisterFns: Array<() => void> = [];
    private isInitialized = false;

    private toolbarStateSignal = signal<{
        bold: boolean;
        italic: boolean;
        code: boolean;
        heading: boolean;
        list: boolean;
    }>({
        bold: false,
        italic: false,
        code: false,
        heading: false,
        list: false,
    });
    readonly toolbarState = this.toolbarStateSignal.asReadonly();

    ngAfterViewInit(): void {
        this.editor = createEditor({
            namespace: 'note-editor',
            nodes: [
                HeadingNode,
                QuoteNode,
                ListNode,
                ListItemNode,
                LinkNode,
                CodeNode,
                CodeHighlightNode,
            ],
            theme: {
                paragraph: 'editor-paragraph',
                heading: {
                    h1: 'editor-h1',
                    h2: 'editor-h2',
                    h3: 'editor-h3',
                },
                list: {
                    ul: 'editor-ul',
                    ol: 'editor-ol',
                    listitem: 'editor-li',
                },
                text: {
                    bold: 'editor-bold',
                    italic: 'editor-italic',
                    code: 'editor-code-inline',
                },
                code: 'editor-code-block',
                quote: 'editor-quote',
                link: 'editor-link',
            },
            onError: (err) => console.error('[Lexical]', err),
        });

        this.editor.setRootElement(this.editorRootRef.nativeElement);
        this.editor.setEditable(!this.readonly());

        this.unregisterFns.push(registerRichText(this.editor));
        this.unregisterFns.push(registerList(this.editor));
        this.unregisterFns.push(
            registerHistory(this.editor, createEmptyHistoryState(), 300),
        );
        this.unregisterFns.push(
            registerMarkdownShortcuts(this.editor, TRANSFORMERS),
        );
        this.unregisterFns.push(this.registerTabHandler());
        this.unregisterFns.push(
            this.editor.registerCommand(
                SELECTION_CHANGE_COMMAND,
                () => {
                    this.updateToolbarState();
                    return false;
                },
                COMMAND_PRIORITY_LOW,
            ),
        );

        this.loadInitialContent(this.initialContentJson() ?? '');

        this.unregisterFns.push(
            this.editor.registerUpdateListener(({ editorState }) => {
                editorState.read(() => this.computeToolbarState());
                if (!this.isInitialized) return;
                const contentJson = JSON.stringify(editorState.toJSON());
                let contentText = '';
                editorState.read(() => {
                    contentText = $getRoot().getTextContent();
                });
                this.contentChange.emit({ contentJson, contentText });
            }),
        );

        this.isInitialized = true;
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (!this.editor) return;
        if (changes['readonly']) {
            this.editor.setEditable(!this.readonly());
        }
    }

    ngOnDestroy(): void {
        this.unregisterFns.forEach((fn) => fn());
        this.unregisterFns = [];
        this.editor = null;
    }

    onClickBold(): void {
        this.editor?.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
    }

    onClickItalic(): void {
        this.editor?.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
    }

    onClickCode(): void {
        this.editor?.dispatchCommand(FORMAT_TEXT_COMMAND, 'code');
    }

    onClickHeading(): void {
        this.editor?.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                $setBlocksType(selection, () => $createHeadingNode('h2'));
            }
        });
    }

    onClickList(): void {
        this.editor?.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    }

    private loadInitialContent(raw: string): void {
        if (!this.editor) return;
        const trimmed = (raw ?? '').trim();

        if (!trimmed) {
            return;
        }

        // Try Lexical JSON first; fall back to treating value as markdown source
        // (notes created before the Lexical editor stored raw markdown here).
        try {
            const parsed = JSON.parse(trimmed);
            if (parsed && parsed.root) {
                const state = this.editor.parseEditorState(trimmed);
                this.editor.setEditorState(state);
                return;
            }
        } catch {
            // not JSON — fall through to markdown import
        }

        this.editor.update(() => {
            $convertFromMarkdownString(raw, TRANSFORMERS);
        });
    }

    /**
     * Register a Tab/Shift+Tab handler that only intercepts the key when the
     * selection is inside a list item. Outside lists, returns false so other
     * handlers (and the browser) can decide.
     */
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

    /**
     * Recompute toolbar active flags from the current selection. Must be
     * called inside an editorState.read() / editor.update() context.
     */
    private computeToolbarState(): void {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
            this.toolbarStateSignal.set({
                bold: false,
                italic: false,
                code: false,
                heading: false,
                list: false,
            });
            return;
        }
        const anchorNode = selection.anchor.getNode();
        const headingAncestor =
            $isHeadingNode(anchorNode) ? anchorNode : $getNearestNodeOfType(anchorNode, HeadingNode);
        const listAncestor = $getNearestNodeOfType(anchorNode, ListNode);
        this.toolbarStateSignal.set({
            bold: selection.hasFormat('bold'),
            italic: selection.hasFormat('italic'),
            code: selection.hasFormat('code'),
            heading: !!headingAncestor,
            list: !!listAncestor,
        });
    }

    private updateToolbarState(): void {
        this.editor?.getEditorState().read(() => this.computeToolbarState());
    }
}
