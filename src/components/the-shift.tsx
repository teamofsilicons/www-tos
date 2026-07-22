export function TheShift() {
  return (
    <section id="the-shift" className="px-8 py-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-6 max-w-3xl text-xl font-medium tracking-tight">
          team of silicons picks up work, brings in the right people when needed,
          and delivers a finished output.
        </h2>
        <p className="mb-6 max-w-2xl text-lg tracking-tight text-foreground/80">
          Most companies stall at Level 3–4: team pilots and department adoption
          that never connect. We take you to{" "}
          <span className="font-medium text-foreground">Level 8 Orchestrator</span>
          : a coordinated AI workforce running across your entire company.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-lg border border-border bg-[#EDE8E0]/30 p-6">
            <h3 className="mb-2 text-base font-medium tracking-tight">
              Where most stall
            </h3>
            <p className="text-base leading-relaxed tracking-tight text-foreground/80">
              Level 3–4 means isolated experiments: a copilot here, a workflow
              there. Nothing orchestrates across product, ops, and finance at
              once.
            </p>
          </article>
          <article className="rounded-lg border border-[#1F5CB1] bg-[#1F5CB1]/5 p-6">
            <h3 className="mb-2 text-base font-medium tracking-tight text-[#1F5CB1]">
              Level 8 orchestrator
            </h3>
            <p className="text-base leading-relaxed tracking-tight text-foreground/80">
              Silicons coordinate with each other and your people, deploying,
              learning, and executing as one system on your cloud.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
