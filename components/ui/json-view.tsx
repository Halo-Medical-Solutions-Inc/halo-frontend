import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ExpandingTextarea } from "./textarea";

interface JsonViewProps {
  data: any;
  className?: string;
  onDataChange?: (newData: any) => void;
}

export const JsonView: React.FC<JsonViewProps> = ({ data, className, onDataChange }) => {
  const [localValues, setLocalValues] = useState<Record<string, string>>({});

  if (!data || typeof data !== "object") {
    return <div className={cn("text-xs text-muted-foreground", className)}>No data available</div>;
  }

  const formatKey = (key: string) => {
    return key
      .replace(/_/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const getPathString = (path: (string | number)[]) => path.join(".");

  const handleValueChange = (path: (string | number)[], newValue: string) => {
    const pathStr = getPathString(path);
    setLocalValues((prev) => ({
      ...prev,
      [pathStr]: newValue,
    }));
  };

  const handleBlur = (path: (string | number)[], value: string) => {
    if (onDataChange) {
      const newData = JSON.parse(JSON.stringify(data));
      let current = newData;

      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }

      current[path[path.length - 1]] = value;
      onDataChange(newData);
    }
  };

  const flattenObject = (obj: any, prefix: string = ""): Array<{ key: string; value: any; path: (string | number)[]; topLevelKey: string }> => {
    const result: Array<{ key: string; value: any; path: (string | number)[]; topLevelKey: string }> = [];

    const traverse = (current: any, currentPath: (string | number)[] = [], topLevel?: string) => {
      if (current === null || typeof current !== "object") {
        if (currentPath.length > 0) {
          result.push({
            key: currentPath[currentPath.length - 1].toString(),
            value: current,
            path: currentPath,
            topLevelKey: topLevel || currentPath[0]?.toString() || "",
          });
        }
        return;
      }

      if (Array.isArray(current)) {
        current.forEach((item, index) => {
          traverse(item, [...currentPath, index], topLevel);
        });
      } else {
        Object.entries(current).forEach(([key, value]) => {
          const newTopLevel = currentPath.length === 0 ? key : topLevel;
          traverse(value, [...currentPath, key], newTopLevel);
        });
      }
    };

    traverse(obj);
    return result;
  };

  const flattenedData = flattenObject(data);

  // Group data by top-level key
  const groupedData = flattenedData.reduce(
    (acc, item) => {
      const topKey = item.topLevelKey;
      if (!acc[topKey]) {
        acc[topKey] = [];
      }
      acc[topKey].push(item);
      return acc;
    },
    {} as Record<string, typeof flattenedData>
  );

  useEffect(() => {
    const initialValues: Record<string, string> = {};
    flattenedData.forEach((item) => {
      const pathStr = getPathString(item.path);
      if (!(pathStr in localValues)) {
        initialValues[pathStr] = String(item.value) || "";
      }
    });
    setLocalValues((prev) => ({ ...prev, ...initialValues }));
  }, [data]);

  return (
    <div className={cn("space-y-6", className)}>
      {Object.entries(groupedData).map(([topLevelKey, items], sectionIndex) => (
        <div
          key={sectionIndex}
          className={cn("", {
            "border-b border-border pb-6": sectionIndex < Object.keys(groupedData).length - 1,
          })}
        >
          <div className="mb-4">
            <h3 className="text-sm font-bold text-primary">{formatKey(topLevelKey).toUpperCase()}</h3>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => {
              const pathStr = getPathString(item.path);
              const currentValue = (localValues[pathStr] ?? String(item.value)) || "";
              const isNested = item.path.length > 2;

              return (
                <div
                  key={index}
                  className={cn("", {
                    "ml-6 pl-4 border-l-1 border-muted-foreground/30": isNested,
                  })}
                >
                  <div>
                    <span className="text-sm font-semibold text-primary">{formatKey(item.key)}</span>
                  </div>

                  <div>
                    <ExpandingTextarea minHeight={0} maxHeight={10000} className="w-full text-primary text-sm flex-1 resize-none border-none p-0 leading-relaxed focus:ring-0 focus:outline-none focus:shadow-none rounded-none placeholder:text-muted-foreground" value={currentValue} onChange={(e) => handleValueChange(item.path, e.target.value)} onBlur={(e) => handleBlur(item.path, e.target.value)} placeholder={`Enter ${formatKey(item.key).toLowerCase()}...`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
