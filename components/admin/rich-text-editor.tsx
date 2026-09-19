"use client";

import ImageExtension from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Undo2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function RichTextEditor({
  value,
  onChange
}: {
  value?: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3]
        }
      }),
      ImageExtension.configure({ inline: false, allowBase64: false }),
      LinkExtension.configure({ openOnClick: false }),
      Placeholder.configure({
        placeholder: "从这里开始写作..."
      })
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "tiptap prose-content rounded-md border bg-background px-4 py-3 text-sm leading-relaxed focus:outline-none"
      }
    },
    onUpdate: ({ editor: activeEditor }) => {
      onChange(activeEditor.getHTML());
    }
  });

  if (!editor) {
    return (
      <div className="flex min-h-24 items-center justify-center rounded-md border text-sm text-muted-foreground">
        编辑器加载中
      </div>
    );
  }

  function addImage() {
    const url = window.prompt("图片地址");

    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }

  function addLink() {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("链接地址", previous || "https://");

    if (url === null) {
      return;
    }

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  const tools = [
    {
      label: "粗体",
      icon: Bold,
      active: editor.isActive("bold"),
      onClick: () => editor.chain().focus().toggleBold().run()
    },
    {
      label: "斜体",
      icon: Italic,
      active: editor.isActive("italic"),
      onClick: () => editor.chain().focus().toggleItalic().run()
    },
    {
      label: "二级标题",
      icon: Heading2,
      active: editor.isActive("heading", { level: 2 }),
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run()
    },
    {
      label: "三级标题",
      icon: Heading3,
      active: editor.isActive("heading", { level: 3 }),
      onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run()
    },
    {
      label: "无序列表",
      icon: List,
      active: editor.isActive("bulletList"),
      onClick: () => editor.chain().focus().toggleBulletList().run()
    },
    {
      label: "有序列表",
      icon: ListOrdered,
      active: editor.isActive("orderedList"),
      onClick: () => editor.chain().focus().toggleOrderedList().run()
    },
    {
      label: "引用",
      icon: Quote,
      active: editor.isActive("blockquote"),
      onClick: () => editor.chain().focus().toggleBlockquote().run()
    },
    {
      label: "代码块",
      icon: Code,
      active: editor.isActive("codeBlock"),
      onClick: () => editor.chain().focus().toggleCodeBlock().run()
    }
  ];

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-1 rounded-md border bg-muted/50 p-1">
        {tools.map((tool) => (
          <Button
            key={tool.label}
            type="button"
            variant={tool.active ? "secondary" : "ghost"}
            size="icon"
            className="size-8"
            aria-label={tool.label}
            title={tool.label}
            onClick={tool.onClick}
          >
            <tool.icon className="size-4" />
          </Button>
        ))}
        <span className="mx-1 hidden w-px bg-border sm:block" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label="插入图片"
          title="插入图片"
          onClick={addImage}
        >
          <ImageIcon className="size-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("link") ? "secondary" : "ghost"}
          size="icon"
          className="size-8"
          aria-label="插入链接"
          title="插入链接"
          onClick={addLink}
        >
          <LinkIcon className="size-4" />
        </Button>
        <span className="mx-1 hidden w-px bg-border sm:block" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label="撤销"
          title="撤销"
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label="重做"
          title="重做"
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 className="size-4" />
        </Button>
      </div>
      <div
        className={cn(
          "overflow-hidden rounded-lg border bg-background",
          editor.isFocused && "ring-2 ring-ring"
        )}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
