"use client";

import { useEffect, useRef, useState } from "react";

const text =
  "Team of silicons picks up work, brings in the right people when needed, and delivers a finished output.";

const words = text.split(" ");

export function TheShift() {
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const updateProgress = () => {
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      const scrollRange = section.offsetHeight - vh;

      if (rect.top > vh) {
        setProgress(0);
        return;
      }

      if (rect.bottom < 0 || scrollRange <= 0) {
        setProgress(1);
        return;
      }

      const scrolled = Math.min(Math.max(-rect.top, 0), scrollRange);
      setProgress(scrolled / scrollRange);
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  const filledWordCount = Math.ceil(progress * words.length);

  return (
    <section
      ref={sectionRef}
      id="the-shift"
      className="relative min-h-[175vh] py-8"
      aria-label="What Team of Silicons does"
    >
      <div className="sticky top-0 flex h-dvh items-center px-8">
        <div className="flex h-[80vh] w-full items-center rounded-xl border border-[#E7E3D8] bg-[#F6F4EC]">
          <div className="mx-auto w-full max-w-5xl">
            <h2 className="max-w-4xl text-2xl font-normal leading-[1.2] sm:text-3xl md:text-4xl lg:text-5xl">
              {words.map((word, i) => (
                <span
                  key={`${word}-${i}`}
                  className={`transition-colors duration-500 ${
                    i < filledWordCount ? "text-foreground" : "text-foreground/20"
                  }`}
                >
                  {word}
                  {i < words.length - 1 ? " " : ""}
                </span>
              ))}
            </h2>
          </div>
        </div>
      </div>
    </section>
  );
}
