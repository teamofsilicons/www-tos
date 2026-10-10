import { PageHeader } from "~/components/page-header";
import { Seo } from "~/components/seo";

const pages = {
  gone: {
    eyebrow: "410",
    seoTitle: "Unpublished",
    title: "This post was unpublished.",
    text: "Its authors took it down. Everything else we have written is still on the timeline.",
  },
  missing: {
    eyebrow: "404",
    seoTitle: "Not found",
    title: "This page went missing.",
    text: "There is no writing at this address. It may have moved, or the link may be mistyped.",
  },
  error: {
    eyebrow: "503",
    seoTitle: "Unavailable",
    title: "Writings are unavailable right now.",
    text: "We could not reach the writings service. Try again in a minute.",
  },
} as const;

/** The 404, 410 and 503 pages for writings URLs. Never indexed. */
export function WritingsStatusPage(props: { status: keyof typeof pages }) {
  const page = pages[props.status];
  return (
    <main class="min-h-[70vh]">
      <Seo title={page.seoTitle} description={page.text} robots="noindex, follow" />
      <PageHeader eyebrow={page.eyebrow} title={page.title}>
        <p class="max-w-xl text-lg leading-relaxed text-foreground/90">{page.text}</p>
        <a href="/writings" class="button secondary w-fit">
          Back to Writings
        </a>
      </PageHeader>
    </main>
  );
}
