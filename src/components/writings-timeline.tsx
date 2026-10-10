import { For, Show } from "solid-js";
import {
  authorKindLabel,
  authorPath,
  formatDate,
  formatShortDate,
  groupByMonth,
  initialOf,
  postPath,
  sizedImage,
  type Author,
  type PostSummary,
} from "~/lib/writings";

export function Avatar(props: { author: Author; size: number; class?: string }) {
  return (
    <Show
      when={props.author.pfp_url}
      fallback={
        <span
          class={`wt-avatar wt-avatar--initial ${props.class ?? ""}`}
          style={{ width: `${props.size}px`, height: `${props.size}px` }}
          aria-hidden="true"
        >
          {initialOf(props.author.name)}
        </span>
      }
    >
      {(src) => (
        <img
          src={src()}
          alt=""
          width={props.size}
          height={props.size}
          loading="lazy"
          decoding="async"
          class={`wt-avatar ${props.class ?? ""}`}
        />
      )}
    </Show>
  );
}

export function KindBadge(props: { kind: string }) {
  return (
    <span class={`wt-badge ${props.kind === "silicon" ? "wt-badge--silicon" : ""}`}>
      {authorKindLabel(props.kind)}
    </span>
  );
}

/** Avatars and names, each linking to the author's page. */
function Byline(props: { authors: Author[] }) {
  return (
    <ul class="wt-byline" aria-label="Authors">
      <For each={props.authors}>
        {(author) => (
          <li>
            <a href={authorPath(author.handle)} class="wt-byline__author" rel="author">
              <Avatar author={author} size={20} />
              <span>{author.name}</span>
            </a>
          </li>
        )}
      </For>
    </ul>
  );
}

function ArticleEntry(props: { post: PostSummary }) {
  const href = () => postPath(props.post.slug);
  return (
    <li class="wt-item wt-item--article">
      <span class="wt-dot" aria-hidden="true" />
      <article class="wt-article">
        <div class="wt-article__text">
          <p class="wt-meta">
            <time datetime={props.post.published_at} title={formatDate(props.post.published_at)}>
              {formatShortDate(props.post.published_at)}
            </time>
            <span aria-hidden="true">·</span>
            <span class="text-accent">Article</span>
            <span aria-hidden="true">·</span>
            <span>{props.post.reading_minutes} min read</span>
          </p>
          <h3 class="wt-article__title">
            <a href={href()}>{props.post.title}</a>
          </h3>
          <p class="wt-article__tldr">{props.post.tldr}</p>
          <Byline authors={props.post.authors} />
        </div>
        <Show when={props.post.image}>
          {(image) => (
            <a href={href()} class="wt-thumb" tabindex="-1" aria-hidden="true">
              <img
                src={sizedImage(image().url, 480)}
                alt=""
                width={image().width ?? 160}
                height={image().height ?? 120}
                loading="lazy"
                decoding="async"
              />
            </a>
          )}
        </Show>
      </article>
    </li>
  );
}

function NoteEntry(props: { post: PostSummary }) {
  const href = () => postPath(props.post.slug);
  return (
    <li class="wt-item wt-item--note">
      <span class="wt-dot wt-dot--note" aria-hidden="true" />
      <article class="wt-note">
        <p class="wt-meta">
          <span class="text-accent">Note</span>
          <span aria-hidden="true">·</span>
          <time datetime={props.post.published_at} title={formatDate(props.post.published_at)}>
            {formatShortDate(props.post.published_at)}
          </time>
        </p>
        <h3 class="wt-note__title">
          <a href={href()}>{props.post.title}</a>
        </h3>
        <p class="wt-note__text">{props.post.tldr}</p>
        <div class="wt-note__foot">
          <Byline authors={props.post.authors} />
          <a href={href()} class="wt-permalink" rel="bookmark" aria-label={`Permalink: ${props.post.title}`}>
            Permalink
          </a>
        </div>
      </article>
    </li>
  );
}

/** Posts on a vertical line, grouped under their month. */
export function Timeline(props: { posts: PostSummary[]; idPrefix?: string }) {
  return (
    <div class="wt">
      <For each={groupByMonth(props.posts)}>
        {(group) => {
          const id = `${props.idPrefix ?? "m"}-${group.key}`;
          return (
            <section class="wt-group" aria-labelledby={id}>
              <h2 id={id} class="wt-month">
                <span>{group.label}</span>
              </h2>
              <ol class="wt-list">
                <For each={group.items}>
                  {(post) =>
                    post.kind === "note" ? <NoteEntry post={post} /> : <ArticleEntry post={post} />
                  }
                </For>
              </ol>
            </section>
          );
        }}
      </For>
    </div>
  );
}
