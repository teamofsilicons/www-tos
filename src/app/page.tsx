import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { ClientsBar } from "@/components/clients-bar";
import { TheShift } from "@/components/the-shift";
import { ProofStrip } from "@/components/proof-strip";
import { Timelines } from "@/components/timelines";
import { Outcomes } from "@/components/outcomes";
import { Integrations } from "@/components/integrations";
import { CtaSection } from "@/components/cta-section";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <ClientsBar />
        <TheShift />
        <ProofStrip />
        <Timelines condensed />
        <Outcomes variant="home" />
        <Integrations teaser />
        <CtaSection />
      </main>
    </>
  );
}
