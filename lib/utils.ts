import { User, Visit } from "@/store/types";
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

export const getUserInitials = (user: User | undefined) => {
  if (!user?.name) return "";
  const name = user.name;
  const spaceIndex = name.indexOf(" ");
  return spaceIndex > 0 ? (name.charAt(0) + name.charAt(spaceIndex + 1)).toUpperCase() : name.substring(0, 2).toUpperCase();
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

export function parseFormattedText(text: string): string {
  if (!text) return "";
  let formatted = text;

  // Check if the text already contains HTML tags (like from rich text editor)
  const hasHtmlTags = /<[^>]+>/.test(text);

  if (!hasHtmlTags) {
    // Only apply formatting if it's plain text
    formatted = formatted.replace(/--([^-]+)--/g, "<u>$1</u>");
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    formatted = formatted.replace(/\/\/([^/]+)\/\//g, "<em>$1</em>");
    formatted = formatted.replace(/\n/g, "<br />");
  }

  return formatted;
}

const parsePrintStyles = (print?: string): { fontSize: string; fontFamily: string } => {
  const defaultStyles = { fontSize: "12px", fontFamily: "Times New Roman" };
  if (!print) return defaultStyles;

  const styles = { ...defaultStyles };
  const parts = print.split(";").filter(Boolean);

  parts.forEach((part) => {
    const [key, value] = part.split(":").map((s) => s.trim());
    if (key === "font-size") {
      styles.fontSize = value;
    } else if (key === "font-family") {
      styles.fontFamily = value;
    }
  });

  return styles;
};

export const printNote = (visitName: string, noteContent: string, headerContent?: string, footerContent?: string, printStyles?: string) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const formattedNoteContent = parseFormattedText(noteContent);
  const formattedHeaderContent = headerContent ? parseFormattedText(headerContent) : "";
  const formattedFooterContent = footerContent ? parseFormattedText(footerContent) : "";

  const { fontSize, fontFamily } = parsePrintStyles(printStyles);

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${visitName}</title>
        <style>
          body {
            font-family: ${fontFamily}, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: ${fontSize};
            margin: 0;
            padding: 0;
            color: #000;
          }
          .header {
            width: 100%;
            white-space: pre-wrap;
            margin-bottom: 20px;
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
            margin-top: 20px;
          }
          .footer p {
            margin: 0;
            line-height: 1.5;
          }
          .content {
            white-space: pre-wrap;
          }
          img {
            max-width: 100%;
            height: auto;
            display: inline-block;
            vertical-align: middle;
            page-break-inside: avoid;
          }
          @media print {
            body {
              margin: 0.5in;
            }
            img {
              max-width: 100%;
              height: auto;
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
          @media screen {
            body {
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        ${formattedHeaderContent ? `<div class="header">${formattedHeaderContent}</div>` : ""}
        <div class="content">${formattedNoteContent}</div>
        ${formattedFooterContent ? `<div class="footer">${formattedFooterContent}</div>` : ""}
      </body>
    </html>
  `);

  printWindow.document.close();

  printWindow.onload = () => {
    const images = printWindow.document.images;
    let loadedImages = 0;

    const checkImagesAndPrint = () => {
      if (loadedImages === images.length) {
        setTimeout(() => {
          printWindow.print();
          printWindow.onafterprint = () => printWindow.close();
        }, 500);
      }
    };

    if (images.length === 0) {
      checkImagesAndPrint();
    } else {
      Array.from(images).forEach((img) => {
        if (img.complete) {
          loadedImages++;
          checkImagesAndPrint();
        } else {
          img.onload = () => {
            loadedImages++;
            checkImagesAndPrint();
          };
          img.onerror = () => {
            console.error("Failed to load image:", img.src?.substring(0, 50) + "...");
            loadedImages++;
            checkImagesAndPrint();
          };
        }
      });
    }
  };
};

export const downloadNoteAsPDF = async (visitName: string, noteContent: string, headerContent?: string, footerContent?: string, printStyles?: string) => {
  const formattedNoteContent = parseFormattedText(noteContent);
  const formattedHeaderContent = headerContent ? parseFormattedText(headerContent) : "";
  const formattedFooterContent = footerContent ? parseFormattedText(footerContent) : "";

  const { fontSize, fontFamily } = parsePrintStyles(printStyles);

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const now = new Date();
  const dateTimeString = format(now, "yyyy-MM-dd_HHmm");
  const safeVisitName = visitName.replace(/[^a-z0-9]/gi, "-").toLowerCase();
  const filename = `${safeVisitName}-${dateTimeString}.pdf`;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${filename}</title>
        <style>
          body {
            font-family: ${fontFamily}, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: ${fontSize};
            margin: 0;
            padding: 0;
            color: #000;
          }
          .header {
            width: 100%;
            white-space: pre-wrap;
            margin-bottom: 20px;
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
            margin-top: 20px;
          }
          .footer p {
            margin: 0;
            line-height: 1.5;
          }
          .content {
            white-space: pre-wrap;
          }
          img {
            max-width: 100%;
            height: auto;
            display: inline-block;
            vertical-align: middle;
            page-break-inside: avoid;
          }
          @media print {
            body {
              margin: 0.5in;
            }
            img {
              max-width: 100%;
              height: auto;
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
          @media screen {
            body {
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        ${formattedHeaderContent ? `<div class="header">${formattedHeaderContent}</div>` : ""}
        <div class="content">${formattedNoteContent}</div>
        ${formattedFooterContent ? `<div class="footer">${formattedFooterContent}</div>` : ""}
      </body>
    </html>
  `);

  printWindow.document.close();

  printWindow.onload = () => {
    const images = printWindow.document.images;
    let loadedImages = 0;

    const checkImagesAndPrint = () => {
      if (loadedImages === images.length) {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    };

    if (images.length === 0) {
      checkImagesAndPrint();
    } else {
      Array.from(images).forEach((img) => {
        if (img.complete) {
          loadedImages++;
          checkImagesAndPrint();
        } else {
          img.onload = () => {
            loadedImages++;
            checkImagesAndPrint();
          };
          img.onerror = () => {
            console.error("Failed to load image in PDF:", img.src?.substring(0, 50) + "...");
            loadedImages++;
            checkImagesAndPrint();
          };
        }
      });
    }
  };
};

export const downloadNoteAsWord = async (visitName: string, noteContent: string, headerContent?: string, footerContent?: string, printStyles?: string) => {
  const formattedNoteContent = parseFormattedText(noteContent);
  const formattedHeaderContent = headerContent ? parseFormattedText(headerContent) : "";
  const formattedFooterContent = footerContent ? parseFormattedText(footerContent) : "";

  const { fontSize, fontFamily } = parsePrintStyles(printStyles);

  const now = new Date();
  const dateTimeString = format(now, "yyyy-MM-dd_HHmm");
  const safeVisitName = visitName.replace(/[^a-z0-9]/gi, "-").toLowerCase();
  const filename = `${safeVisitName}-${dateTimeString}`;

  const convertToWordParagraphs = (text: string) => {
    if (!text) return "";

    if (/<[^>]+>/.test(text)) {
      return text;
    }

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
        <title>${filename}</title>
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
            font-family: '${fontFamily}', 'Calibri', 'Arial', sans-serif; 
            font-size: ${fontSize}; 
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
          img { 
            max-width: 100%; 
            height: auto; 
            display: inline-block;
            vertical-align: middle;
            page-break-inside: avoid;
          }
          strong u, u strong { font-weight: bold !important; text-decoration: underline !important; }
          strong em, em strong { font-weight: bold !important; font-style: italic !important; }
          em u, u em { font-style: italic !important; text-decoration: underline !important; }
          strong em u, strong u em, em strong u, em u strong, u strong em, u em strong {
            font-weight: bold !important;
            font-style: italic !important;
            text-decoration: underline !important;
          }
          .text-left { text-align: left !important; }
          .text-center { text-align: center !important; }
          .text-right { text-align: right !important; }
          .text-justify { text-align: justify !important; }
          .font-arial { font-family: Arial, sans-serif !important; }
          .font-times { font-family: 'Times New Roman', serif !important; }
          .font-courier { font-family: 'Courier New', monospace !important; } 
          [style*="text-align: left"] { text-align: left !important; }
          [style*="text-align: center"] { text-align: center !important; }
          [style*="text-align: right"] { text-align: right !important; }
          [style*="text-align: justify"] { text-align: justify !important; }
        </style>
      </head>
      <body>
        ${formattedHeaderContent ? `<div class="header">${convertToWordParagraphs(formattedHeaderContent)}</div>` : ""}
        <div class="content">${convertToWordParagraphs(formattedNoteContent)}</div>
        ${formattedFooterContent ? `<div class="footer">${convertToWordParagraphs(formattedFooterContent)}</div>` : ""}
      </body>
    </html>
  `;

  const blob = new Blob(["\ufeff" + htmlContent], {
    type: "application/vnd.ms-word;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${filename}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 100);
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

export const debugBase64Images = (
  htmlContent: string
): {
  imageCount: number;
  images: Array<{
    index: number;
    sizeKB: number;
    format: string;
    isValid: boolean;
    error?: string;
  }>;
} => {
  const imgRegex = /<img[^>]+src=["']?([^"'\s>]+)["']?[^>]*>/gi;
  const matches = [...htmlContent.matchAll(imgRegex)];
  const images: Array<{
    index: number;
    sizeKB: number;
    format: string;
    isValid: boolean;
    error?: string;
  }> = [];

  matches.forEach((match, index) => {
    const src = match[1];
    if (src.startsWith("data:")) {
      try {
        const base64Match = src.match(/^data:([^;]+);base64,(.+)$/);
        if (base64Match) {
          const mimeType = base64Match[1];
          const base64Data = base64Match[2];
          const sizeKB = (base64Data.length * 0.75) / 1024;

          const isValidBase64 = /^[A-Za-z0-9+/]*={0,2}$/.test(base64Data);

          images.push({
            index,
            sizeKB: Math.round(sizeKB * 100) / 100,
            format: mimeType,
            isValid: isValidBase64,
            error: !isValidBase64 ? "Invalid base64 encoding" : undefined,
          });
        } else {
          images.push({
            index,
            sizeKB: 0,
            format: "unknown",
            isValid: false,
            error: "Invalid data URL format",
          });
        }
      } catch (error) {
        images.push({
          index,
          sizeKB: 0,
          format: "error",
          isValid: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  });

  return {
    imageCount: images.length,
    images,
  };
};
