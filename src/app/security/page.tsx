import { Nav } from "@/components/nav";
import { PageHeader } from "@/components/page-header";
import { CtaSection } from "@/components/cta-section";
import { trustLevels } from "@/lib/content";

export default function SecurityPage() {
  return (
    <>
      <Nav />
      <main>
        <PageHeader
          title="Security"
          description="Your cloud. Your keys. Granular trust for every silicon and every person."
        />

        <section className="border-t-[0.5px] border-border px-8 py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-4 text-xl font-medium tracking-tight">
              Your cloud, your keys
            </h2>
            <p className="max-w-2xl text-lg leading-relaxed tracking-tight text-foreground/80">
              Your team of silicons is hosted on your cloud. All backups and
              messages are encrypted with keys only you hold, not ours, not a
              vendor&apos;s.
            </p>
            <ul className="mt-6 space-y-3 text-base tracking-tight text-foreground/75">
              <li>Deploy in your VPC or private cloud</li>
              <li>Customer-managed encryption keys</li>
              <li>Encrypted backups and message history</li>
              <li>Audit logs for every silicon action</li>
            </ul>
          </div>
        </section>

        <section id="silicon-trust" className="border-t-[0.5px] border-border px-8 py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-4 text-xl font-medium tracking-tight">
              Silicon Trust
            </h2>
            <p className="mb-10 max-w-2xl text-lg tracking-tight text-foreground/80">
              Six levels of trust for granular access control inside your
              company. You choose what someone or a silicon can see and do.
            </p>
            <ol className="space-y-4">
              {trustLevels.map((level) => (
                <li
                  key={level.level}
                  className="rounded-lg border border-border bg-[#EDE8E0]/20 p-6"
                >
                  <div className="mb-2 flex items-baseline gap-3">
                    <span className="font-pixel-square text-sm text-ink">
                      L{level.level}
                    </span>
                    <h3 className="text-base font-medium tracking-tight">
                      {level.name}
                    </h3>
                  </div>
                  <p className="mb-3 text-base leading-relaxed tracking-tight text-foreground/80">
                    {level.description}
                  </p>
                  <p className="text-sm leading-relaxed tracking-tight text-muted-fg">
                    <span className="text-foreground/70">Example: </span>
                    {level.example}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <CtaSection />
      </main>
    </>
  );
}
