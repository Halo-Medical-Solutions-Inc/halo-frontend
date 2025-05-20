"use client";

import React from "react";
import { Step } from "nextstepjs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, X } from "lucide-react";

interface CustomCardProps {
  step: Step;
  currentStep: number;
  totalSteps: number;
  nextStep: () => void;
  prevStep: () => void;
  skipTour?: () => void;
  arrow: React.ReactNode;
}

const CustomCard = ({ step, currentStep, totalSteps, nextStep, prevStep, skipTour, arrow }: CustomCardProps) => {
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
          {step.icon}
        </div>
        <div className="text-sm text-primary">{step.content}</div>
        {arrow}
      </div>

      <div className="mt-auto pt-8 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === currentStep ? "bg-primary" : "bg-primary/20"}`} />
            ))}
          </div>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" size="icon" onClick={prevStep}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}

            <Button size="icon" onClick={nextStep}>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomCard;
