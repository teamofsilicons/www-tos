import Image from "next/image";
import Link from "next/link";

// Saved for later: "Work happens at the speed of silicons."

export function Hero() {
  return (
    <section
      id="work"
      className="grid h-dvh grid-rows-[minmax(0,1fr)_30dvh] overflow-hidden"
    >
      <div className="flex min-h-0 flex-col items-center justify-center gap-4 px-8 pt-14 sm:gap-6">
        <h1 className="font-pixel-grid max-w-2xl text-center text-2xl font-light leading-[1.12] sm:text-3xl md:text-4xl lg:text-5xl">
          You are{" "}
          <span className="text-ink">3 days</span> away from your team of elite
          employees.
        </h1>

        <p className="max-w-xl text-center text-lg leading-relaxed tracking-tight text-foreground/80">
          We deploy a custom AI workforce into your company. In 10 days, your
          silicons are live, learning from your best people and handling the
          work.
        </p>

        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/#contact"
            className="inline-flex w-full items-center justify-center rounded-md bg-[#1F5CB1] px-6 py-2.5 text-base font-normal text-white transition-opacity hover:opacity-90 sm:w-auto"
          >
            Book a call
          </Link>
          <Link
            href="#timelines"
            className="inline-flex w-full items-center justify-center rounded-md border border-border px-6 py-2.5 text-base text-foreground transition-colors hover:bg-[#EDE8E0]/50 sm:w-auto"
          >
            See how it works
          </Link>
        </div>
      </div>

      <div className="relative min-h-0 overflow-hidden border-t-[0.5px] border-border">
        <Image
          src="/dithering-effect.jpg"
          alt=""
          fill
          priority
          className="object-cover"
        />
        <p className="absolute inset-x-0 bottom-4 px-8 text-center font-pixel-square text-sm text-white/90 drop-shadow-sm">
          Enterprise AI Orchestration
        </p>
      </div>
    </section>
  );
}
