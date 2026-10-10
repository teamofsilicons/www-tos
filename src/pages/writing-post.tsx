import { Link, Meta } from "@solidjs/meta";
import { For, Show } from "solid-js";
import { Avatar } from "~/components/writings-timeline";
import { Seo } from "~/components/seo";
import { useServerData } from "~/lib/page-data";
import {
  authorPath,
  formatDate,
  postPath,
  SITE_NAME,
  type PostLink,
} from "~/lib/writings";
import { WritingsStatusPage } from "~/pages/writings-status";

/** Marks the element the server fills with the post's rendered HTML (see src/server/writings.ts). */
export const BODY_SLOT = "data-w-body";

// "Title · Team of Silicons" unless that would be too long for a results page.
const pageTitle = (title: string) =>
  title.includes(SITE_NAME) || title.length + SITE_NAME.length + 3 > 65
    ? title
    : `${title} · ${SITE_NAME}`;

function Neighbor(props: { link: PostLink; label: string; next?: boolean }) {
  return (
    <a href={postPath(props.link.slug)} class={`wn-card ${props.next ? "wn-card--next" : ""}`}>
      <span class="wn-label">{props.label}</span>
      <span class="wn-title">{props.link.title}</span>
    </a>
  );
}

export function WritingPostPage() {
  const data = useServerData(["post", "gone", "missing", "error"]);

  return (
    <Show when={data} fallback={<main class="min-h-[70vh]" />}>
      {(page) => {
        const current = page();
        if (current.route !== "post") return <WritingsStatusPage status={current.route} />;
        const { post, origins } = current;
        const { meta } = post;
        const kindLabel = post.kind === "note" ? "Note" : "Article";
        return (
          <main class="pb-24 pt-28 sm:pt-36">
            <Seo
              title={pageTitle(meta.title)}
              fullTitle
              description={meta.description}
              canonical={meta.canonical}
              robots={meta.robots}
              ogType={meta.og_type || "article"}
              image={{
                url: meta.og_image,
                alt: meta.og_image_alt,
                width: meta.og_image_width,
                height: meta.og_image_height,
              }}
            />
            <Meta property="og:locale" content="en_US" />
            <Show when={meta.keywords.length > 0}>
              <Meta name="keywords" content={meta.keywords.join(", ")} />
            </Show>
            <Meta name="author" content={post.authors.map((a) => a.name).join(", ")} />
            <Meta property="article:published_time" content={post.published_at} />
            <Meta property="article:modified_time" content={post.updated_at} />
            <For each={post.authors}>
              {(author) => <Meta property="article:author" content={author.url} />}
            </For>
            <Show when={meta.section}>
              {(section) => <Meta property="article:section" content={section()} />}
            </Show>
            <For each={meta.keywords}>
              {(keyword) => <Meta property="article:tag" content={keyword} />}
            </For>
            <Link rel="alternate" type="text/markdown" title="Markdown" href={meta.markdown_url} />
            <Link
              rel="alternate"
              type="application/rss+xml"
              title="Writings · Team of Silicons"
              href="/writings/feed.xml"
            />
            <Show when={post.previous}>{(prev) => <Link rel="prev" href={prev().url} />}</Show>
            <Show when={post.next}>{(next) => <Link rel="next" href={next().url} />}</Show>
            <Link rel="preconnect" href={origins.api} />
            <Link rel="preconnect" href={origins.app} />

            <div class="w-progress" aria-hidden="true" />
            <article class="w-article" data-w-article="" data-w-post={post.slug}>
              <header>
                <p class="w-kicker">
                  <a href="/writings">Writings</a> <span>/</span>{" "}
                  <span class="w-kind">{kindLabel}</span>
                </p>
                <h1 class="w-title">{post.title}</h1>
                <p class="w-tldr">{post.tldr}</p>
                <div class="w-byline">
                  <ul class="w-authors">
                    <For each={post.authors}>
                      {(author) => (
                        <li>
                          <a class="w-author" href={authorPath(author.handle)} rel="author">
                            <Show
                              when={author.pfp_url}
                              fallback={<span class="w-author__initial">{Array.from(author.name)[0]?.toUpperCase()}</span>}
                            >
                              {(src) => <img src={src()} alt="" width="28" height="28" />}
                            </Show>{" "}
                            <span>{author.name}</span>{" "}
                            <span class="w-author__handle">{author.handle}</span>
                          </a>
                        </li>
                      )}
                    </For>
                  </ul>
                  <p class="w-meta">
                    <time datetime={post.published_at}>{formatDate(post.published_at)}</time>{" "}
                    <span>{post.reading_minutes} min read</span>
                  </p>
                </div>
              </header>
              <Show when={post.kind === "article"}>
                {/* Filled with the rendered HTML on the server. Solid never renders into it, so
                    hydration leaves embeds and their iframes alone. */}
                <div class="w-body" data-w-body="" />
              </Show>
            </article>

            <footer class="wn">
              <Show when={post.previous || post.next}>
                <nav class="wn-grid" aria-label="More writings">
                  <Show when={post.previous} fallback={<span />}>
                    {(prev) => <Neighbor link={prev()} label="← Older" />}
                  </Show>
                  <Show when={post.next}>
                    {(next) => <Neighbor link={next()} label="Newer →" next />}
                  </Show>
                </nav>
              </Show>
              <div class="wn-authors">
                <For each={post.authors}>
                  {(author) => (
                    <a href={authorPath(author.handle)} class="wt-byline__author" rel="author">
                      <Avatar author={author} size={20} />
                      <span>More from {author.name}</span>
                    </a>
                  )}
                </For>
              </div>
              <a href="/writings" class="button secondary small w-fit">
                ← Back to Writings
              </a>
            </footer>
          </main>
        );
      }}
    </Show>
  );
}
