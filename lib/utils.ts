import { Visit, WebSocketMessage } from "@/store/types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { useCallback } from "react";
import { debounce } from "lodash";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Custom hook for debounced WebSocket messages
export const useDebouncedSend = (send: (data: WebSocketMessage) => void, delay = 500) => {
  return useCallback(
    debounce((data: WebSocketMessage) => {
      send(data);
    }, delay),
    [send, delay]
  );
};

export const groupVisitsByDate = (visits: Visit[]) => {
  const grouped: Record<string, Visit[]> = {};

  visits.forEach((visit) => {
    if (!visit.created_at) return;

    const dateKey = format(new Date(visit.created_at), "MMMM dd, yyyy");
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(visit);
  });

  // Sort the dates with most recent dates first
  return Object.entries(grouped)
    .sort((a, b) => {
      // Sort dates in descending order (newest first)
      return new Date(b[0]).getTime() - new Date(a[0]).getTime();
    })
    .map(([date, visits]) => ({
      date,
      visits: visits.sort((a, b) => {
        if (!a.created_at || !b.created_at) return 0;
        // Sort visits within each date in descending order (newest first)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }),
    }));
};
