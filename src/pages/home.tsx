import { BookletSection } from "~/components/booklet-section";
import { ClientsBar } from "~/components/clients-bar";
import { Hero } from "~/components/hero";
import { Seo } from "~/components/seo";
import { TheShift } from "~/components/the-shift";
import { WhatItDoes } from "~/components/what-it-does";

export function HomePage() {
  return (
    <main>
      <Seo description="Your team of elite AI employees, deployed in days." />
      <Hero />
      <ClientsBar />
      <TheShift />
      <WhatItDoes />
      <BookletSection />
    </main>
  );
}
