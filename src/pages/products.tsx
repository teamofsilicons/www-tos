import { For, Show } from "solid-js";
import { PageHeader } from "~/components/page-header";
import { Seo } from "~/components/seo";
import { productGroups, type Product } from "~/lib/products";

const total = productGroups.reduce((sum, group) => sum + group.products.length, 0);

function Arrow() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" class="shrink-0">
      <path d="M2 8L8 2M3.5 2H8V6.5" fill="none" stroke="currentColor" stroke-width="1.4" />
    </svg>
  );
}

function GitHubMark() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" class="shrink-0">
      <path
        fill="currentColor"
        d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
      />
    </svg>
  );
}

function ProductCard(props: { product: Product }) {
  return (
    <article class="flex h-full flex-col gap-4 rounded-xl bg-white p-1 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <div class="flex items-center gap-3.5 px-3 pt-3">
        <img
          src={props.product.logo}
          alt=""
          width="52"
          height="52"
          loading="lazy"
          class="size-13 shrink-0 rounded-lg"
        />
        <h3 class="font-pixel-square text-2xl leading-none text-neutral-900">
          {props.product.name}
        </h3>
      </div>
      <p class="flex-1 px-3 text-[15px] leading-relaxed text-neutral-500">
        {props.product.summary}
      </p>
      <div class="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[5px] bg-neutral-100 px-3 py-2.5 text-sm">
        <Show when={props.product.site}>
          {(site) => (
            <a
              href={site().href}
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex min-w-0 items-center gap-1.5 text-[#1F5CB1] hover:underline"
            >
              <span class="truncate">{site().label}</span>
              <Arrow />
            </a>
          )}
        </Show>
        <a
          href={props.product.github}
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1.5 text-neutral-600 hover:text-foreground"
          aria-label={`${props.product.name} on GitHub`}
        >
          <GitHubMark />
          GitHub
        </a>
      </div>
    </article>
  );
}

export function ProductsPage() {
  return (
    <main>
      <Seo
        title="Products"
        description="The applications silicons use to talk, work and remember, built and open sourced by Team of Silicons."
      />
      <PageHeader eyebrow="Products" title="The tools a team of silicons works with.">
        <p class="max-w-xl text-lg leading-relaxed text-foreground/90">
          {total} applications for identity, communication, files, scheduling and running silicons
          on your own machines. Most are distributed through{" "}
          <a
            href="https://honeycomb.teamofsilicons.com"
            target="_blank"
            rel="noopener noreferrer"
            class="text-[#1F5CB1] underline decoration-[#1F5CB1]/30 underline-offset-4 hover:decoration-[#1F5CB1]"
          >
            Honeycomb
          </a>
          , and all of them are on GitHub.
        </p>
      </PageHeader>

      <div class="flex flex-col gap-16 px-4 pb-24 sm:px-8">
        <For each={productGroups}>
          {(group) => (
            <section
              class="mx-auto flex w-full max-w-5xl flex-col gap-6"
              aria-labelledby={`group-${group.title}`}
            >
              <div class="flex flex-col gap-1 border-t-[0.5px] border-border pt-6 sm:flex-row sm:items-baseline sm:justify-between">
                <h2
                  id={`group-${group.title}`}
                  class="font-pixel-square text-lg uppercase tracking-tight"
                >
                  {group.title}
                </h2>
                <p class="text-sm text-muted-fg">{group.blurb}</p>
              </div>
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <For each={group.products}>{(product) => <ProductCard product={product} />}</For>
              </div>
            </section>
          )}
        </For>
      </div>
    </main>
  );
}
