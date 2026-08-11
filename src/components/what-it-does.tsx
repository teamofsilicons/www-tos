import Link from "next/link";

const functions = [
  {
    slug: "product",
    title: "Product",
    description:
      "Took a feature from spec to deployed in 28 hours, coordinating PM, engineering and marketing along the way.",
  },
  {
    slug: "marketing",
    title: "Marketing",
    description:
      "Ran content and SEO end to end, driving a 117% increase in monthly orders within 3 months.",
  },
  {
    slug: "sales",
    title: "Sales",
    description:
      "Built and enriched a list of qualified leads, narrowed to the ones your team already had a real connection to.",
  },
  {
    slug: "finance",
    title: "Finance",
    description:
      "Tracked budgets and runway, sent weekly cash flow reports without anyone chasing invoices.",
  },
  {
    slug: "operations",
    title: "Operations",
    description:
      "Cut problem resolution time from 2 days to under 3 hours by routing issues to the right silicon immediately.",
  },
];

function FunctionCard({
  title,
  description,
  slug,
}: {
  title: string;
  description: string;
  slug: string;
}) {
  return (
    <Link
      href={`/case-studies/${slug}`}
      className="block w-full max-w-sm space-y-1 rounded-xl bg-white p-1 shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
    >
      <div className="relative aspect-video w-full overflow-hidden rounded-t-[10px] rounded-b-[5px] bg-neutral-100">
        <div
          className="absolute inset-0 bg-[#e3e5e4]"
          role="img"
          aria-label={`${title} preview`}
        />
      </div>
      <div className="space-y-3 rounded-[5px] bg-neutral-100 p-3.5">
        <h3 className="font-pixel-square text-2xl capitalize leading-snug text-neutral-900">
          {title}
        </h3>
        <p className="text-[15px] font-normal leading-relaxed text-neutral-500">
          {description}
        </p>
      </div>
    </Link>
  );
}

export function WhatItDoes() {
  return (
    <section id="what-it-does" className="px-8 pb-16 pt-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="max-w-2xl text-2xl font-medium leading-snug sm:text-3xl">
          Silicons work across every function.
        </h2>
        <div className="mt-10 grid grid-cols-1 justify-items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {functions.map((item) => (
            <FunctionCard
              key={item.slug}
              slug={item.slug}
              title={item.title}
              description={item.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
