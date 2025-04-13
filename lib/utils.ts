import { Visit } from "@/store/types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

  return Object.entries(grouped).map(([date, visits]) => ({
    date,
    visits: visits.sort((a, b) => {
      if (!a.created_at || !b.created_at) return 0;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }),
  }));
};

export const parseNote = (noteContent: string): Array<{ title: string; body: string }> => {
  if (!noteContent) return [];

  const sections: Array<{ title: string; body: string }> = [];
  const titleRegex = /<title>(.*?)<\/title>/g;
  let match;
  let lastIndex = 0;
  let lastTitle = "";

  while ((match = titleRegex.exec(noteContent)) !== null) {
    if (lastTitle) {
      const startPos = lastIndex;
      const endPos = match.index;
      const content = noteContent.substring(startPos, endPos).trim();
      sections.push({ title: lastTitle, body: content });
    }

    lastTitle = match[1];
    lastIndex = match.index + match[0].length;
  }

  if (lastTitle && lastIndex < noteContent.length) {
    const content = noteContent.substring(lastIndex).trim();
    sections.push({ title: lastTitle, body: content });
  }

  return sections;
};
