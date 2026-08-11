const homeOutcomes = [
  {
    title: "25% KPI baseline",
    description: "We consider 25% growth in KPIs as our baseline.",
  },
  {
    title: "Always hot KT",
    description: "Everything is always documented.",
  },
];

export function Outcomes({ variant = "home" }: { variant?: "home" | "full" }) {
  const outcomes =
    variant === "home"
      ? homeOutcomes
      : [
          ...homeOutcomes,
          {
            title: "Speed of silicons",
            description: "Work happens at the speed of silicons.",
          },
          {
            title: "Strategy, not ops",
            description:
              "Your best people spend their time strategizing and thinking about hard problems.",
          },
        ];

  return (
    <section id="outcomes" className="border-t-[0.5px] border-border px-8 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-4 sm:grid-cols-2">
          {outcomes.map((outcome) => (
            <article
              key={outcome.title}
              className="rounded-lg border border-border bg-[#EDE8E0]/30 p-6"
            >
              <h3 className="mb-2 text-base font-medium">
                {outcome.title}
              </h3>
              <p className="text-base leading-relaxed text-foreground/80">
                {outcome.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
