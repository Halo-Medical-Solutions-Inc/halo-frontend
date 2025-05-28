"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageLoading } from "@/components/ui/message-loading";

interface ChatBubbleProps {
  variant?: "sent" | "received";
  layout?: "default" | "ai";
  className?: string;
  children: React.ReactNode;
}

export function ChatBubble({ variant = "received", layout = "default", className, children }: ChatBubbleProps) {
  return <div className={cn("text-sm flex items-start gap-2 mb-4", variant === "sent" && "flex-row-reverse", className)}>{children}</div>;
}

interface ChatBubbleMessageProps {
  variant?: "sent" | "received";
  isLoading?: boolean;
  className?: string;
  children?: React.ReactNode;
}

function parseFormattedText(text: string): React.ReactNode[] {
  if (typeof text !== "string") return [text];

  const parts: React.ReactNode[] = [];
  let currentIndex = 0,
    partIndex = 0;
  const formatRegex = /(\*\*|\/\/|--)(.*?)\1/g;
  let match;

  while ((match = formatRegex.exec(text)) !== null) {
    if (match.index > currentIndex) parts.push(text.slice(currentIndex, match.index));

    const marker = match[1];
    const nestedContent = parseNestedFormatting(match[2]);

    if (marker === "**") parts.push(<strong key={`bold-${partIndex++}`}>{nestedContent}</strong>);
    else if (marker === "//") parts.push(<em key={`italic-${partIndex++}`}>{nestedContent}</em>);
    else if (marker === "--") parts.push(<u key={`underline-${partIndex++}`}>{nestedContent}</u>);

    currentIndex = match.index + match[0].length;
  }

  if (currentIndex < text.length) parts.push(text.slice(currentIndex));
  return parts.length > 0 ? parts : [text];
}

function parseNestedFormatting(text: string): React.ReactNode {
  const formatRegex = /(\*\*|\/\/|--)(.*?)\1/g;
  const parts: React.ReactNode[] = [];
  let currentIndex = 0,
    partIndex = 0;
  let match;

  while ((match = formatRegex.exec(text)) !== null) {
    if (match.index > currentIndex) parts.push(text.slice(currentIndex, match.index));

    const marker = match[1],
      content = match[2];
    if (marker === "**") parts.push(<strong key={`nested-bold-${partIndex++}`}>{content}</strong>);
    else if (marker === "//") parts.push(<em key={`nested-italic-${partIndex++}`}>{content}</em>);
    else if (marker === "--") parts.push(<u key={`nested-underline-${partIndex++}`}>{content}</u>);

    currentIndex = match.index + match[0].length;
  }

  if (currentIndex < text.length) parts.push(text.slice(currentIndex));
  return parts.length > 0 ? parts : text;
}

export function ChatBubbleMessage({ variant = "received", isLoading, className, children }: ChatBubbleMessageProps) {
  return (
    <div className={cn("rounded-lg p-3 whitespace-pre-wrap", variant === "sent" ? "bg-primary text-primary-foreground" : "bg-muted", className)}>
      {isLoading ? (
        <div className="flex items-center space-x-2">
          <MessageLoading />
        </div>
      ) : typeof children === "string" ? (
        parseFormattedText(children)
      ) : (
        children
      )}
    </div>
  );
}

interface ChatBubbleAvatarProps {
  src?: string;
  fallback?: string;
  className?: string;
}

export function ChatBubbleAvatar({ src, fallback = "AI", className }: ChatBubbleAvatarProps) {
  return (
    <Avatar className={cn("h-8 w-8", className)}>
      {src && <AvatarImage src={src} />}
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
  );
}

interface ChatBubbleActionProps {
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function ChatBubbleAction({ icon, onClick, className }: ChatBubbleActionProps) {
  return (
    <Button variant="ghost" size="icon" className={cn("h-6 w-6", className)} onClick={onClick}>
      {icon}
    </Button>
  );
}

export function ChatBubbleActionWrapper({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("flex items-center gap-1 mt-2", className)}>{children}</div>;
}
