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

export const formatText = (text: string): string => {
  let formattedText = text;

  formattedText = formattedText.replace(/\*\*--([^*]*?)--\*\*/g, "<strong><u>$1</u></strong>");
  formattedText = formattedText.replace(/--\*\*([^-]*?)\*\*--/g, "<strong><u>$1</u></strong>");

  formattedText = formattedText.replace(/\*\*\/\/([^*]*?)\/\/\*\*/g, "<strong><em>$1</em></strong>");
  formattedText = formattedText.replace(/\/\/\*\*([^/]*?)\*\*\/\//g, "<strong><em>$1</em></strong>");

  formattedText = formattedText.replace(/--\/\/([^-]*?)\/\/--/g, "<u><em>$1</em></u>");
  formattedText = formattedText.replace(/\/\/--([^/]*?)--\/\//g, "<u><em>$1</em></u>");

  formattedText = formattedText.replace(/\*\*--\/\/([^*]*?)\/\/--\*\*/g, "<strong><u><em>$1</em></u></strong>");

  formattedText = formattedText.replace(/\*\*([^*]*?)\*\*/g, "<strong>$1</strong>");
  formattedText = formattedText.replace(/--([^-]*?)--/g, "<u>$1</u>");
  formattedText = formattedText.replace(/\/\/([^/]*?)\/\//g, "<em>$1</em>");

  return formattedText;
};

export const printNote = (visitName: string, noteContent: string, headerContent?: string, footerContent?: string) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const formattedNoteContent = formatText(noteContent);
  const formattedHeaderContent = headerContent ? formatText(headerContent) : "";
  const formattedFooterContent = footerContent ? formatText(footerContent) : "";

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          .header {
            width: 100%;
            white-space: pre-wrap;
          }
          .header p {
            margin: 0;
            line-height: 1.5;
          }
          .header p:empty {
            min-height: 1.5em;
            display: block;
          }
          .footer {
            width: 100%;
            white-space: pre-wrap;
          }
          .footer p {
            margin: 0;
            line-height: 1.5;
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
        ${formattedHeaderContent ? `<div class="header">${formattedHeaderContent}</div>` : ""}
        <div class="content">${formattedNoteContent}</div>
        ${formattedFooterContent ? `<div class="footer">${formattedFooterContent}</div>` : ""}
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
  const formattedNoteContent = formatText(noteContent);
  const formattedHeaderContent = headerContent ? formatText(headerContent) : "";
  const formattedFooterContent = footerContent ? formatText(footerContent) : "";

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          .header {
            width: 100%;
            white-space: pre-wrap;
          }
          .header p {
            margin: 0;
            line-height: 1.5;
          }
          .header p:empty {
            min-height: 1.5em;
            display: block;
          }
          .footer {
            width: 100%;
            white-space: pre-wrap;
          }
          .footer p {
            margin: 0;
            line-height: 1.5;
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
        ${formattedHeaderContent ? `<div class="header">${formattedHeaderContent}</div>` : ""}
        <div class="content">${formattedNoteContent}</div>
        ${formattedFooterContent ? `<div class="footer">${formattedFooterContent}</div>` : ""}
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

export const downloadNoteAsWord = async (visitName: string, noteContent: string, headerContent?: string, footerContent?: string) => {
  const formattedNoteContent = formatText(noteContent);
  const formattedHeaderContent = headerContent ? formatText(headerContent) : "";
  const formattedFooterContent = footerContent ? formatText(footerContent) : "";

  const convertToWordParagraphs = (text: string) => {
    if (!text) return "";
    return text
      .split(/\n\s*\n/)
      .map((paragraph) => {
        if (!paragraph.trim()) return "";
        return `<p>${paragraph.replace(/\n/g, "<br/>")}</p>`;
      })
      .join("");
  };

  const htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <meta charset="utf-8">
        <title>${visitName}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          body { 
            font-family: 'Calibri', 'Arial', sans-serif; 
            font-size: 11pt; 
            line-height: 1.5; 
            margin: 0;
            padding: 20px;
            color: #000000;
          }
          @page { margin: 1in; }
          .header { 
            margin-bottom: 20px; 
            border-bottom: 1px solid #ccc;
            padding-bottom: 10px;
          }
          .footer { 
            margin-top: 20px; 
            border-top: 1px solid #ccc;
            padding-top: 10px;
          }
          .content { margin: 0; padding: 0; }
          p { margin: 0 0 12px 0; padding: 0; line-height: 1.6; }
          strong, b { font-weight: bold !important; }
          em, i { font-style: italic !important; }
          u { text-decoration: underline !important; }
          br { mso-data-placement: same-cell; }
          strong u, u strong { font-weight: bold !important; text-decoration: underline !important; }
          strong em, em strong { font-weight: bold !important; font-style: italic !important; }
          em u, u em { font-style: italic !important; text-decoration: underline !important; }
          strong em u, strong u em, em strong u, em u strong, u strong em, u em strong {
            font-weight: bold !important;
            font-style: italic !important;
            text-decoration: underline !important;
          }
        </style>
      </head>
      <body>
        ${formattedHeaderContent ? `<div class="header">${convertToWordParagraphs(formattedHeaderContent)}</div>` : ""}
        <div class="content">${convertToWordParagraphs(formattedNoteContent)}</div>
        ${formattedFooterContent ? `<div class="footer">${convertToWordParagraphs(formattedFooterContent)}</div>` : ""}
      </body>
    </html>
  `;

  const blob = new Blob(["\ufeff" + htmlContent], { type: "application/vnd.ms-word;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${visitName}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const formatTranscriptTime = (transcript: string | undefined): string => {
  if (!transcript) return "";
  return transcript.replace(/\[(\d{2}:\d{2}:\d{2})\]/g, (match, time) => {
    const [hours, minutes, seconds] = time.split(":");
    const date = new Date();
    date.setUTCHours(parseInt(hours), parseInt(minutes), parseInt(seconds));
    return `[${date.toLocaleTimeString("en-US", { hour12: true, hour: "2-digit", minute: "2-digit", second: "2-digit" })}]`;
  });
};
