import Link from "next/link";

export function CtaSection({
  title = "Ready to build your team of silicons?",
  description = "Book a call and we will map how Team of Silicons fits your business.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <section id="contact" className="border-t-[0.5px] border-border px-8 py-16">
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="font-pixel-grid mb-4 text-2xl font-light tracking-tight sm:text-3xl">
          {title}
        </h2>
        <p className="mx-auto mb-8 max-w-lg text-lg tracking-tight text-foreground/80">
          {description}
        </p>
        <Link
          href="mailto:hello@teamofsilicons.com"
          className="inline-flex items-center justify-center rounded-md bg-[#1F5CB1] px-6 py-2.5 text-base font-normal text-white transition-opacity hover:opacity-90"
        >
          Book a call
        </Link>
      </div>
    </section>
  );
}
