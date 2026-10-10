// Server rendering for /writings/*: the timeline, posts, author pages and the proxied feed,
// sitemap, llms.txt and Markdown files. Runs in the Vercel function
// (scripts/build-vercel.js) and in the Vite dev server (vite.config.ts).

import type { IncomingMessage, ServerResponse } from "node:http";
import { PAGE_DATA_ID } from "~/lib/page-data";
import {
  isWritingsPath,
  parseFilters,
  postPath,
  timelineQuery,
  type AuthorProfile,
  type PageData,
  type Post,
  type PostList,
} from "~/lib/writings";
import { render } from "./render";

export type WritingsResponse = { status: number; headers: Record<string, string>; body: string };

type Env = { api: string; app: string; site: string };

const PER_PAGE = 12;
const API_TIMEOUT = 8000;

function readEnv(): Env {
  const get = (key: string, fallback: string) =>
    (globalThis.process?.env?.[key]?.trim() || fallback).replace(/\/+$/, "");
  return {
    api: get("WRITINGS_API_URL", "https://backend.writings.teamofsilicons.com"),
    app: get("WRITINGS_APP_URL", "https://writings.teamofsilicons.com"),
    site: get("SITE_URL", "https://www.teamofsilicons.com"),
  };
}

// ─── Caching ───────────────────────────────────────────────────────────

// Browsers always revalidate; Vercel's CDN keeps a response for a minute and serves it stale
// for up to a day while it refreshes in the background.
const BROWSER = "public, max-age=0, must-revalidate";

function cacheHeaders(status: number): Record<string, string> {
  if (status === 200 || status === 301 || status === 308) {
    return { "Cache-Control": BROWSER, "Vercel-CDN-Cache-Control": "max-age=60, stale-while-revalidate=86400" };
  }
  if (status === 302 || status === 404 || status === 410) {
    return { "Cache-Control": BROWSER, "Vercel-CDN-Cache-Control": "max-age=30" };
  }
  return { "Cache-Control": "no-store" };
}

const HTML = "text/html; charset=utf-8";

function redirect(status: 302 | 308, location: string): WritingsResponse {
  return {
    status,
    headers: { Location: location, "Content-Type": "text/plain; charset=utf-8", ...cacheHeaders(status) },
    body: `Redirecting to ${location}\n`,
  };
}

// ─── Escaping ──────────────────────────────────────────────────────────

/** JSON that is safe inside a <script> element. */
const scriptJson = (value: unknown) =>
  JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

const attr = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ─── API ───────────────────────────────────────────────────────────────

async function api(env: Env, path: string): Promise<Response> {
  return fetch(`${env.api}${path}`, {
    headers: { accept: "application/json", "user-agent": "teamofsilicons.com" },
    signal: AbortSignal.timeout(API_TIMEOUT),
  });
}

let articleCssCache: { url: string; css: string; at: number } | undefined;
const CSS_TTL = 10 * 60 * 1000;

/** The writings app's article.css, fetched once per instance and kept for ten minutes. */
async function articleCss(env: Env): Promise<string | undefined> {
  const url = `${env.app}/runtime/v1/article.css`;
  const cached = articleCssCache?.url === url ? articleCssCache : undefined;
  if (cached && Date.now() - cached.at < CSS_TTL) return cached.css;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error(`${res.status}`);
    const css = await res.text();
    if (/<\/style/i.test(css)) throw new Error("article.css cannot be inlined");
    articleCssCache = { url, css, at: Date.now() };
    return css;
  } catch (error) {
    console.warn(`article.css: ${String(error)}; linking it instead.`);
    return cached?.css;
  }
}

// ─── Documents ─────────────────────────────────────────────────────────

type DocumentParts = {
  template: string;
  url: URL;
  data: PageData;
  head?: string;
  jsonLd?: unknown;
  /** Rendered post HTML for the `.w-body` placeholder. */
  body?: string;
};

const BODY_SLOT = /(<div\b[^>]*\sdata-w-body(?:="")?[^>]*>)(<\/div>)/;

function renderDocument(parts: DocumentParts): string {
  const rendered = render(parts.url.pathname + parts.url.search, parts.data);
  let app = rendered.html;
  if (parts.body !== undefined) {
    if (!BODY_SLOT.test(app)) throw new Error("The post body placeholder is missing.");
    const body = parts.body;
    app = app.replace(BODY_SLOT, (_, open: string, close: string) => open + body + close);
  }
  const head = [
    rendered.head,
    parts.head ?? "",
    parts.jsonLd ? `<script type="application/ld+json">${scriptJson(parts.jsonLd)}</script>` : "",
    `<script id="${PAGE_DATA_ID}" type="application/json">${scriptJson(parts.data)}</script>`,
  ].join("");
  return parts.template.replace("<!--app-head-->", () => head).replace("<!--app-html-->", () => app);
}

