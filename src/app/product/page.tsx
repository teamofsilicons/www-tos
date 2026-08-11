import { Nav } from "@/components/nav";
import { PageHeader } from "@/components/page-header";
import { Integrations } from "@/components/integrations";
import { CtaSection } from "@/components/cta-section";
import { inHouseStack } from "@/lib/content";

export default function ProductPage() {
  return (
    <>
      <Nav />
      <main>
        <PageHeader
          title="Product"
          description="Why stop at a second brain? Build a second body for your company."
        />

        <section className="border-t-[0.5px] border-border px-8 py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-4 text-xl font-medium">
              The second body
            </h2>
            <p className="max-w-2xl text-lg leading-relaxed text-foreground/80">
              A second brain remembers. A second body acts across product,
              marketing, sales, finance, and ops at once. Team of Silicons is
              that body: silicons fused into one orchestrated workforce on your
              cloud.
            </p>
          </div>
        </section>

        <section className="border-t-[0.5px] border-border px-8 py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-10 text-xl font-medium">
              In-house stack
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {inHouseStack.map((item) => (
                <article
                  key={item.name}
                  className="rounded-lg border border-border bg-[#EDE8E0]/30 p-6"
                >
                  <h3 className="mb-2 text-base font-medium">
                    {item.name}
                  </h3>
                  <p className="text-base leading-relaxed text-foreground/80">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t-[0.5px] border-border px-8 py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-4 text-xl font-medium">
              Built in-house = SOTA orchestrator
            </h2>
            <p className="max-w-2xl text-lg leading-relaxed text-foreground/80">
              The entire silicon stack is built in-house: orchestrator, memory,
              trust, integrations, deployment, and observability. That is what
              makes Team of Silicons a state-of-the-art enterprise AI
              orchestrator, not a wrapper on someone else&apos;s agent framework.
            </p>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-foreground/75">
              Silicons share context, coordinate handoffs, and enforce access
              policy as first-class primitives, not bolted-on features.
            </p>
          </div>
        </section>

        <Integrations />
        <CtaSection />
      </main>
    </>
  );
}
