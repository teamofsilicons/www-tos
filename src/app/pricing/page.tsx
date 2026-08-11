import { Nav } from "@/components/nav";
import { PageHeader } from "@/components/page-header";
import { CtaSection } from "@/components/cta-section";
import { pricingFaqs } from "@/lib/content";

export default function PricingPage() {
  return (
    <>
      <Nav />
      <main>
        <PageHeader
          title="Pricing"
          description="$0 for two months. Cancel anytime after, stated plainly."
        />

        <section className="border-t-[0.5px] border-border bg-ink px-8 py-16 text-background">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-8 md:grid-cols-3">
              <div className="md:col-span-1">
                <p className="font-pixel-square mb-2 text-3xl">$0</p>
                <p className="text-lg text-background/80">
                  For 2 months
                </p>
                <p className="mt-4 text-sm leading-relaxed text-background/70">
                  You are free to cancel anytime after the trial. No surprise
                  lock-in beyond the tier you choose.
                </p>
              </div>
              <div className="rounded-lg border border-background/20 p-6 md:col-span-1">
                <p className="font-pixel-square mb-1 text-xl">$1,999/mo</p>
                <p className="mb-4 text-sm text-background/70">
                  Annual plan (default)
                </p>
                <ul className="space-y-2 text-sm text-background/75">
                  <li>Best value for teams going all-in for a year</li>
                  <li>Full orchestrator + unlimited silicons</li>
                  <li>Your cloud, your model provider</li>
                  <li>Priority deployment support</li>
                </ul>
              </div>
              <div className="rounded-lg border border-background/20 p-6 md:col-span-1">
                <p className="font-pixel-square mb-1 text-xl">$2,999/mo</p>
                <p className="mb-4 text-sm text-background/70">
                  Month-to-month
                </p>
                <ul className="space-y-2 text-sm text-background/75">
                  <li>No annual commitment</li>
                  <li>Same orchestrator and silicon stack</li>
                  <li>Flexibility for pilots and seasonal teams</li>
                  <li>Cancel anytime after the free period</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t-[0.5px] border-border px-8 py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-10 text-xl font-medium">FAQ</h2>
            <div className="space-y-6">
              {pricingFaqs.map((faq) => (
                <article key={faq.question}>
                  <h3 className="mb-2 text-base font-medium">
                    {faq.question}
                  </h3>
                  <p className="text-base leading-relaxed text-foreground/80">
                    {faq.answer}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <CtaSection />
      </main>
    </>
  );
}