function page(status: number, parts: DocumentParts, headers: Record<string, string> = {}): WritingsResponse {
  return {
    status,
    headers: { "Content-Type": HTML, ...cacheHeaders(status), ...headers },
    body: renderDocument(parts),
  };
}

function statusPage(status: 404 | 410 | 503, url: URL, template: string): WritingsResponse {
  const route = status === 404 ? "missing" : status === 410 ? "gone" : "error";
  return page(
    status,
    { template, url, data: { route, path: url.pathname } },
    { "X-Robots-Tag": "noindex", ...(status === 503 ? { "Retry-After": "60" } : {}) },
  );
}

// ─── Routes ────────────────────────────────────────────────────────────

const TIMELINE_KEYS = ["kind", "from", "to", "sort", "page"];

async function timeline(env: Env, url: URL, template: string): Promise<WritingsResponse> {
  const filters = parseFilters(url.searchParams);

  // Tidy the query (empty fields from the no-JS form, defaults, swapped dates) with a redirect
  // so every filtered view has one URL. Other parameters are kept.
  const clean = new URLSearchParams(timelineQuery(filters));
  const given = new URLSearchParams(
    [...url.searchParams].filter(([key]) => TIMELINE_KEYS.includes(key)),
  );
  if (given.toString() !== clean.toString()) {
    const rest = [...url.searchParams].filter(([key]) => !TIMELINE_KEYS.includes(key));
    const target = new URLSearchParams([...clean, ...rest]).toString();
    return redirect(302, `/writings${target ? `?${target}` : ""}`);
  }

  const query = new URLSearchParams(clean);
  query.set("per_page", String(PER_PAGE));
  const res = await api(env, `/v1/public/posts?${query}`);
  if (!res.ok) {
    console.error(`writings list: API answered ${res.status}`);
    return statusPage(503, url, template);
  }
  const { json_ld, ...list } = (await res.json()) as PostList;
  // The API clamps the page; a page past the end does not exist.
  if (filters.page && filters.page > list.pages) return statusPage(404, url, template);

  return page(200, {
    template,
    url,
    data: { route: "timeline", path: url.pathname, filters, list, site: env.site },
    jsonLd: json_ld,
  });
}

async function post(env: Env, url: URL, slug: string, template: string): Promise<WritingsResponse> {
  const [res, css] = await Promise.all([
    api(env, `/v1/public/posts/${encodeURIComponent(slug)}`),
    articleCss(env),
  ]);
  if (res.status === 404) return statusPage(404, url, template);
  if (res.status === 410) return statusPage(410, url, template);
  if (!res.ok) {
    console.error(`writings post ${slug}: API answered ${res.status}`);
    return statusPage(503, url, template);
  }
  const body = (await res.json()) as Post | { redirect: { slug: string; url: string } };
  if ("redirect" in body) return redirect(308, postPath(body.redirect.slug) + url.search);

  const { html, json_ld, ...rest } = body;
  const head = [
    css
      ? `<style id="w-article-css">${css}</style>`
      : `<link rel="stylesheet" href="${attr(`${env.app}/runtime/v1/article.css`)}">`,
    `<script defer src="${attr(`${env.app}/runtime/v1/writings.js`)}"></script>`,
  ].join("");

  return page(200, {
    template,
    url,
    data: { route: "post", path: url.pathname, post: rest, origins: { api: env.api, app: env.app } },
    head,
    jsonLd: json_ld,
    body: rest.kind === "note" ? undefined : html,
  });
}

async function author(env: Env, url: URL, handle: string, template: string): Promise<WritingsResponse> {
  const res = await api(env, `/v1/public/authors/${encodeURIComponent(handle)}`);
  if (res.status === 404) return statusPage(404, url, template);
  if (!res.ok) {
    console.error(`writings author ${handle}: API answered ${res.status}`);
    return statusPage(503, url, template);
  }
  const { author, posts, json_ld } = (await res.json()) as AuthorProfile;
  return page(200, {
    template,
    url,
    data: { route: "author", path: url.pathname, author, posts },
    jsonLd: json_ld,
  });
}

