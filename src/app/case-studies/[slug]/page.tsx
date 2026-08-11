import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/nav";
import { CtaSection } from "@/components/cta-section";
import { caseStudies, getCaseStudy } from "@/lib/content";

export function generateStaticParams() {
  return caseStudies.map((study) => ({ slug: study.slug }));
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const study = getCaseStudy(slug);

  if (!study) notFound();

  return (
    <>
      <Nav />
      <main>
        <header className="border-b-[0.5px] border-border px-8 pb-8 pt-20">
          <div className="mx-auto max-w-5xl">
            <Link
              href="/case-studies"
              className="mb-6 inline-block text-sm text-[#1F5CB1] hover:underline"
            >
              Back to Case Studies
            </Link>
            <h1 className="font-pixel-grid max-w-3xl text-3xl font-light tracking-tight sm:text-4xl">
              {study.headline}
            </h1>
            <p className="mt-3 text-base text-foreground/60">
              {study.division}
            </p>
            {study.highlight ? (
              <p className="mt-4 font-pixel-square text-2xl text-[#1F5CB1]">
                {study.highlight}
              </p>
            ) : null}
          </div>
        </header>

        <article className="border-t-[0.5px] border-border px-8 py-16">
          <div className="mx-auto max-w-5xl space-y-6">
            {study.body.map((paragraph, i) => (
              <p
                key={i}
                className="max-w-2xl text-lg leading-relaxed text-foreground/80"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </article>

        <CtaSection />
      </main>
    </>
  );
}
