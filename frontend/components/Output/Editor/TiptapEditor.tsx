"use client";

import React, { useEffect, memo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { EditorContent, useEditor, BubbleMenu, FloatingMenu, useEditorState, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import ListItem from "@tiptap/extension-list-item";

interface SimpleRichTextEditorProps {
  /** Current HTML value of the editor */
  value: string;
  /** Called whenever the editor content changes */
  onChange: (value: string) => void;
  /** Set to true to allow editing, otherwise the editor is rendered in read-only mode */
  editable?: boolean;
  /** Optional save handler. When provided, a primary Save button will appear */
  onSave?: () => void;
  /** Placeholder text when the editor is empty */
  placeholder?: string;
  /** Optional id for accessibility / testing purposes */
  id?: string;
  /** Optional additional className */
  className?: string;
}

// Memisahkan MenuBar ke komponen terpisah dan menggunakan memo
const MenuBar = memo(({ editor, editorState }: { editor: Editor | null, editorState: any }) => {
  if (!editor || !editorState) return null;
  
  const buttonClass = (active: boolean) =>
    cn(
      "px-1.5 py-0.5 text-sm rounded-sm hover:bg-muted/70",
      active && "bg-primary text-primary-foreground"
    );
    
  return (
    <div className="flex flex-wrap gap-1 border rounded mb-2 p-1 bg-muted/50">
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editorState.canToggleBold} className={buttonClass(editorState.isBold)}>
        Bold
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editorState.canToggleItalic} className={buttonClass(editorState.isItalic)}>
        Italic
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} disabled={!editorState.canToggleStrike} className={buttonClass(editorState.isStrike)}>
        Strike
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleCode().run()} disabled={!editorState.canToggleCode} className={buttonClass(editorState.isCode)}>
        Code
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={buttonClass(editorState.isH2)}>
        H2
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={buttonClass(editorState.isH3)}>
        H3
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={buttonClass(editorState.isBulletList)}>
        Bullet list
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={buttonClass(editorState.isOrderedList)}>
        Ordered list
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={buttonClass(editorState.isBlockquote)}>
        Blockquote
      </button>
      <button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editorState.canUndo}>
        Undo
      </button>
      <button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editorState.canRedo}>
        Redo
      </button>
    </div>
  );
});

MenuBar.displayName = "MenuBar";

// Memisahkan BubbleMenuComponent ke komponen terpisah
const BubbleMenuComponent = memo(({ editor }: { editor: Editor }) => {
  const buttonClass = (active: boolean) =>
    cn(
      "px-1.5 py-0.5 text-sm rounded-sm hover:bg-muted/70",
      active && "bg-primary text-primary-foreground"
    );
    
  return (
    <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }} className="bubble-menu flex gap-1 bg-muted/80 p-1 rounded shadow">
      <button onClick={() => editor.chain().focus().toggleBold().run()} className={buttonClass(editor.isActive("bold"))}>B</button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} className={buttonClass(editor.isActive("italic"))}>I</button>
      <button onClick={() => editor.chain().focus().toggleStrike().run()} className={buttonClass(editor.isActive("strike"))}>S</button>
    </BubbleMenu>
  );
});

BubbleMenuComponent.displayName = "BubbleMenuComponent";

// Memisahkan FloatingMenuComponent ke komponen terpisah
const FloatingMenuComponent = memo(({ editor }: { editor: Editor }) => {
  const buttonClass = (active: boolean) =>
    cn(
      "px-1.5 py-0.5 text-sm rounded-sm hover:bg-muted/70",
      active && "bg-primary text-primary-foreground"
    );
    
  return (
    <FloatingMenu editor={editor} tippyOptions={{ duration: 100 }} className="floating-menu flex gap-1 bg-muted/80 p-1 rounded shadow">
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={buttonClass(editor.isActive("heading", { level: 1 }))}>H1</button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={buttonClass(editor.isActive("heading", { level: 2 }))}>H2</button>
      <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={buttonClass(editor.isActive("bulletList"))}>•</button>
    </FloatingMenu>
  );
});

