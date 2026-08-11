import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { ClientsBar } from "@/components/clients-bar";
import { TheShift } from "@/components/the-shift";
import { WhatItDoes } from "@/components/what-it-does";
import { BookletSection } from "@/components/booklet-section";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <ClientsBar />
        <TheShift />
        <WhatItDoes />
        <BookletSection />
      </main>
    </>
  );
}
