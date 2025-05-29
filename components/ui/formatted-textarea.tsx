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

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    const regex = /(\*\*([^*]+)\*\*)|(\/\/([^/]+)\/\/)|(--([^-]+)--)/g;
    let match;

    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(line.substring(lastIndex, match.index));
      }

      if (match[1]) {
        const boldText = match[2];
        parts.push(<BoldWithTooltip key={`bold-${lineIndex}-${match.index}`} text={boldText} fullText={text} currentLineIndex={lineIndex} currentMatchEnd={match.index + match[0].length} />);
      } else if (match[3]) {
        parts.push(<em key={`italic-${lineIndex}-${match.index}`}>{match[4]}</em>);
      } else if (match[5]) {
        parts.push(<u key={`underline-${lineIndex}-${match.index}`}>{match[6]}</u>);
      }

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < line.length) {
      parts.push(line.substring(lastIndex));
    }

    return (
      <React.Fragment key={`line-${lineIndex}`}>
        {parts.length > 0 ? parts : line}
        {lineIndex < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
};

const BoldWithTooltip = ({ text, fullText, currentLineIndex, currentMatchEnd }: { text: string; fullText: string; currentLineIndex: number; currentMatchEnd: number }) => {
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

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isEditing && containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsEditing(false);
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditing]);

  const handleFocus = () => {
    setIsEditing(true);
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setIsEditing(false);
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
        <ExpandingTextarea ref={ref} value={localValue} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur} minHeight={minHeight} maxHeight={maxHeight} className={className} autoFocus {...props} />
      </div>
    );
  }

  return (
    <div ref={containerRef} onClick={() => setIsEditing(true)} className={cn("w-full text-foreground text-sm flex-1 border-none p-0 leading-relaxed rounded-none cursor-text whitespace-pre-wrap", className)} style={{ minHeight: `${minHeight}px` }}>
      {parseFormattedTextWithTooltips(localValue)}
    </div>
  );
});

FormattedTextarea.displayName = "FormattedTextarea";
