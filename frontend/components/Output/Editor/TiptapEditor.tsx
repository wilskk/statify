"use client";

import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import { EditorContent, useEditor, BubbleMenu, FloatingMenu } from "@tiptap/react";
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

const TiptapEditableView: React.FC<Omit<SimpleRichTextEditorProps, 'editable'>> = ({
  value,
  onChange,
  onSave,
  placeholder = "Tulis deskripsi statistik di sini…",
  id,
  className,
}) => {
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
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "<p></p>", false);
    }
  }, [value, editor]);

  const buttonClass = (active: boolean) =>
    cn(
      "px-1.5 py-0.5 text-sm rounded-sm hover:bg-muted/70",
      active && "bg-primary text-primary-foreground"
    );

  const MenuBar: React.FC = () => {
    if (!editor) return null;
    return (
      <div className="flex flex-wrap gap-1 border rounded mb-2 p-1 bg-muted/50">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={buttonClass(editor.isActive("bold"))}>B</button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={buttonClass(editor.isActive("italic"))}>I</button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={buttonClass(editor.isActive("strike"))}>S</button>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={buttonClass(editor.isActive("bulletList"))}>•</button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={buttonClass(editor.isActive("orderedList"))}>1.</button>
        <button type="button" onClick={() => editor.chain().focus().undo().run()} className={buttonClass(false)}>↺</button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()} className={buttonClass(false)}>↻</button>
      </div>
    );
  };

  if (!editor) {
    return (
      <div id={id} className={cn("border rounded-md p-2 min-h-[120px] bg-background text-sm text-muted-foreground", className)}>
        Memuat editor…
      </div>
    );
  }

  return (
    <div id={id} className={cn("space-y-2", className)}>
      <MenuBar />
      <EditorContent editor={editor} className="border rounded-md p-2 bg-background" />
      {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }} className="bubble-menu flex gap-1 bg-muted/80 p-1 rounded shadow">
          <button onClick={() => editor.chain().focus().toggleBold().run()} className={buttonClass(editor.isActive("bold"))}>B</button>
          <button onClick={() => editor.chain().focus().toggleItalic().run()} className={buttonClass(editor.isActive("italic"))}>I</button>
          <button onClick={() => editor.chain().focus().toggleStrike().run()} className={buttonClass(editor.isActive("strike"))}>S</button>
        </BubbleMenu>
      )}
      {editor && (
        <FloatingMenu editor={editor} tippyOptions={{ duration: 100 }} className="floating-menu flex gap-1 bg-muted/80 p-1 rounded shadow">
          <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={buttonClass(editor.isActive("heading", { level: 1 }))}>H1</button>
          <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={buttonClass(editor.isActive("heading", { level: 2 }))}>H2</button>
          <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={buttonClass(editor.isActive("bulletList"))}>•</button>
        </FloatingMenu>
      )}
      {onSave && (
        <div className="flex justify-end">
          <button type="button" onClick={onSave} className="px-3 py-1 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            Simpan
          </button>
        </div>
      )}
    </div>
  );
};

const SimpleRichTextEditor: React.FC<SimpleRichTextEditorProps> = (props) => {
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
};


export default SimpleRichTextEditor;
