"use client";

import "@maily-to/core/style.css";
import "./editor-overrides.css";

import { useMemo, useRef } from "react";
import { Editor as MailyEditor } from "@maily-to/core";
import {
  blockquote,
  bulletList,
  button,
  divider,
  heading1,
  heading2,
  heading3,
  orderedList,
  spacer,
  text,
} from "@maily-to/core/blocks";
import type { BlockGroupItem, BlockItem } from "@maily-to/core/blocks";
import type { Editor as TiptapEditor, JSONContent } from "@tiptap/core";
import { FileText, Sparkles } from "lucide-react";

import { AiPromptNode } from "./ai-prompt-extension";
import { DEMO_FORM_URL } from "@/components/forms-page";

interface EmailEditorProps {
  value?: JSONContent;
  onChange?: (json: JSONContent) => void;
  placeholder?: string;
}

const aiPromptBlock: BlockItem = {
  title: "AI content",
  description: "Generate content per recipient at send time",
  searchTerms: ["ai", "generate", "prompt", "personalize"],
  icon: (
    <Sparkles className="w-[15px] h-[15px] text-indigo-600" />
  ),
  command: ({ editor, range }) => {
    editor.chain().focus().deleteRange(range).insertAiPrompt().run();
  },
};

const formLinkBlock: BlockItem = {
  title: "Form link",
  description: "Insert a link to a Qollabi form",
  searchTerms: ["form", "link", "survey", "questionnaire"],
  icon: <FileText className="w-[15px] h-[15px] text-brand" />,
  command: ({ editor, range }) => {
    editor
      .chain()
      .focus()
      .deleteRange(range)
      .insertContent([
        {
          type: "text",
          marks: [{ type: "link", attrs: { href: DEMO_FORM_URL, target: "_blank" } }],
          text: "Open form",
        },
        { type: "text", text: " " },
      ])
      .run();
  },
};

export function EmailEditor({ value, onChange, placeholder }: EmailEditorProps) {
  const editorRef = useRef<TiptapEditor | null>(null);

  const blocks: BlockGroupItem[] = useMemo(
    () => [
      {
        title: "AI",
        commands: [aiPromptBlock],
      },
      {
        title: "Forms",
        commands: [formLinkBlock],
      },
      {
        title: "Text",
        commands: [text, heading1, heading2, heading3, blockquote, bulletList, orderedList],
      },
      {
        title: "Layout",
        commands: [divider, spacer, button],
      },
    ],
    [],
  );

  const extensions = useMemo(() => [AiPromptNode], []);

  const handleUpdate = (editor: TiptapEditor) => {
    editorRef.current = editor;
    onChange?.(editor.getJSON());
  };

  const handleCreate = (editor: TiptapEditor) => {
    editorRef.current = editor;
  };

  return (
    <div className="qollabi-email-editor rounded-md border border-border bg-white">
      <MailyEditor
        key={placeholder /* remount when placeholder/context swaps */}
        contentJson={value}
        extensions={extensions}
        blocks={blocks}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        config={{
          hasMenuBar: false,
          spellCheck: true,
          wrapClassName: "qollabi-editor-wrap",
          contentClassName: "qollabi-editor-content",
          bodyClassName: "qollabi-editor-body",
          immediatelyRender: false,
        }}
      />
    </div>
  );
}
