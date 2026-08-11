import Link from "next/link";
import { integrationTools } from "@/lib/content";

export function Integrations({ teaser = false }: { teaser?: boolean }) {
  const tools = teaser ? integrationTools.slice(0, 8) : integrationTools;

  return (
    <section id="integrations" className="border-t-[0.5px] border-border px-8 py-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-10 text-xl font-medium">
          Connect with{" "}
          <span className="font-pixel-square text-foreground">13,750+</span> tools
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {tools.map((tool) => (
            <div
              key={tool}
              className="rounded-lg border border-border bg-[#EDE8E0]/30 px-4 py-3 text-center text-sm text-foreground/80"
            >
              {tool}
            </div>
          ))}
        </div>
        {teaser ? (
          <Link
            href="/product#integrations"
            className="mt-6 inline-block text-sm text-[#1F5CB1] hover:underline"
          >
            See full integrations wall
          </Link>
        ) : null}
      </div>
    </section>
  );
}
