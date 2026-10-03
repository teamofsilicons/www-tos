import { For, Show } from "solid-js";
import { PageHeader } from "~/components/page-header";
import { Seo } from "~/components/seo";
import { writings } from "~/lib/writings";

const dateFormat = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export function WritingsPage() {
  return (
    <main>
      <Seo
        title="Writings"
        description="Notes from Team of Silicons on building and working alongside a team of AI employees."
      />
      <PageHeader eyebrow="Writings" title="Notes on working with silicons.">
        <p class="max-w-xl text-lg leading-relaxed text-foreground/90">
          What we learn deploying AI employees into real companies: how the work changes, where
          silicons need people, and the tools we build along the way.
        </p>
      </PageHeader>

      <section class="px-4 pb-24 sm:px-8" aria-label="All writings">
        <div class="mx-auto w-full max-w-5xl border-t-[0.5px] border-border">
          <Show
            when={writings.length > 0}
            fallback={
              <div class="flex flex-col items-start gap-4 py-16">
                <p class="font-pixel-square text-sm uppercase tracking-tight text-muted-fg">
                  Nothing published yet
                </p>
                <p class="max-w-md text-[15px] leading-relaxed text-neutral-500">
                  The first essays are on the way. Until then, write to us and we will send them
                  your way when they land.
                </p>
                <a
                  href="mailto:hello@teamofsilicons.com?subject=Writings"
                  class="button secondary small"
                >
                  hello@teamofsilicons.com
                </a>
              </div>
            }
          >
            <ul>
              <For each={writings}>
                {(writing) => (
                  <li class="border-b-[0.5px] border-border">
                    <a
                      href={`/writings/${writing.slug}`}
                      class="group grid gap-2 py-6 sm:grid-cols-[10rem_1fr] sm:gap-8"
                    >
                      <time datetime={writing.date} class="font-pixel-square text-sm text-muted-fg">
                        {dateFormat.format(new Date(writing.date))}
                      </time>
                      <div class="flex flex-col gap-1.5">
                        <h2 class="text-xl font-medium group-hover:text-[#1F5CB1]">
                          {writing.title}
                        </h2>
                        <p class="text-[15px] leading-relaxed text-neutral-500">
                          {writing.summary}
                        </p>
                      </div>
                    </a>
                  </li>
                )}
              </For>
            </ul>
          </Show>
        </div>
      </section>
    </main>
  );
}
