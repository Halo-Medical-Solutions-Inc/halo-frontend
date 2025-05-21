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

const CustomCard = ({ step, currentStep, totalSteps, nextStep, prevStep, skipTour, arrow }: CustomCardProps) => {
  const visits = useSelector((state: RootState) => state.visit.visits);

  // Disable next button if we're on the first step of onboarding tour and no visits exist
  const isNextDisabled = step.tour === "onboarding" && currentStep === 0 && visits.length === 0;

  return (
    <div className="bg-white text-primary rounded-lg shadow-lg p-6 min-w-[400px] max-w-md relative flex flex-col h-full">
      {step.showSkip && skipTour && (
        <button onClick={skipTour} className="absolute top-4 right-3 text-muted-foreground cursor-pointer">
          <X className="h-4 w-4" />
        </button>
      )}

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold text-primary">{step.title}</div>
        </div>
        <div className="text-sm text-primary">{step.content}</div>
        {arrow}
      </div>

      <div className="mt-auto pt-8">
        <div className="flex justify-end">
          <div className="flex gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === currentStep ? "bg-primary" : "bg-primary/20"}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomCard;
