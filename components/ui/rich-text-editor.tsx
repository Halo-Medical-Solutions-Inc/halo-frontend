import React, { useEffect, useState, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bold, Italic, Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify, ImageIcon, Upload, type LucideIcon, Type, Heading1, PaintBucket, Highlighter } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  minHeight?: number;
  placeholder?: string;
}

// Font sizes in px
const fontSizes = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72];

// Font families
const fontFamilies = [
  { name: "Default", value: "Inter, system-ui, sans-serif" },
  { name: "Arial", value: "Arial, sans-serif" },
  { name: "Comic Sans MS", value: '"Comic Sans MS", cursive' },
  { name: "Courier New", value: '"Courier New", monospace' },
  { name: "Georgia", value: "Georgia, serif" },
  { name: "Helvetica", value: "Helvetica, sans-serif" },
  { name: "Times New Roman", value: '"Times New Roman", serif' },
  { name: "Verdana", value: "Verdana, sans-serif" },
];

// Text colors
const textColors = [
  { name: "Black", value: "#000000" },
  { name: "Gray", value: "#888888" },
  { name: "Red", value: "#ff0000" },
  { name: "Orange", value: "#ff8800" },
  { name: "Yellow", value: "#ffff00" },
  { name: "Green", value: "#00ff00" },
  { name: "Blue", value: "#0000ff" },
  { name: "Purple", value: "#8800ff" },
];

// Highlight colors
const highlightColors = [
  { name: "Yellow", value: "#ffff00" },
  { name: "Lime", value: "#00ff00" },
  { name: "Cyan", value: "#00ffff" },
  { name: "Pink", value: "#ff00ff" },
  { name: "Orange", value: "#ff8800" },
  { name: "Sky Blue", value: "#88ddff" },
  { name: "Light Gray", value: "#eeeeee" },
];

const ColorButton = ({ onClick, color }: { onClick: () => void; color: string }) => (
  <Button variant="ghost" size="icon" className="h-6 w-6 p-0" onClick={onClick}>
    <div className="h-4 w-4 rounded-sm" style={{ backgroundColor: color }} />
  </Button>
);

const IconButton = ({ icon: Icon, isActive = false, onClick }: { icon: LucideIcon; isActive?: boolean; onClick: () => void }) => (
  <Button variant="ghost" size="icon" className={cn("h-6 w-6", isActive && "bg-muted")} onClick={onClick}>
    <Icon className="h-4 w-4" />
  </Button>
);

export function RichTextEditor({ content, onChange, minHeight = 100, placeholder }: RichTextEditorProps) {
  const [showImageInput, setShowImageInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      FontFamily,
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Image.configure({
        allowBase64: true,
        inline: true,
        HTMLAttributes: {
          style: "max-width: 100%;",
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    // Update content if it changes externally
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editor) {
      setIsUploading(true);

      // Convert the file to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        // Insert the image with wrapper div
        const imageSrc = reader.result as string;
        editor
          .chain()
          .focus()
          .setImage({
            src: imageSrc,
          })
          .run();

        // Apply wrapper or styling via editor extension configuration
        setIsUploading(false);
        setShowImageInput(false);

        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      };

      reader.onerror = () => {
        console.error("Error reading file");
        setIsUploading(false);
      };

      reader.readAsDataURL(file);
    }
  };

  const handleImageButtonClick = () => {
    triggerFileInput();
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const setFontSize = (size: number) => {
    if (editor) {
      editor.chain().focus().run();
      // Apply font size via inline style since we don't have the extension
      const { view } = editor;
      const { state } = view;
      const { from, to } = state.selection;

      if (from !== to) {
        // If text is selected, wrap it in a span with font-size style
        const text = state.doc.textBetween(from, to);
        const html = `<span style="font-size: ${size}px">${text}</span>`;
        editor.commands.deleteRange({ from, to });
        editor.commands.insertContent(html);
      } else {
        // If no text is selected, insert a span that will style what user types next
        editor.commands.insertContent(`<span style="font-size: ${size}px">${placeholder ? "" : " "}</span>`);
      }
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="rich-text-editor w-full border rounded-sm overflow-hidden">
      <style jsx global>{`
        .rich-text-editor img {
          max-width: 100%;
          height: auto;
        }
        .ProseMirror {
          outline: none !important;
        }
        .ProseMirror:focus {
          outline: none !important;
          box-shadow: none !important;
          ring: 0 !important;
        }
      `}</style>

      <div className="bg-muted/30 p-1 border-b flex flex-wrap gap-1 items-center">
        {/* Font Family */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Type className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Font Family</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {fontFamilies.map((font) => (
              <DropdownMenuItem key={font.name} onClick={() => editor.chain().focus().setFontFamily(font.value).run()} style={{ fontFamily: font.value }}>
                {font.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Font Size */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Heading1 className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Font Size</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {fontSizes.map((size) => (
              <DropdownMenuItem key={size} onClick={() => setFontSize(size)}>
                {size}px
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Text Color */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <PaintBucket className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Text Color</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="grid grid-cols-4 gap-1 p-1">
              {textColors.map((color) => (
                <ColorButton key={color.value} color={color.value} onClick={() => editor.chain().focus().setColor(color.value).run()} />
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Highlight Color */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Highlighter className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Highlight Color</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="grid grid-cols-4 gap-1 p-1">
              {highlightColors.map((color) => (
                <ColorButton key={color.value} color={color.value} onClick={() => editor.chain().focus().toggleHighlight({ color: color.value }).run()} />
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-5 w-px bg-border mx-1" />

        {/* Basic Formatting */}
        <IconButton icon={Bold} isActive={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} />
        <IconButton icon={Italic} isActive={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} />
        <IconButton icon={UnderlineIcon} isActive={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} />

        <div className="h-5 w-px bg-border mx-1" />

        {/* Text Alignment */}
        <IconButton icon={AlignLeft} isActive={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} />
        <IconButton icon={AlignCenter} isActive={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} />
        <IconButton icon={AlignRight} isActive={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} />
        <IconButton icon={AlignJustify} isActive={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()} />

        <div className="h-5 w-px bg-border mx-1" />

        {/* Image */}
        <IconButton icon={ImageIcon} onClick={handleImageButtonClick} />
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
      </div>

      <EditorContent editor={editor} className="p-2 min-h-[100px] focus-within:outline-none focus-within:ring-0" style={{ minHeight: `${minHeight}px` }} />
    </div>
  );
}
