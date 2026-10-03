// Saved for later: "Work happens at the speed of silicons."

export function Hero() {
  return (
    <section id="work" class="grid h-dvh grid-rows-[minmax(0,1fr)_30dvh] overflow-hidden">
      <div class="flex min-h-0 flex-col justify-center px-4 pt-14 sm:gap-6 sm:px-8">
        <div class="mx-auto flex w-full max-w-5xl flex-col items-start gap-6 sm:gap-8">
          <h1 class="font-serif max-w-3xl text-left text-4xl font-normal leading-[1.12] text-[#1F5CB1] md:text-5xl lg:text-6xl">
            A team of AI employees for your company.
          </h1>

          <p class="max-w-xl text-left text-lg leading-relaxed text-foreground/90">
            We deploy a custom AI workforce into your company. In 10 days, your silicons are live,
            learning from your best people and handling the work.
          </p>

          <div class="reach-out w-full sm:w-auto">
            <a href="mailto:hello@teamofsilicons.com" class="button primary text-base">
              Book a Call
            </a>
            <a href="#the-shift" class="button secondary text-base">
              See How It Works
            </a>
          </div>
        </div>
      </div>

      <div class="relative min-h-0 overflow-hidden border-t-[0.5px] border-border">
        <img
          src="/dithering-effect.jpg"
          alt=""
          class="absolute inset-0 h-full w-full object-cover"
          fetchpriority="high"
        />
        <p class="absolute inset-x-0 bottom-4 px-8 text-center font-pixel-square text-sm text-white/90 drop-shadow-sm">
          Enterprise AI Orchestration
        </p>
      </div>
    </section>
  );
}
