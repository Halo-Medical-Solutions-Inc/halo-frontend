"use client";

import React from "react";
import { Step } from "nextstepjs";
import { X } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

interface CustomCardProps {
  step: Step & { tour?: string };
  currentStep: number;
  totalSteps: number;
  nextStep: () => void;
  prevStep: () => void;
  skipTour?: () => void;
  arrow: React.ReactNode;
}

// Function to parse custom formatting syntax
const parseFormattedText = (text: string): React.ReactNode[] => {
  const tokens: React.ReactNode[] = [];
  let currentIndex = 0;

  // Helper function to convert text with newlines to React nodes
  const textToNodes = (str: string, keyPrefix: string = ""): React.ReactNode[] => {
    if (!str) return [];

    const lines = str.split("\n");
    const nodes: React.ReactNode[] = [];

    lines.forEach((line, index) => {
      if (index > 0) {
        nodes.push(<br key={`${keyPrefix}br-${index}`} />);
      }
      if (line) {
        nodes.push(line);
      }
    });

    return nodes;
  };

  while (currentIndex < text.length) {
    // Find the next formatting marker
    const boldMatch = /\*\*(.*?)\*\*/g;
    const italicMatch = /\/\/(.*?)\/\//g;
    const underlineMatch = /--(.*?)--/g;

    boldMatch.lastIndex = currentIndex;
    italicMatch.lastIndex = currentIndex;
    underlineMatch.lastIndex = currentIndex;

    const boldResult = boldMatch.exec(text);
    const italicResult = italicMatch.exec(text);
    const underlineResult = underlineMatch.exec(text);

    // Find the earliest match
    const matches = [
      { match: boldResult, type: "bold" as const },
      { match: italicResult, type: "italic" as const },
      { match: underlineResult, type: "underline" as const },
    ].filter((item) => item.match !== null);

    if (matches.length === 0) {
      // No more matches, add the rest of the text with newline handling
      tokens.push(...textToNodes(text.slice(currentIndex), `end-${currentIndex}`));
      break;
    }

    // Sort by index to get the earliest match
    matches.sort((a, b) => a.match!.index - b.match!.index);
    const earliestMatch = matches[0];
    const match = earliestMatch.match!;

    // Add text before the match with newline handling
    if (match.index > currentIndex) {
      tokens.push(...textToNodes(text.slice(currentIndex, match.index), `pre-${currentIndex}-${match.index}`));
    }

    // Parse the matched content recursively for nested formatting
    const innerText = match[1] as string;
    const innerContent = innerText ? parseFormattedText(innerText) : [];

    // Create the formatted element
    const key = `${earliestMatch.type}-${match.index}`;
    switch (earliestMatch.type) {
      case "bold":
        tokens.push(<strong key={key}>{innerContent}</strong>);
        break;
      case "italic":
        tokens.push(<em key={key}>{innerContent}</em>);
        break;
      case "underline":
        tokens.push(
          <span key={key} style={{ textDecoration: "underline" }}>
            {innerContent}
          </span>
        );
        break;
    }

    currentIndex = match.index + match[0].length;
  }

  return tokens;
};

const CustomCard = ({ step, currentStep, totalSteps, nextStep, prevStep, skipTour, arrow }: CustomCardProps) => {
  const visits = useSelector((state: RootState) => state.visit.visits);
  const isNextDisabled = step.tour === "visit-tour" && currentStep === 0 && visits.length === 0;

  // Only parse if content is a string, otherwise display as-is
  const formattedContent = typeof step.content === "string" ? parseFormattedText(step.content) : step.content;

  return (
    <div className="bg-white text-primary rounded-lg shadow-lg p-6 relative flex flex-col h-full" style={{ width: "400px", minWidth: "400px" }}>
      {step.showSkip && skipTour && (
        <button onClick={skipTour} className="absolute top-4 right-3 text-muted-foreground cursor-pointer">
          <X className="h-4 w-4" />
        </button>
      )}

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold text-primary">{step.title}</div>
        </div>
        <div className="text-sm text-primary">{formattedContent}</div>
        {arrow}
      </div>

      <div className="mt-auto pt-8 text-right">
        <div className="inline-flex gap-1">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`rounded-full ${i === currentStep ? "bg-primary" : "bg-primary/20"}`}
              style={{
                width: "6px",
                height: "6px",
                minWidth: "6px",
                minHeight: "6px",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomCard;
