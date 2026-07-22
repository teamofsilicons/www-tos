import { Nav } from "@/components/nav";
import { PageHeader } from "@/components/page-header";
import { Team } from "@/components/team";
import { CtaSection } from "@/components/cta-section";

export default function TeamPage() {
  return (
    <>
      <Nav />
      <main>
        <PageHeader
          title="Team"
          description="The people building the orchestrator, not reselling someone else's agents."
        />
        <Team showIntro />
        <CtaSection />
      </main>
    </>
  );
}
