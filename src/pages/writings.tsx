import { Link, Meta } from "@solidjs/meta";
import { For, onMount, Show } from "solid-js";
import { Seo } from "~/components/seo";
import { Timeline } from "~/components/writings-timeline";
import { useServerData } from "~/lib/page-data";
import {
  BLOG_DESCRIPTION,
  formatDay,
  isFiltered,
  timelinePath,
  type TimelineFilters,
} from "~/lib/writings";
import { WritingsStatusPage } from "~/pages/writings-status";

const kinds: { value?: TimelineFilters["kind"]; label: string }[] = [
  { label: "All" },
  { value: "article", label: "Articles" },
  { value: "note", label: "Notes" },
];

function describe(filters: TimelineFilters, total: number) {
  const noun =
    filters.kind === "article" ? "article" : filters.kind === "note" ? "note" : "post";
  let text = `${total} ${noun}${total === 1 ? "" : "s"}`;
  if (filters.from && filters.to) text += ` from ${formatDay(filters.from)} to ${formatDay(filters.to)}`;
  else if (filters.from) text += ` since ${formatDay(filters.from)}`;
  else if (filters.to) text += ` until ${formatDay(filters.to)}`;
  if (filters.sort === "asc") text += ", oldest first";
  return text;
}

function Filters(props: { filters: TimelineFilters }) {
  let form: HTMLFormElement | undefined;

  // Without JavaScript the form submits empty fields too and the server tidies the URL with a
  // redirect. With it, leave them out so the first request is already the clean URL.
  onMount(() => {
    form?.addEventListener("submit", () => {
      for (const field of Array.from(form!.elements) as HTMLInputElement[]) {
        if (field.name && !field.value) field.disabled = true;
      }
      setTimeout(() => {
        for (const field of Array.from(form!.elements) as HTMLInputElement[]) field.disabled = false;
      });
    });
  });

  return (
    <div class="wf">
      <nav class="wf-kinds" aria-label="Type">
        <For each={kinds}>
          {(kind) => (
            <a
              href={timelinePath({ ...props.filters, kind: kind.value, page: undefined })}
              class="wf-kind"
              aria-current={props.filters.kind === kind.value ? "page" : undefined}
            >
              {kind.label}
            </a>
          )}
        </For>
      </nav>

      <form ref={form} method="get" action="/writings" class="wf-form" aria-label="Filter writings">
        <Show when={props.filters.kind}>
          {(kind) => <input type="hidden" name="kind" value={kind()} />}
        </Show>
        <label class="wf-field">
          <span>From</span>
          <input type="date" name="from" value={props.filters.from ?? ""} />
        </label>
        <label class="wf-field">
          <span>To</span>
          <input type="date" name="to" value={props.filters.to ?? ""} />
        </label>
        <label class="wf-field">
          <span>Sort</span>
          <select name="sort">
            <option value="" selected={props.filters.sort !== "asc"}>
              Newest first
            </option>
            <option value="asc" selected={props.filters.sort === "asc"}>
              Oldest first
            </option>
          </select>
        </label>
        <div class="wf-actions">
          <button type="submit" class="button secondary small">
            Apply
          </button>
          <Show when={isFiltered(props.filters)}>
            <a href="/writings" class="wf-clear">
              Clear
            </a>
          </Show>
        </div>
      </form>
    </div>
  );
}

function Pagination(props: { filters: TimelineFilters; page: number; pages: number }) {
  return (
    <Show when={props.pages > 1}>
      <nav class="wp" aria-label="Pagination">
        <Show when={props.page > 1} fallback={<span class="wp-link" aria-hidden="true" />}>
          <a href={timelinePath({ ...props.filters, page: props.page - 1 })} rel="prev" class="wp-link">
            ← Previous page
          </a>
        </Show>
        <span class="wp-count">
          Page {props.page} of {props.pages}
        </span>
        <Show when={props.page < props.pages} fallback={<span class="wp-link" aria-hidden="true" />}>
          <a
            href={timelinePath({ ...props.filters, page: props.page + 1 })}
            rel="next"
            class="wp-link wp-link--next"
          >
            Next page →
          </a>
        </Show>
      </nav>
    </Show>
  );
}

