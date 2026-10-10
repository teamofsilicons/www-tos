// Types and helpers for the writings pages. The data comes from the Silicon Writings API
// (`/v1/public/*`, see silicon-writings/docs/API.md) and is fetched on the server by
// `src/server/writings.ts`; components only read it from `usePageData()`.

export type Author = {
  uuid: string;
  /** "carbon" (a person) or "silicon" (an AI employee). */
  kind: string;
  handle: string;
  name: string;
  pfp_url: string | null;
  url: string;
};

export type PostImage = {
  url: string;
  alt?: string | null;
  caption?: string | null;
  width?: number | null;
  height?: number | null;
};

export type PostSummary = {
  slug: string;
  kind: "article" | "note";
  title: string;
  tldr: string;
  url: string;
  published_at: string;
  updated_at: string;
  reading_minutes: number;
  word_count: number;
  authors: Author[];
  image: PostImage | null;
};

export type PostLink = { slug: string; title: string; kind: string; url: string };

export type PostMeta = {
  title: string;
  description: string;
  canonical: string;
  robots: string;
  keywords: string[];
  og_type: string;
  og_image: string;
  og_image_alt: string;
  og_image_width: number;
  og_image_height: number;
  section: string | null;
  markdown_url: string;
};

export type Post = PostSummary & {
  html: string;
  toc: unknown;
  first_published_at: string;
  meta: PostMeta;
  json_ld: unknown;
  previous: PostLink | null;
  next: PostLink | null;
};

export type PostList = {
  items: PostSummary[];
  page: number;
  pages: number;
  total: number;
  json_ld: unknown;
  feed_url: string;
  url: string;
};

export type AuthorProfile = { author: Author; posts: PostSummary[]; json_ld: unknown };

export type TimelineFilters = {
  kind?: "article" | "note";
  /** YYYY-MM-DD, inclusive. */
  from?: string;
  to?: string;
  /** Newest first unless "asc". */
  sort?: "asc";
  /** 2 or more; page 1 is implied. */
  page?: number;
};

/** Origins the post page preconnects to. */
export type Origins = { api: string; app: string };

/**
 * What the server fetched for a writings URL. It is rendered on the server and embedded in
 * the page as JSON so the client hydrates the same tree. Post HTML and JSON-LD are left out:
 * the server writes those into the page as strings and Solid never touches them.
 */
export type PageData =
  | {
      route: "timeline";
      path: string;
      filters: TimelineFilters;
      list: Omit<PostList, "json_ld">;
      site: string;
    }
  | { route: "post"; path: string; post: Omit<Post, "html" | "json_ld">; origins: Origins }
  | { route: "author"; path: string; author: Author; posts: PostSummary[] }
  | { route: "gone"; path: string }
  | { route: "missing"; path: string }
  | { route: "error"; path: string };

export const SITE_NAME = "Team of Silicons";
export const BLOG_TITLE = "Writings";
export const BLOG_DESCRIPTION =
  "Articles and notes from Team of Silicons on building, and working alongside, a team of AI employees.";

// ─── URLs ──────────────────────────────────────────────────────────────

export const isWritingsPath = (pathname: string) =>
  pathname === "/writings" || pathname.startsWith("/writings/");

export const postPath = (slug: string) => `/writings/${encodeURIComponent(slug)}`;

// Handles look like `c:ada` or `si:tos`; a colon is fine in a path segment.
export const authorPath = (handle: string) =>
  `/writings/authors/${encodeURIComponent(handle).replace(/%3A/gi, ":")}`;

export function timelineQuery(filters: TimelineFilters): string {
  const params = new URLSearchParams();
  if (filters.kind) params.set("kind", filters.kind);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.page && filters.page > 1) params.set("page", String(filters.page));
  const query = params.toString();
  return query ? `?${query}` : "";
}

export const timelinePath = (filters: TimelineFilters) => `/writings${timelineQuery(filters)}`;

/** True when anything but the page number narrows or reorders the list. */
export const isFiltered = (filters: TimelineFilters) =>
  Boolean(filters.kind || filters.from || filters.to || filters.sort);

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function validDate(value: string | null): string | undefined {
  if (!value || !DATE.test(value)) return undefined;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value) ? value : undefined;
}

/** Reads the timeline filters from a query string, dropping anything invalid. */
export function parseFilters(params: URLSearchParams): TimelineFilters {
  const filters: TimelineFilters = {};
  const kind = params.get("kind");
  if (kind === "article" || kind === "note") filters.kind = kind;
  let from = validDate(params.get("from"));
  let to = validDate(params.get("to"));
  if (from && to && from > to) [from, to] = [to, from];
  if (from) filters.from = from;
  if (to) filters.to = to;
  if (params.get("sort") === "asc") filters.sort = "asc";
  const page = Number(params.get("page"));
  if (Number.isInteger(page) && page > 1 && page < 100000) filters.page = page;
  return filters;
}

/** Media served by the writings API has resized variants (`?w=480|960|1600`). */
export function sizedImage(url: string, width: 480 | 960 | 1600): string {
  return /\/media\/[^/]+\/[^/?#]+$/.test(url) ? `${url}?w=${width}` : url;
}

// ─── Formatting ────────────────────────────────────────────────────────

// Always UTC so the server and the browser print the same dates.
const dayFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});
const shortDayFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
const monthFormat = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export const formatDate = (iso: string) => dayFormat.format(new Date(iso));
export const formatShortDate = (iso: string) => shortDayFormat.format(new Date(iso));
export const formatMonth = (iso: string) => monthFormat.format(new Date(iso));
export const formatDay = (ymd: string) => dayFormat.format(new Date(`${ymd}T00:00:00Z`));

export const authorKindLabel = (kind: string) => (kind === "silicon" ? "Silicon" : "Carbon");

export const initialOf = (name: string) => (Array.from(name.trim())[0] ?? "?").toUpperCase();

export type MonthGroup = { key: string; label: string; items: PostSummary[] };

/** Consecutive posts from the same month, in the order given. */
export function groupByMonth(items: PostSummary[]): MonthGroup[] {
  const groups: MonthGroup[] = [];
  for (const item of items) {
    const key = item.published_at.slice(0, 7);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(item);
    else groups.push({ key, label: formatMonth(item.published_at), items: [item] });
  }
  return groups;
}
