import Link from "next/link";
import { Nav } from "@/components/nav";
import { PageHeader } from "@/components/page-header";
import { CtaSection } from "@/components/cta-section";
import { caseStudies } from "@/lib/content";

export default function CaseStudiesPage() {
  return (
    <>
      <Nav />
      <main>
        <PageHeader
          title="Case Studies"
          description="One story per division. Click through for the full outcome."
        />

        <section className="border-t-[0.5px] border-border px-8 py-16">
          <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2">
            {caseStudies.map((study) => (
              <Link
                key={study.slug}
                href={`/case-studies/${study.slug}`}
                className="group rounded-lg border border-border bg-[#EDE8E0]/30 p-6 transition-colors hover:border-[#1F5CB1]/40 hover:bg-[#EDE8E0]/50"
              >
                <h2 className="mb-2 text-lg font-medium group-hover:text-[#1F5CB1]">
                  {study.headline}
                </h2>
                <p className="mb-2 text-sm text-foreground/60">
                  {study.division}
                </p>
                <p className="text-sm leading-relaxed text-foreground/75">
                  {study.outcome}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <CtaSection />
      </main>
    </>
  );
}
