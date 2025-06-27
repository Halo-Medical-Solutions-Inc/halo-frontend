import React, { useEffect, useState, useRef } from "react";
import { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
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

// Custom ResizableImage component
const ResizableImageComponent = ({ node, updateAttributes }: any) => {
  const [isResizing, setIsResizing] = useState(false);
  const [imageSize, setImageSize] = useState({
    width: node.attrs.width || 'auto',
    height: node.attrs.height || 'auto'
  });
  const imageRef = useRef<HTMLImageElement>(null);
  const startSize = useRef({ width: 0, height: 0 });
  const startPos = useRef({ x: 0, y: 0 });
  const aspectRatio = useRef(1);
  const isResizingRef = useRef(false);

  useEffect(() => {
    if (node.attrs.width) {
      setImageSize({
        width: node.attrs.width,
        height: node.attrs.height || 'auto'
      });
    }
  }, [node.attrs.width, node.attrs.height]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;

      const deltaX = e.clientX - startPos.current.x;
      const newWidth = Math.max(50, startSize.current.width + deltaX);
      const newHeight = newWidth / aspectRatio.current;

      setImageSize({
        width: `${newWidth}px`,
        height: `${newHeight}px`
      });
    };

    const handleMouseUp = () => {
      if (!isResizingRef.current) return;
      
      isResizingRef.current = false;
      setIsResizing(false);
      
      // Update the node attributes with final size
      updateAttributes({
        width: imageSize.width,
        height: imageSize.height
      });
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, imageSize.width, imageSize.height, updateAttributes]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    isResizingRef.current = true;
    
    if (imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      startSize.current = { width: rect.width, height: rect.height };
      startPos.current = { x: e.clientX, y: e.clientY };
      aspectRatio.current = rect.width / rect.height;
    }
  };

  return (
    <NodeViewWrapper className="relative inline-block" contentEditable={false}>
      <img
        ref={imageRef}
        src={node.attrs.src}
        alt={node.attrs.alt || ''}
        style={{
          width: imageSize.width,
          height: imageSize.height,
          maxWidth: '100%',
          display: 'block'
        }}
        className={cn(
          "select-none",
          isResizing && "opacity-90"
        )}
        draggable={false}
      />
      <div
        className={cn(
          "absolute bottom-0 right-0 w-4 h-4 bg-primary rounded-tl-sm cursor-se-resize",
          "opacity-0 hover:opacity-100 transition-opacity",
          "group-hover:opacity-100",
          isResizing && "opacity-100"
        )}
        onMouseDown={handleMouseDown}
        style={{
          backgroundColor: 'rgb(59 130 246)', // blue-500
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="1.5" cy="6.5" r="1" fill="white"/>
            <circle cx="4" cy="6.5" r="1" fill="white"/>
            <circle cx="6.5" cy="6.5" r="1" fill="white"/>
            <circle cx="6.5" cy="4" r="1" fill="white"/>
            <circle cx="6.5" cy="1.5" r="1" fill="white"/>
          </svg>
        </div>
      </div>
    </NodeViewWrapper>
  );
};

// Custom Image extension with resize support
const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
      },
      height: {
        default: null,
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },
});

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

const IconButton = ({ icon: Icon, isActive = false, onClick, disabled = false }: { icon: LucideIcon; isActive?: boolean; onClick: () => void; disabled?: boolean }) => (
  <Button variant="ghost" size="icon" className={cn("h-6 w-6", isActive && "bg-muted")} onClick={onClick} disabled={disabled}>
    <Icon className="h-4 w-4" />
  </Button>
);

// Add image compression utility
const compressImage = (file: File, maxWidth: number = 800, maxHeight: number = 800, quality: number = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new window.Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Use better image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64 with compression
        const compressedBase64 = canvas.toDataURL(file.type || 'image/jpeg', quality);
        
        // Check if the compressed image is still too large (> 500KB)
        const base64Size = compressedBase64.length * 0.75; // Approximate size in bytes
        if (base64Size > 500 * 1024) {
          // Try with lower quality
          const lowerQuality = canvas.toDataURL('image/jpeg', 0.6);
          resolve(lowerQuality);
        } else {
          resolve(compressedBase64);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
};

export function RichTextEditor({ content, onChange, minHeight = 100, placeholder }: RichTextEditorProps) {
  const [showImageInput, setShowImageInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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
      ResizableImage.configure({
        allowBase64: true,
        inline: true,
        HTMLAttributes: {
          class: 'rich-text-image',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;

        for (const item of items) {
          if (item.type.startsWith('image/')) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) {
              handleImageFile(file);
            }
            return true;
          }
        }
        return false;
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            event.preventDefault();
            handleImageFile(file);
            return true;
          }
        }
        return false;
      },
    },
  });

  useEffect(() => {
    // Update content if it changes externally
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const handleImageFile = async (file: File) => {
    if (!file || !editor) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image size must be less than 5MB");
      setTimeout(() => setUploadError(null), 3000);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError("Please select a valid image file");
      setTimeout(() => setUploadError(null), 3000);
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Compress the image
      const compressedBase64 = await compressImage(file);
      
      // Insert the compressed image
      editor
        .chain()
        .focus()
        .setImage({
          src: compressedBase64,
        })
        .run();

      setIsUploading(false);
      setShowImageInput(false);

      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error processing image:", error);
      setUploadError("Failed to process image. Please try again.");
      setTimeout(() => setUploadError(null), 3000);
      setIsUploading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageFile(file);
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
    <div className="rich-text-editor w-full border rounded-sm overflow-hidden group">
      <style jsx global>{`
        .rich-text-editor img {
          max-width: 100%;
          height: auto;
          display: inline-block;
          vertical-align: middle;
        }
        .rich-text-editor img[src^="data:"] {
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
        .ProseMirror img {
          cursor: default;
          margin: 4px 0;
        }
        .ProseMirror img.ProseMirror-selectednode {
          outline: 2px solid #68b3ff;
        }
        .rich-text-image {
          user-select: none;
          -webkit-user-drag: none;
        }
      `}</style>

      {uploadError && (
        <div className="bg-destructive/10 text-destructive text-xs p-2 border-b border-destructive/20">
          {uploadError}
        </div>
      )}

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
        <div className="relative">
          <IconButton 
            icon={ImageIcon} 
            onClick={handleImageButtonClick} 
            disabled={isUploading}
          />
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
              <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" 
          onChange={handleFileUpload} 
        />
      </div>

      <EditorContent editor={editor} className="p-2 min-h-[100px] focus-within:outline-none focus-within:ring-0" style={{ minHeight: `${minHeight}px` }} />
    </div>
  );
}
