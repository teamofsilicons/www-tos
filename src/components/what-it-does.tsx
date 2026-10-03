import { For, type Component } from "solid-js";
import {
  FinanceScene,
  MarketingScene,
  OperationsScene,
  ProductScene,
  SalesScene,
} from "~/components/illustrations";

const functions: { title: string; description: string; Scene: Component }[] = [
  {
    title: "Product",
    description:
      "Took a feature from spec to deployed in 28 hours, coordinating PM, engineering and marketing along the way.",
    Scene: ProductScene,
  },
  {
    title: "Marketing",
    description:
      "Ran content and SEO end to end, driving a 117% increase in monthly orders within 3 months.",
    Scene: MarketingScene,
  },
  {
    title: "Sales",
    description:
      "Built and enriched a list of qualified leads, narrowed to the ones your team already had a real connection to.",
    Scene: SalesScene,
  },
  {
    title: "Finance",
    description:
      "Tracked budgets and runway, sent weekly cash flow reports without anyone chasing invoices.",
    Scene: FinanceScene,
  },
  {
    title: "Operations",
    description:
      "Cut problem resolution time from 2 days to under 3 hours by routing issues to the right silicon immediately.",
    Scene: OperationsScene,
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
              <article class="w-full space-y-1 rounded-xl bg-white p-1 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                <div class="relative aspect-video w-full overflow-hidden rounded-t-[10px] rounded-b-[5px] bg-ink">
                  <item.Scene />
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
