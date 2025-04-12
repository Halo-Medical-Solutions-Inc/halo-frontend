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
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }),
  }));
};
