const members = [
  { name: "Team member", college: "College", linkedin: "#" },
  { name: "Team member", college: "College", linkedin: "#" },
  { name: "Team member", college: "College", linkedin: "#" },
  { name: "Team member", college: "College", linkedin: "#" },
];

export function Team({ showIntro = false }: { showIntro?: boolean }) {
  return (
    <section id="team" className="border-t-[0.5px] border-border px-8 py-16">
      <div className="mx-auto max-w-5xl">
        {showIntro ? (
          <p className="mb-10 max-w-2xl text-lg tracking-tight text-foreground/80">
            We have shipped production AI across product, vision, growth, and
            ops, and built the full stack in-house because orchestration is
            the hard part.
          </p>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {members.map((member, i) => (
            <article
              key={i}
              className="rounded-lg border border-border bg-[#EDE8E0]/30 p-5"
            >
              <h3 className="mb-1 text-base font-medium tracking-tight">
                {member.name}
              </h3>
              <p className="mb-3 text-sm tracking-tight text-muted-fg">
                {member.college}
              </p>
              <a
                href={member.linkedin}
                className="text-sm tracking-tight text-[#1F5CB1] hover:underline"
              >
                LinkedIn
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
