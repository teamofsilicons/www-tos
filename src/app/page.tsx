import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { ClientsBar } from "@/components/clients-bar";
import { TheShift } from "@/components/the-shift";
import { WhatItDoes } from "@/components/what-it-does";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <ClientsBar />
        <TheShift />
        <WhatItDoes />
      </main>
    </>
  );
}
