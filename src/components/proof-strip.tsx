const stats = [
  { value: "25%", label: "KPI growth baseline" },
  { value: "10 days", label: "Silicons become elite employees" },
  { value: "13,750+", label: "Tools connected" },
];

export function ProofStrip() {
  return (
    <section className="border-t-[0.5px] border-border px-8 py-12">
      <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center sm:text-left">
            <p className="font-pixel-square text-3xl text-ink sm:text-4xl">
              {stat.value}
            </p>
            <p className="mt-2 text-sm tracking-tight text-foreground/75">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
