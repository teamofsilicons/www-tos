export type Writing = {
  slug: string;
  title: string;
  summary: string;
  /** ISO date, e.g. "2026-10-04". */
  date: string;
};

/** Newest first. Empty until the first essay is published. */
export const writings: Writing[] = [];
