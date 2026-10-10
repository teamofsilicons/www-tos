import { A } from "@solidjs/router";
import { PageHeader } from "~/components/page-header";
import { Seo } from "~/components/seo";

export function NotFoundPage() {
  return (
    <main class="min-h-[70vh]">
      <Seo title="Not found" description="This page does not exist." robots="noindex" />
      <PageHeader eyebrow="404" title="This page went missing.">
        <A href="/" class="button secondary w-fit">
          Back home
        </A>
      </PageHeader>
    </main>
  );
}