const PROXIED = new Set(["feed.xml", "sitemap.xml", "llms.txt", "llms-full.txt"]);

/** Passes a text file from the API through with this site's cache headers. */
async function proxy(env: Env, path: string, headers: Record<string, string> = {}): Promise<WritingsResponse> {
  const text = (status: number, body: string): WritingsResponse => ({
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", ...cacheHeaders(status) },
    body,
  });
  let res: Response;
  try {
    res = await fetch(`${env.api}${path}`, {
      headers: { "user-agent": "teamofsilicons.com" },
      signal: AbortSignal.timeout(API_TIMEOUT),
    });
  } catch (error) {
    console.error(`writings proxy ${path}:`, error);
    return text(502, "The writings service is unavailable.\n");
  }
  if (res.status === 404 || res.status === 410) return text(404, "Not found\n");
  if (!res.ok) {
    console.error(`writings proxy ${path}: API answered ${res.status}`);
    return text(502, "The writings service is unavailable.\n");
  }
  return {
    status: 200,
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "text/plain; charset=utf-8",
      ...cacheHeaders(200),
      ...headers,
    },
    body: await res.text(),
  };
}

function decodeSegment(segment: string): string | undefined {
  try {
    const value = decodeURIComponent(segment);
    return value && value.length <= 200 ? value : undefined;
  } catch {
    return undefined;
  }
}

/** Renders a `/writings` URL. `template` is the built index.html with its asset tags. */
export async function handleWritingsRequest(
  url: URL,
  options: { template: string },
): Promise<WritingsResponse> {
  const env = readEnv();
  const { template } = options;
  const path = url.pathname;
  if (!isWritingsPath(path)) return statusPage(404, url, template);

  if (path !== "/writings" && path.endsWith("/")) {
    return redirect(308, (path.replace(/\/+$/, "") || "/writings") + url.search);
  }

  try {
    const segments = path.slice("/writings".length).split("/").filter(Boolean);
    if (segments.length === 0) return await timeline(env, url, template);

    if (segments.length === 1 && PROXIED.has(segments[0])) {
      return await proxy(env, `/v1/public/${segments[0]}`);
    }

    if (segments.length === 1 && segments[0].endsWith(".md")) {
      const slug = decodeSegment(segments[0].slice(0, -3));
      if (!slug) return statusPage(404, url, template);
      return await proxy(env, `/v1/public/posts/${encodeURIComponent(slug)}/markdown`, {
        Link: `<${env.site}${postPath(slug)}>; rel="canonical"`,
      });
    }

    if (segments.length === 2 && segments[0] === "authors") {
      const handle = decodeSegment(segments[1]);
      return handle ? await author(env, url, handle, template) : statusPage(404, url, template);
    }

    if (segments.length === 1) {
      const slug = decodeSegment(segments[0]);
      return slug ? await post(env, url, slug, template) : statusPage(404, url, template);
    }

    return statusPage(404, url, template);
  } catch (error) {
    console.error(`writings ${path}:`, error);
    return statusPage(503, url, template);
  }
}

/**
 * The request's URL. Vercel routes /writings/* to the function as `/_writings?__path=…`
 * (see scripts/build-vercel.js); use the original path whichever form arrives.
 */
function requestUrl(req: IncomingMessage): URL {
  const url = new URL(req.url ?? "/", "http://localhost");
  const original = url.searchParams.get("__path");
  url.searchParams.delete("__path");
  if (!isWritingsPath(url.pathname) && original) url.pathname = original;
  return url;
}

/** Node.js `(req, res)` adapter shared by the Vercel function and the dev server. */
export async function handleNodeRequest(
  req: IncomingMessage,
  res: ServerResponse,
  template: string,
): Promise<void> {
  const method = req.method ?? "GET";
  let result: WritingsResponse;
  if (method !== "GET" && method !== "HEAD") {
    result = {
      status: 405,
      headers: { Allow: "GET, HEAD", "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
      body: "Method not allowed\n",
    };
  } else {
    try {
      result = await handleWritingsRequest(requestUrl(req), { template });
    } catch (error) {
      console.error(error);
      result = {
        status: 500,
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
        body: "Something went wrong.\n",
      };
    }
  }
  res.statusCode = result.status;
  for (const [key, value] of Object.entries(result.headers)) res.setHeader(key, value);
  res.setHeader("Content-Length", Buffer.byteLength(result.body));
  res.end(method === "HEAD" ? undefined : result.body);
}
