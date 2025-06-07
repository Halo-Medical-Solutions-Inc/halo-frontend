import * as React from "react";
import { cn } from "@/lib/utils";
import { ExpandingTextarea } from "./textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

interface FormattedTextareaProps extends React.ComponentProps<"textarea"> {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  minHeight?: number;
  maxHeight?: number;
}

const parseFormattedTextWithTooltips = (text: string): React.ReactNode => {
  if (!text) return null;
  const lines = text.split("\n");

  return lines.map((line, lineIndex) => {
    if (!line) return <br key={`line-${lineIndex}`} />;

    const parsedLine = parseLineRecursively(line, lineIndex, text, []);

    return (
      <React.Fragment key={`line-${lineIndex}`}>
        {parsedLine}
        {lineIndex < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
};

const parseLineRecursively = (text: string, lineIndex: number, fullText: string, appliedStyles: string[], startOffset: number = 0): React.ReactNode => {
  if (!text) return null;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  const regex = /(\*\*([^*]+?)\*\*)|(\/\/([^/]+?)\/\/)|(--([^-]+?)--)/;

  while (text.length > 0) {
    const match = text.match(regex);

    if (!match) {
      parts.push(text);
      break;
    }

    if (match.index! > 0) {
      parts.push(text.substring(0, match.index));
    }

    let formattedContent: React.ReactNode;
    let innerText: string;
    let newStyle: string;

    if (match[1]) {
      innerText = match[2];
      newStyle = "bold";
    } else if (match[3]) {
      innerText = match[4];
      newStyle = "italic";
    } else if (match[5]) {
      innerText = match[6];
      newStyle = "underline";
    } else {
      innerText = "";
      newStyle = "";
    }

    const nestedContent = parseLineRecursively(innerText, lineIndex, fullText, [...appliedStyles, newStyle], startOffset + (match.index || 0) + match[0].length - innerText.length);

    formattedContent = applyFormattingStyles(nestedContent, [...appliedStyles, newStyle], lineIndex, startOffset + (match.index || 0), fullText, innerText);

    parts.push(formattedContent);

    text = text.substring((match.index || 0) + match[0].length);
    lastIndex = 0;
  }

  return parts.length === 1 ? parts[0] : parts;
};

const applyFormattingStyles = (content: React.ReactNode, styles: string[], lineIndex: number, matchIndex: number, fullText: string, originalText: string): React.ReactNode => {
  let result = content;

  for (let i = styles.length - 1; i >= 0; i--) {
    const style = styles[i];
    const key = `${style}-${lineIndex}-${matchIndex}-${i}`;

    switch (style) {
      case "bold":
        if (i === styles.indexOf("bold")) {
          result = <BoldWithTooltip key={key} text={result} originalText={originalText} fullText={fullText} currentLineIndex={lineIndex} currentMatchEnd={matchIndex + originalText.length + 4} />;
        } else {
          result = <strong key={key}>{result}</strong>;
        }
        break;
      case "italic":
        result = <em key={key}>{result}</em>;
        break;
      case "underline":
        result = <u key={key}>{result}</u>;
        break;
    }
  }

  return result;
};

const BoldWithTooltip = ({ text, originalText, fullText, currentLineIndex, currentMatchEnd }: { text: React.ReactNode; originalText: string; fullText: string; currentLineIndex: number; currentMatchEnd: number }) => {
  const [copied, setCopied] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const getContentToCopy = () => {
    const lines = fullText.split("\n");
    let currentPosition = 0;

    for (let i = 0; i < currentLineIndex; i++) {
      currentPosition += lines[i].length + 1;
    }
    currentPosition += currentMatchEnd;

    const remainingText = fullText.substring(currentPosition);
    const nextBoldMatch = remainingText.match(/\*\*[^*]+\*\*/);

    let contentToCopy = "";
    if (nextBoldMatch) {
      contentToCopy = remainingText.substring(0, nextBoldMatch.index);
    } else {
      contentToCopy = remainingText;
    }

    return contentToCopy.trim();
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const contentToCopy = getContentToCopy();
      await navigator.clipboard.writeText(contentToCopy);
      setCopied(true);
      setOpen(true);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setCopied(false);
        setOpen(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);

    if (!newOpen && copied) {
      setCopied(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  };

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <Tooltip open={open} onOpenChange={handleOpenChange}>
      <TooltipTrigger asChild>
        <strong className="cursor-pointer hover:underline" onClick={handleCopy}>
          {text}
        </strong>
      </TooltipTrigger>
      <TooltipContent>{copied ? "Copied!" : "Copy"}</TooltipContent>
    </Tooltip>
  );
};

export const FormattedTextarea = React.forwardRef<HTMLTextAreaElement, FormattedTextareaProps>(({ className, value = "", onChange, minHeight = 0, maxHeight = 10000, ...props }, ref) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [localValue, setLocalValue] = React.useState(value);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const isEditingRef = React.useRef(false);

  React.useEffect(() => {
    isEditingRef.current = isEditing;
  }, [isEditing]);

  React.useEffect(() => {
    if (!isEditingRef.current) {
      setLocalValue(value);
    }
  }, [value]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isEditing && containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsEditing(false);
        setLocalValue(value);
      }
    };

    if (isEditing) {
      const timeoutId = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 0);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isEditing, value]);

  const handleFocus = () => {
    setIsEditing(true);
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setIsEditing(false);
        setLocalValue(value);
      }
    }, 0);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalValue(e.target.value);
    if (onChange) {
      onChange(e);
    }
  };

  if (isEditing) {
    return (
      <div ref={containerRef}>
        <ExpandingTextarea
          ref={(node) => {
            textareaRef.current = node;
            if (typeof ref === "function") {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
          }}
          value={localValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          minHeight={minHeight}
          maxHeight={maxHeight}
          className={className}
          autoFocus
          {...props}
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} onClick={() => setIsEditing(true)} className={cn("w-full text-foreground text-sm flex-1 border-none p-0 leading-relaxed rounded-none cursor-text break-words", className)} style={{ minHeight: `${minHeight}px` }}>
      {parseFormattedTextWithTooltips(value)}
    </div>
  );
});

FormattedTextarea.displayName = "FormattedTextarea";
