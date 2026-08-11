import Image from "next/image";
import Link from "next/link";

// Saved for later: "Work happens at the speed of silicons."

export function Hero() {
  return (
    <section
      id="work"
      className="grid h-dvh grid-rows-[minmax(0,1fr)_30dvh] overflow-hidden"
    >
      <div className="flex min-h-0 flex-col justify-center px-8 pt-14 sm:gap-6">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-start gap-6 sm:gap-8">
          <h1 className="font-serif max-w-3xl text-left text-3xl font-normal leading-[1.12] text-[#1F5CB1] sm:text-4xl md:text-5xl lg:text-6xl">
            A team of AI employees for your company.
          </h1>

          <p className="max-w-xl text-left text-lg leading-relaxed text-foreground/90">
            We deploy a custom AI workforce into your company. In 10 days, your
            silicons are live, learning from your best people and handling the
            work.
          </p>

          <div className="reach-out">
            <Link
              href="mailto:hello@teamofsilicons.com"
              className="button primary text-base"
            >
              Book a Call
            </Link>
            <Link href="#the-shift" className="button secondary text-base">
              See How It Works
            </Link>
          </div>
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