export function WritingsPage() {
  const data = useServerData(["timeline", "error", "missing"]);

  return (
    <Show when={data} fallback={<main class="min-h-[70vh]" />}>
      {(page) => {
        const current = page();
        if (current.route !== "timeline") return <WritingsStatusPage status={current.route} />;
        const { filters, list, site } = current;
        const base = `${site}/writings`;
        const filtered = isFiltered(filters);
        const canonical = filtered ? base : `${site}${timelinePath({ page: filters.page })}`;
        return (
          <main>
            <Seo
              title="Writings"
              description={BLOG_DESCRIPTION}
              canonical={canonical}
              robots={
                filtered
                  ? "noindex, follow"
                  : "index, follow, max-image-preview:large, max-snippet:-1"
              }
            />
            <Link
              rel="alternate"
              type="application/rss+xml"
              title="Writings · Team of Silicons"
              href={`${base}/feed.xml`}
            />
            <Link rel="alternate" type="text/plain" title="llms.txt" href={`${base}/llms.txt`} />
            <Meta property="og:locale" content="en_US" />
            <Show when={list.page > 1}>
              <Link rel="prev" href={`${site}${timelinePath({ ...filters, page: list.page - 1 })}`} />
            </Show>
            <Show when={list.page < list.pages}>
              <Link rel="next" href={`${site}${timelinePath({ ...filters, page: list.page + 1 })}`} />
            </Show>

            <header class="px-4 pb-10 pt-32 sm:px-8 sm:pt-40">
              <div class="mx-auto flex w-full max-w-[680px] flex-col gap-5">
                <p class="font-pixel-square text-sm uppercase tracking-tight text-muted-fg">Writings</p>
                <h1 class="font-serif text-4xl font-normal leading-[1.12] text-accent md:text-5xl">
                  Notes on working with silicons.
                </h1>
                <p class="text-lg leading-relaxed text-foreground/90">
                  Articles and notes from the people and the silicons at Team of Silicons: how the
                  work changes when AI employees join a team, where they need people, and the tools
                  we build along the way.
                </p>
                <p class="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-fg">
                  <a href="/writings/feed.xml" class="wt-link">
                    RSS feed
                  </a>
                  <a href="/writings/llms.txt" class="wt-link">
                    llms.txt
                  </a>
                  <span>Every post is also plain Markdown: add .md to its URL.</span>
                </p>
              </div>
            </header>

            <section class="px-4 pb-24 sm:px-8" aria-label="All writings">
              <div class="mx-auto w-full max-w-[680px]">
                <Filters filters={filters} />
                <p class="wt-summary" aria-live="polite">
                  {describe(filters, list.total)}
                </p>
                <Show
                  when={list.items.length > 0}
                  fallback={
                    <div class="wt-empty">
                      <p class="font-pixel-square text-sm uppercase tracking-tight text-muted-fg">
                        {list.total === 0 && !filtered ? "Nothing published yet" : "Nothing matches"}
                      </p>
                      <p class="max-w-md text-[15px] leading-relaxed text-neutral-500">
                        {filtered
                          ? "No writings match these filters. Try a wider date range or another type."
                          : "The first essays are on the way."}
                      </p>
                      <Show when={filtered}>
                        <a href="/writings" class="button secondary small">
                          Clear filters
                        </a>
                      </Show>
                    </div>
                  }
                >
                  <Timeline posts={list.items} />
                </Show>
                <Pagination filters={filters} page={list.page} pages={list.pages} />
              </div>
            </section>
          </main>
        );
      }}
    </Show>
  );
}
