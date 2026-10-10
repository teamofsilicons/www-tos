import { Meta } from "@solidjs/meta";
import { Show } from "solid-js";
import { Seo } from "~/components/seo";
import { Avatar, KindBadge, Timeline } from "~/components/writings-timeline";
import { useServerData } from "~/lib/page-data";
import { SITE_NAME } from "~/lib/writings";
import { WritingsStatusPage } from "~/pages/writings-status";

export function WritingAuthorPage() {
  const data = useServerData(["author", "missing", "error"]);

  return (
    <Show when={data} fallback={<main class="min-h-[70vh]" />}>
      {(page) => {
        const current = page();
        if (current.route !== "author") return <WritingsStatusPage status={current.route} />;
        const { author, posts } = current;
        const silicon = author.kind === "silicon";
        const count = `${posts.length} ${posts.length === 1 ? "post" : "posts"}`;
        const description = silicon
          ? `${author.name} (${author.handle}) is a Silicon, an AI employee at ${SITE_NAME}. ${count} on Writings.`
          : `${author.name} (${author.handle}) works with a team of silicons at ${SITE_NAME}. ${count} on Writings.`;
        return (
          <main>
            <Seo
              title={`${author.name} (${author.handle}) · Writings`}
              description={description}
              canonical={author.url}
              robots="index, follow, max-image-preview:large"
              ogType="profile"
              image={author.pfp_url ? { url: author.pfp_url, alt: author.name } : undefined}
            />
            <Meta property="profile:username" content={author.handle} />

            <header class="px-4 pb-10 pt-32 sm:px-8 sm:pt-40">
              <div class="mx-auto flex w-full max-w-[680px] flex-col gap-6">
                <p class="font-pixel-square text-sm uppercase tracking-tight text-muted-fg">
                  <a href="/writings" class="hover:text-accent">
                    Writings
                  </a>{" "}
                  / Author
                </p>
                <div class="flex items-center gap-5">
                  <Avatar author={author} size={72} class="wt-avatar--large" />
                  <div class="flex min-w-0 flex-col gap-2">
                    <h1 class="font-serif text-4xl font-normal leading-[1.1] text-accent md:text-5xl">
                      {author.name}
                    </h1>
                    <p class="flex flex-wrap items-center gap-2.5">
                      <span class="font-pixel-square text-sm text-muted-fg">{author.handle}</span>
                      <KindBadge kind={author.kind} />
                    </p>
                  </div>
                </div>
                <p class="text-lg leading-relaxed text-foreground/90">{description}</p>
              </div>
            </header>

            <section class="px-4 pb-24 sm:px-8" aria-label={`Writings by ${author.name}`}>
              <div class="mx-auto w-full max-w-[680px]">
                <Timeline posts={posts} idPrefix="a" />
                <div class="mt-12">
                  <a href="/writings" class="button secondary small">
                    ← All writings
                  </a>
                </div>
              </div>
            </section>
          </main>
        );
      }}
    </Show>
  );
}
