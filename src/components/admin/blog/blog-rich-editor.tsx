"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Maximize2,
  Minimize2,
  Quote,
  Redo2,
  Undo2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { countWords, estimateReadingTime } from "@/components/admin/blog/blog-utils";

type BlogRichEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  onSelectionChange?: (text: string, rect: DOMRect | null) => void;
};

function ToolbarButton({
  active,
  onClick,
  children,
  label,
  hint,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  label: string;
  hint?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={onClick}
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
            active && "bg-muted text-foreground",
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{label}</p>
        {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
      </TooltipContent>
    </Tooltip>
  );
}

function EditorToolbar({ editor, fullscreen, onToggleFullscreen }: {
  editor: Editor;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
}) {
  function setLink() {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL do link", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  return (
    <TooltipProvider delayDuration={300}>
    <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/30 px-2 py-1.5">
      <ToolbarButton label="Negrito" hint="Ctrl+B" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="Itálico" hint="Ctrl+I" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="Link" active={editor.isActive("link")} onClick={setLink}>
        <Link2 className="h-4 w-4" />
      </ToolbarButton>
      <div className="mx-1 h-5 w-px bg-border" />
      <ToolbarButton label="Título H2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="Título H3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        <Heading3 className="h-4 w-4" />
      </ToolbarButton>
      <div className="mx-1 h-5 w-px bg-border" />
      <ToolbarButton label="Lista" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="Lista numerada" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="Citação" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="Código" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
        <Code className="h-4 w-4" />
      </ToolbarButton>
      <div className="mx-1 h-5 w-px bg-border" />
      <ToolbarButton label="Desfazer" hint="Ctrl+Z" onClick={() => editor.chain().focus().undo().run()}>
        <Undo2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton label="Refazer" hint="Ctrl+Shift+Z" onClick={() => editor.chain().focus().redo().run()}>
        <Redo2 className="h-4 w-4" />
      </ToolbarButton>
      <div className="ml-auto">
        <ToolbarButton label={fullscreen ? "Sair da tela cheia" : "Tela cheia"} hint="Esc para sair" onClick={onToggleFullscreen}>
          {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </ToolbarButton>
      </div>
    </div>
    </TooltipProvider>
  );
}

export function BlogRichEditor({
  value,
  onChange,
  placeholder = "Escreva o conteúdo do post…",
  className,
  onSelectionChange,
}: BlogRichEditorProps) {
  const [fullscreen, setFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-primary underline" } }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-[280px] px-4 py-3 focus:outline-none dark:prose-invert",
      },
    },
    onUpdate: ({ editor: ed }) => onChange(ed.getHTML()),
    onSelectionUpdate: ({ editor: ed }) => {
      if (!onSelectionChange) return;
      const { from, to } = ed.state.selection;
      if (from === to) {
        onSelectionChange("", null);
        return;
      }
      const text = ed.state.doc.textBetween(from, to, " ");
      const coords = ed.view.coordsAtPos(from);
      onSelectionChange(text, new DOMRect(coords.left, coords.top, 0, coords.bottom - coords.top));
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current && value !== editor.getText()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [editor, value]);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen]);

  const words = countWords(value);
  const readingTime = estimateReadingTime(value);

  if (!editor) return null;

  return (
    <div
      ref={containerRef}
      className={cn(
        "overflow-hidden rounded-lg border bg-background",
        fullscreen && "fixed inset-4 z-50 flex flex-col shadow-2xl",
        className,
      )}
    >
      <EditorToolbar editor={editor} fullscreen={fullscreen} onToggleFullscreen={() => setFullscreen((f) => !f)} />
      <div className={cn("overflow-y-auto", fullscreen && "flex-1")}>
        <EditorContent editor={editor} />
      </div>
      <div className="flex items-center justify-between border-t bg-muted/20 px-3 py-1.5 text-xs text-muted-foreground">
        <span>{words} palavras</span>
        <span>~{readingTime} min de leitura</span>
      </div>
    </div>
  );
}

export function useBlogEditorInsert() {
  return useCallback((editor: Editor | null, html: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(html).run();
  }, []);
}
