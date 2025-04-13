import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea data-slot="textarea" className={cn("border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", className)} {...props} />;
}

export { Textarea };

interface ExpandingTextareaProps extends React.ComponentProps<"textarea"> {
  minHeight?: number;
  maxHeight?: number;
}

const ExpandingTextarea = React.forwardRef<HTMLTextAreaElement, ExpandingTextareaProps>(({ className, minHeight = 0, maxHeight, onChange, value, ...props }, ref) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const adjustHeight = React.useCallback(
    (textarea: HTMLTextAreaElement) => {
      textarea.style.height = "auto";
      const style = window.getComputedStyle(textarea);
      const borderHeight = parseInt(style.borderTopWidth) + parseInt(style.borderBottomWidth);
      const lineHeight = parseInt(style.lineHeight) || 20;

      const scrollHeight = textarea.scrollHeight;
      const newHeight = Math.min(Math.max(scrollHeight + borderHeight, lineHeight + borderHeight), maxHeight || Infinity);
      textarea.style.height = `${newHeight}px`;
    },
    [maxHeight]
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    adjustHeight(e.target);

    if (onChange) {
      onChange(e);
    }
  };

  React.useEffect(() => {
    if (textareaRef.current) {
      adjustHeight(textareaRef.current);
    }
  }, [value, adjustHeight]);

  return (
    <textarea
      ref={(node) => {
        textareaRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      }}
      className={cn("flex w-full rounded-lg bg-background text-sm text-muted-foreground placeholder:text-muted-foreground/70 focus-visible:outline-none disabled:cursor-not-allowed leading-normal", className)}
      onChange={handleChange}
      value={value}
      style={{ minHeight: `${minHeight}px` }}
      rows={1}
      {...props}
    />
  );
});

ExpandingTextarea.displayName = "ExpandingTextarea";

export { ExpandingTextarea };
