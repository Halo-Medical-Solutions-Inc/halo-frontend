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

// Parse text and return React components with tooltips for bold text
const parseFormattedTextWithTooltips = (text: string): React.ReactNode => {
  if (!text) return null;
  
  // Split by newlines first to preserve line breaks
  const lines = text.split('\n');
  
  return lines.map((line, lineIndex) => {
    // If empty line, return a br
    if (!line) return <br key={`line-${lineIndex}`} />;
    
    // Process formatting within each line
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    
    // Combined regex to match all formatting patterns
    const regex = /(\*\*([^*]+)\*\*)|(\/\/([^/]+)\/\/)|(--([^-]+)--)/g;
    let match;
    
    while ((match = regex.exec(line)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(line.substring(lastIndex, match.index));
      }
      
      if (match[1]) {
        // Bold text with tooltip
        const boldText = match[2];
        parts.push(
          <BoldWithTooltip 
            key={`bold-${lineIndex}-${match.index}`} 
            text={boldText}
            fullText={text}
            currentLineIndex={lineIndex}
            currentMatchEnd={match.index + match[0].length}
          />
        );
      } else if (match[3]) {
        // Italic text
        parts.push(<em key={`italic-${lineIndex}-${match.index}`}>{match[4]}</em>);
      } else if (match[5]) {
        // Underline text
        parts.push(<u key={`underline-${lineIndex}-${match.index}`}>{match[6]}</u>);
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < line.length) {
      parts.push(line.substring(lastIndex));
    }
    
    // Wrap line content in a span, add br if not last line
    return (
      <React.Fragment key={`line-${lineIndex}`}>
        {parts.length > 0 ? parts : line}
        {lineIndex < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
};

// Component for bold text with copy functionality
const BoldWithTooltip = ({ 
  text, 
  fullText, 
  currentLineIndex, 
  currentMatchEnd 
}: { 
  text: string;
  fullText: string;
  currentLineIndex: number;
  currentMatchEnd: number;
}) => {
  const [copied, setCopied] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  
  const getContentToCopy = () => {
    // Find the position of the current bold text in the full text
    const lines = fullText.split('\n');
    let currentPosition = 0;
    
    // Calculate the absolute position of the current match
    for (let i = 0; i < currentLineIndex; i++) {
      currentPosition += lines[i].length + 1; // +1 for newline
    }
    currentPosition += currentMatchEnd;
    
    // Find the next bold text pattern
    const remainingText = fullText.substring(currentPosition);
    const nextBoldMatch = remainingText.match(/\*\*[^*]+\*\*/);
    
    let contentToCopy = '';
    if (nextBoldMatch) {
      // Copy everything up to the next bold text
      contentToCopy = remainingText.substring(0, nextBoldMatch.index);
    } else {
      // No more bold text, copy everything remaining
      contentToCopy = remainingText;
    }
    
    // Trim whitespace and newlines from start and end
    return contentToCopy.trim();
  };
  
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the textarea edit mode
    try {
      const contentToCopy = getContentToCopy();
      await navigator.clipboard.writeText(contentToCopy);
      setCopied(true);
      setOpen(true); // Show tooltip after copying
      
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Reset after 2 seconds
      timeoutRef.current = setTimeout(() => {
        setCopied(false);
        setOpen(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };
  
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    
    // If closing the tooltip and it was copied, reset the state
    if (!newOpen && copied) {
      setCopied(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  };
  
  // Cleanup timeout on unmount
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
        <strong 
          className="cursor-pointer hover:underline" 
          onClick={handleCopy}
        >
          {text}
        </strong>
      </TooltipTrigger>
      <TooltipContent>
        {copied ? 'Copied!' : 'Copy'}
      </TooltipContent>
    </Tooltip>
  );
};

export const FormattedTextarea = React.forwardRef<HTMLTextAreaElement, FormattedTextareaProps>(
  ({ className, value = "", onChange, minHeight = 0, maxHeight = 10000, ...props }, ref) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const [localValue, setLocalValue] = React.useState(value);
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      console.log(isEditing);
    }, [isEditing]);
    
    React.useEffect(() => {
      setLocalValue(value);
    }, [value]);

    // Add click outside handler
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (isEditing && containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsEditing(false);
        }
      };

      // Add a small delay to ensure this runs after any focus events
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isEditing]);

    const handleFocus = () => {
      setIsEditing(true);
    };

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      // Add a small delay to check if we're still within the component
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
          <ExpandingTextarea
            ref={ref}
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
      <div
        ref={containerRef}
        onClick={() => setIsEditing(true)}
        className={cn(
          "w-full text-foreground text-sm flex-1 border-none p-0 leading-relaxed rounded-none cursor-text whitespace-pre-wrap",
          className
        )}
        style={{ minHeight: `${minHeight}px` }}
      >
        {parseFormattedTextWithTooltips(localValue)}
      </div>
    );
  }
);

FormattedTextarea.displayName = "FormattedTextarea"; 