FloatingMenuComponent.displayName = "FloatingMenuComponent";

// Memisahkan SaveButton ke komponen terpisah
const SaveButton = memo(({ onSave }: { onSave: () => void }) => {
  return (
    <div className="flex justify-end">
      <button type="button" onClick={onSave} className="px-3 py-1 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
        Simpan
      </button>
    </div>
  );
});

SaveButton.displayName = "SaveButton";

const TiptapEditableView: React.FC<Omit<SimpleRichTextEditorProps, 'editable'>> = memo(({
  value,
  onChange,
  onSave,
  placeholder = "Tulis deskripsi statistik di sini…",
  id,
  className,
}) => {
  // Menggunakan useCallback untuk mencegah fungsi dibuat ulang pada setiap render
  const handleUpdate = useCallback(({ editor }: { editor: Editor }) => {
    onChange(editor.getHTML());
  }, [onChange]);

  const editor = useEditor({
    extensions: [
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight,
      StarterKit.configure({
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "<p></p>",
    shouldRerenderOnTransaction: false,
    onUpdate: handleUpdate,
  });

  const editorState = useEditorState({
    editor,
    selector: (state) => {
      const { editor } = state;
      if (!editor) {
        return {
          isBold: false, isItalic: false, isStrike: false, isCode: false,
          isH2: false, isH3: false, isBulletList: false, isOrderedList: false, isBlockquote: false,
          canToggleBold: false, canToggleItalic: false, canToggleStrike: false, canToggleCode: false,
          canUndo: false, canRedo: false,
        };
      }
      return {
        isBold: editor.isActive("bold"),
        isItalic: editor.isActive("italic"),
        isStrike: editor.isActive("strike"),
        isCode: editor.isActive("code"),
        isH2: editor.isActive("heading", { level: 2 }),
        isH3: editor.isActive("heading", { level: 3 }),
        isBulletList: editor.isActive("bulletList"),
        isOrderedList: editor.isActive("orderedList"),
        isBlockquote: editor.isActive("blockquote"),
        canToggleBold: editor.can().chain().focus().toggleBold().run(),
        canToggleItalic: editor.can().chain().focus().toggleItalic().run(),
        canToggleStrike: editor.can().chain().focus().toggleStrike().run(),
        canToggleCode: editor.can().chain().focus().toggleCode().run(),
        canUndo: editor.can().chain().focus().undo().run(),
        canRedo: editor.can().chain().focus().redo().run(),
      };
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "<p></p>", false);
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div id={id} className={cn("border rounded-md p-2 min-h-[120px] bg-background text-sm text-muted-foreground", className)}>
        Memuat editor…
      </div>
    );
  }

  return (
    <div id={id} className={cn("space-y-2", className)}>
      <MenuBar editor={editor} editorState={editorState} />
      <EditorContent editor={editor} className="border rounded-md p-2 bg-background" />
      {editor && <BubbleMenuComponent editor={editor} />}
      {editor && <FloatingMenuComponent editor={editor} />}
      {onSave && <SaveButton onSave={onSave} />}
    </div>
  );
});

TiptapEditableView.displayName = "TiptapEditableView";

const SimpleRichTextEditor: React.FC<SimpleRichTextEditorProps> = memo((props) => {
  const {
    editable = false,
    value,
    id,
    className,
  } = props;

  if (!editable) {
    return (
      <div
        id={id}
        className={cn("prose max-w-none", className)}
        dangerouslySetInnerHTML={{
          __html:
            value && value.trim() !== ""
              ? value
              : '<p class="text-muted-foreground">Tidak ada deskripsi.</p>',
        }}
      />
    );
  }

  return <TiptapEditableView {...props} />;
});

SimpleRichTextEditor.displayName = "SimpleRichTextEditor";

export default SimpleRichTextEditor;
