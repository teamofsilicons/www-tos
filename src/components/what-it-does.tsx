import { For } from "solid-js";
import { DitherImage, type DitherTone } from "~/components/dither-image";

/**
 * Photos are CC0 / public domain, via Openverse:
 * - product: "Free web design wireframes paper", rawpixel
 * - marketing: "Shibuyacrossing Tokyo", Negative Space, StockSnap
 * - sales: "A person ringing ship's bell", U.S. Coast Guard Academy, rawpixel
 * - finance: "Before Computers, Adding Machines", Alan Levine, Wikimedia Commons
 * - operations: "Aerial view of Spencer Street Yards", Public Record Office Victoria
 */
const functions: {
  title: string;
  description: string;
  image: string;
  alt: string;
  tone: DitherTone;
}[] = [
  {
    title: "Product",
    description:
      "Took a feature from spec to deployed in 28 hours, coordinating PM, engineering and marketing along the way.",
    image: "/images/functions/product.jpg",
    alt: "A hand-drawn website wireframe in a sketchbook",
    tone: { focus: [0.5, 0.5] },
  },
  {
    title: "Marketing",
    description:
      "Ran content and SEO end to end, driving a 117% increase in monthly orders within 3 months.",
    image: "/images/functions/marketing.jpg",
    alt: "A crowd crossing beneath giant screens at Shibuya, Tokyo",
    tone: { focus: [0.5, 0.6], black: 0.12, gamma: 1.25 },
  },
  {
    title: "Sales",
    description:
      "Built and enriched a list of qualified leads, narrowed to the ones your team already had a real connection to.",
    image: "/images/functions/sales.jpg",
    alt: "A hand pulling the rope of a brass bell",
    tone: { focus: [0.56, 0.42], scale: 1.08, black: 0.3, white: 0.86, gamma: 1.5 },
  },
  {
    title: "Finance",
    description:
      "Tracked budgets and runway, sent weekly cash flow reports without anyone chasing invoices.",
    image: "/images/functions/finance.jpg",
    alt: "Columns of numbered keys on a vintage adding machine",
    tone: { focus: [0.5, 0.5] },
  },
  {
    title: "Operations",
    description:
      "Cut problem resolution time from 2 days to under 3 hours by routing issues to the right silicon immediately.",
    image: "/images/functions/operations.jpg",
    alt: "Aerial view of a rail yard, one line fanning out into many tracks",
    tone: { focus: [0.5, 0.55], scale: 1.1, black: 0.17, white: 0.8, gamma: 1.4 },
  },
];

export function WhatItDoes() {
  return (
    <section id="what-it-does" class="px-4 py-16 sm:px-8">
      <div class="mx-auto max-w-5xl">
        <h2 class="max-w-2xl text-2xl font-medium leading-snug sm:text-3xl">
          Silicons work across every function.
        </h2>
        <div class="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <For each={functions}>
            {(item) => (
              <article
                data-dither-hover
                class="w-full space-y-1 rounded-xl bg-white p-1 shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
              >
                <div class="relative aspect-video w-full overflow-hidden rounded-t-[10px] rounded-b-[5px] bg-ink">
                  <DitherImage src={item.image} label={item.alt} tone={item.tone} />
                </div>
                <div class="space-y-3 rounded-[5px] bg-neutral-100 p-3.5">
                  <h3 class="font-pixel-square text-2xl capitalize leading-snug text-neutral-900">
                    {item.title}
                  </h3>
                  <p class="text-[15px] font-normal leading-relaxed text-neutral-500">
                    {item.description}
                  </p>
                </div>
              </article>
            )}
          </For>
        </div>
      </div>
    </section>
  );
}
