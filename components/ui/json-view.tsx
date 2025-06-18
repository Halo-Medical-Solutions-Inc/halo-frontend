import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface JsonViewProps {
  data: any;
  className?: string;
}

interface SectionProps {
  title: string;
  data: any;
  defaultOpen?: boolean;
}

const Section: React.FC<SectionProps> = ({ title, data, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const formatTitle = (key: string) => {
    return key
      .replace(/_/g, " ")
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const renderValue = (value: any, key: string) => {
    if (value === null || value === undefined || value === "") {
      return <span className="text-muted-foreground">-</span>;
    }

    if (typeof value === "object" && !Array.isArray(value)) {
      return (
        <div className="ml-4 space-y-1">
          {Object.entries(value).map(([k, v]) => (
            <div key={k} className="flex items-start gap-2">
              <span className="text-sm font-medium text-muted-foreground min-w-[140px]">{formatTitle(k)}:</span>
              <span className="text-sm">{renderValue(v, k)}</span>
            </div>
          ))}
        </div>
      );
    }

    if (Array.isArray(value)) {
      return (
        <div className="ml-4 space-y-2">
          {value.map((item, index) => (
            <div key={index} className="border-l-2 border-muted pl-3 space-y-1">
              {typeof item === "object" ? (
                Object.entries(item).map(([k, v]) => (
                  <div key={k} className="flex items-start gap-2">
                    <span className="text-sm font-medium text-muted-foreground capitalize">{formatTitle(k)}:</span>
                    <span className="text-sm">{v || "-"}</span>
                  </div>
                ))
              ) : (
                <span className="text-sm">{item}</span>
              )}
            </div>
          ))}
        </div>
      );
    }

    return <span className="text-sm">{String(value)}</span>;
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors flex items-center justify-between text-left">
        <span className="font-medium">{formatTitle(title)}</span>
        {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>
      {isOpen && <div className="p-4 space-y-2">{renderValue(data, title)}</div>}
    </div>
  );
};

export const JsonView: React.FC<JsonViewProps> = ({ data, className }) => {
  if (!data || typeof data !== "object") {
    return <div className={cn("text-sm text-muted-foreground", className)}>No data available</div>;
  }

  // Define the order and display names for sections
  const sectionOrder = [
    { key: "encounter_details", title: "Encounter Details", defaultOpen: true },
    { key: "vital_signs", title: "Vital Signs", defaultOpen: true },
    { key: "diagnosis_codes", title: "Diagnosis Codes", defaultOpen: true },
    { key: "procedure_codes", title: "Procedure Codes", defaultOpen: true },
    { key: "soap_notes", title: "SOAP Notes", defaultOpen: true },
  ];

  return (
    <div className={cn("space-y-3 text-sm", className)}>
      {sectionOrder.map(({ key, title, defaultOpen }) => {
        if (key in data && data[key]) {
          return <Section key={key} title={title} data={data[key]} defaultOpen={defaultOpen} />;
        }
        return null;
      })}

      {/* Render any additional sections not in the predefined order */}
      {Object.entries(data).map(([key, value]) => {
        if (!sectionOrder.some((section) => section.key === key)) {
          return <Section key={key} title={key} data={value} defaultOpen={false} />;
        }
        return null;
      })}
    </div>
  );
};