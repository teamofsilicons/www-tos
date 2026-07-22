const steps = [
  { day: "D1", title: "Briefing", description: "30-min fit call." },
  { day: "D2", title: "Diagnosis", description: "Map your operations." },
  { day: "D4", title: "Architecture", description: "Review and iterate." },
  { day: "D7", title: "Deploy", description: "Live on your cloud." },
  { day: "D10", title: "Elite", description: "Silicons at full speed." },
];

const fullSteps = [
  {
    day: "D1",
    title: "Briefing call",
    description:
      "Understand how Team of Silicons will fit into your business. 30 minutes.",
  },
  {
    day: "D2",
    title: "Diagnosis",
    description:
      "Our technical team maps the details of your operations to design your team of silicons.",
  },
  {
    day: "D4",
    title: "Architecture review",
    description:
      "We show you the architecture, iterate if needed, or start deploying.",
  },
  {
    day: "D7",
    title: "Deploy",
    description:
      "Your team of silicons is live on your cloud, learning from your people and existing work.",
  },
  {
    day: "D10",
    title: "Elite employees",
    description: "Your team of silicons turns into elite employees.",
  },
];

export function Timelines({ condensed = false }: { condensed?: boolean }) {
  const items = condensed ? steps : fullSteps;

  return (
    <section id="timelines" className="border-t-[0.5px] border-border px-8 py-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-10 max-w-xl text-xl font-medium tracking-tight">
          {condensed
            ? "D1 to D10, from first call to elite employees."
            : "Your team of silicons, deployed in ten days."}
        </h2>
        <ol className="grid gap-6 md:grid-cols-5">
          {items.map((step) => (
            <li key={step.day} className="flex flex-col gap-2">
              <span className="font-pixel-square text-lg text-ink">{step.day}</span>
              <h3 className="text-base font-medium tracking-tight">{step.title}</h3>
              <p className="text-sm leading-relaxed tracking-tight text-foreground/75">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
