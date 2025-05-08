import { Visit } from "@/store/types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { useCallback } from "react";
import { debounce } from "lodash";
import { WebSocketMessage } from "@/lib/websocket";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

  return Object.entries(grouped)
    .sort((a, b) => {
      return new Date(b[0]).getTime() - new Date(a[0]).getTime();
    })
    .map(([date, visits]) => ({
      date,
      visits: visits.sort((a, b) => {
        if (!a.created_at || !b.created_at) return 0;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }),
    }));
};

export const formatLocalTime = (utcDateString: string | undefined, defaultValue: string = "00:00 AM") => {
  if (!utcDateString) return defaultValue;
  const utcDate = new Date(utcDateString);
  const localDate = new Date(utcDate.getTime() - utcDate.getTimezoneOffset() * 60000);
  return localDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
};

export const formatLocalDateAndTime = (utcDateString: string | undefined, defaultValue: string = "January 1, 00:00 AM") => {
  if (!utcDateString) return defaultValue;
  const utcDate = new Date(utcDateString);
  const localDate = new Date(utcDate.getTime() - utcDate.getTimezoneOffset() * 60000);
  const month = localDate.toLocaleString("en-US", { month: "long" });
  const day = localDate.getDate();
  const time = localDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
  return `${month} ${day}, ${time}`;
};

export const getTimeDifference = (olderDate: string, newerDate?: string): string => {
  const older = new Date(olderDate);
  const newer = newerDate ? new Date(newerDate) : new Date();

  const diffMs = newer.getTime() - older.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) {
    return "just now";
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  } else {
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  }
};

export const printNote = (visitName: string, noteContent: string, headerContent?: string, footerContent?: string) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          .content {
            white-space: pre-wrap;
          }
          @media print {
            body {
              margin: 0.5in;
            }
          }
        </style>
      </head>
      <body>
        ${headerContent ? `<div class="header">${headerContent}</div>` : ''}
        <div class="content">${noteContent}</div>
        ${footerContent ? `<div class="footer">${footerContent}</div>` : ''}
        <script>
          document.title = "";
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();

  setTimeout(() => {
    printWindow.print();
    printWindow.onafterprint = () => printWindow.close();
  }, 300);
};

export const downloadNoteAsPDF = async (visitName: string, noteContent: string, headerContent?: string, footerContent?: string) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          .header {
            width: 100%;
          }
          .footer {
            width: 100%;
          }
          .content {
            white-space: pre-wrap;
          }
          @media print {
            body {
              margin: 0.5in;
            }
          }
        </style>
      </head>
      <body>
        ${headerContent ? `<div class="header">${headerContent}</div>` : ''}
        <div class="content">${noteContent}</div>
        ${footerContent ? `<div class="footer">${footerContent}</div>` : ''}
        <script>
          document.title = "";
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();

  setTimeout(() => {
    printWindow.print();
  }, 300);
};
