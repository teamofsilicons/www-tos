import { createSignal, For, onCleanup, onMount } from "solid-js";

const words =
  "Team of silicons picks up work, brings in the right people when needed, and delivers a finished output.".split(
    " ",
  );

export function TheShift() {
  let section!: HTMLElement;
  const [progress, setProgress] = createSignal(0);

  onMount(() => {
    const update = () => {
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      const scrollRange = section.offsetHeight - vh;

      if (rect.top > vh) return setProgress(0);
      if (rect.bottom < 0 || scrollRange <= 0) return setProgress(1);

      const scrolled = Math.min(Math.max(-rect.top, 0), scrollRange);
      setProgress(scrolled / scrollRange);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    onCleanup(() => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    });
  });

  const filled = () => Math.ceil(progress() * words.length);

  return (
    <section
      ref={section}
      id="the-shift"
      class="relative min-h-[175vh] py-8"
      aria-label="What Team of Silicons does"
    >
      <div class="sticky top-0 flex h-dvh items-center px-4 sm:px-8">
        <div class="flex h-[80vh] w-full items-center rounded-xl border border-[#E7E3D8] bg-[#F6F4EC] px-6 sm:px-10">
          <div class="mx-auto w-full max-w-5xl">
            <h2 class="max-w-4xl text-3xl font-normal leading-[1.2] md:text-4xl lg:text-5xl">
              <For each={words}>
                {(word, i) => (
                  <span
                    class={`transition-colors duration-500 ${
                      i() < filled() ? "text-foreground" : "text-foreground/20"
                    }`}
                  >
                    {word}
                    {i() < words.length - 1 ? " " : ""}
                  </span>
                )}
              </For>
            </h2>
          </div>
        </div>
      </div>
    </section>
  );
}
