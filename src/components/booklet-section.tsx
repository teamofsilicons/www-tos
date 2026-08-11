"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  BOOKLET_PAGE_COUNT,
  bookletPageSrc,
  bookletSheets,
} from "@/lib/booklet-pages";

gsap.registerPlugin(ScrollTrigger);

const LEAD_IN = 0.06;
const LEAD_OUT = 0.08;
const SHEET_COUNT = bookletSheets.length;
const CURL_STRIPS = 16;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Nested strips: each hinge is the previous strip's free edge → real curl. */
function CurlStrip({
  index,
  total,
  src,
}: {
  index: number;
  total: number;
  src: string;
}) {
  return (
    <div
      className="booklet-curl__strip"
      style={
        {
          "--i": index,
          "--n": total,
          backgroundImage: `url(${src})`,
        } as React.CSSProperties
      }
    >
      {index < total - 1 ? (
        <CurlStrip index={index + 1} total={total} src={src} />
      ) : null}
    </div>
  );
}

function BookletFace({
  src,
  side,
  alt,
}: {
  src: string;
  side: "front" | "back";
  alt: string;
}) {
  return (
    <div
      className={`booklet-face booklet-face--${side}`}
      role="img"
      aria-label={alt}
    >
      <div
        className="booklet-face__art"
        style={{ backgroundImage: `url(${src})` }}
      />
      <div className="booklet-curl">
        <CurlStrip index={0} total={CURL_STRIPS} src={src} />
      </div>
      {/* Overlays stay in a flat layer so they don't flatten strip 3D. */}
      <div className="booklet-face__overlays" aria-hidden>
        <div className="booklet-face__grain" />
        <div className="booklet-face__sheen" />
        <div className="booklet-face__curl-ridge" />
        <div className="booklet-face__gutter" />
        <div className="booklet-face__shade" />
      </div>
    </div>
  );
}

export function BookletSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const sheetRefs = useRef<(HTMLDivElement | null)[]>([]);
  const leftGutterRef = useRef<HTMLDivElement>(null);
  const rightGutterRef = useRef<HTMLDivElement>(null);
  const leftBlockRef = useRef<HTMLDivElement>(null);
  const rightBlockRef = useRef<HTMLDivElement>(null);
  const spineRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const book = bookRef.current;
    if (!section || !book) return;

    const sheets = sheetRefs.current.filter(Boolean) as HTMLDivElement[];
    if (sheets.length !== SHEET_COUNT) return;

    const render = (turned: number) => {
      const turnedClamped = clamp(turned, 0, SHEET_COUNT);
      // Snap with the same epsilon as fullyTurned so a scrub of 0.999
      // still reveals the left page and the next right page.
      const turnedSnapped = Math.floor(turnedClamped + 0.002);
      const topTurnedIndex = turnedSnapped - 1;
      const topUnturnedIndex = Math.min(SHEET_COUNT - 1, turnedSnapped);

      let liftAmount = 0;
      let coverOpen = 0;
      let backClosed = 0;

      sheets.forEach((sheet, index) => {
        const local = clamp(turnedClamped - index, 0, 1);
        const eased = easeInOutCubic(local);
        const arc = Math.sin(eased * Math.PI);
        // Epsilon so scrub never sticks mid-turn at 0.999 with the next
        // page hidden, and so we don't swap to the strip mesh for dust.
        const flipping = local > 0.002 && local < 0.998;
        const fullyTurned = local >= 0.998;
        const waiting = local <= 0.002;
        const useCurl = flipping && arc > 0.04;

        if (index === 0) coverOpen = eased;
        if (index === SHEET_COUNT - 1) backClosed = eased;
        liftAmount = Math.max(liftAmount, arc);

        const showFaces =
          flipping ||
          (fullyTurned && index === topTurnedIndex) ||
          (waiting && index === topUnturnedIndex);

        const depth = flipping
          ? 300
          : fullyTurned
            ? 100 + index
            : 200 - index;

        // Curl peaks mid-turn; free edge leads the spine.
        const curl = useCurl ? arc : 0;
        const curlPos = useCurl
          ? `${clamp(8 + eased * 84, 8, 92)}%`
          : "50%";

        sheet.style.zIndex = String(depth);
        sheet.style.setProperty("--front-shade", String(arc * 0.5));
        sheet.style.setProperty("--back-shade", String(arc * 0.38));
        sheet.style.setProperty("--edge", String(useCurl ? arc : 0));
        sheet.style.setProperty("--faces", showFaces ? "1" : "0");
        /* visibility avoids opacity-flattening of preserve-3d curl strips */
        sheet.style.setProperty(
          "--faces-vis",
          showFaces ? "visible" : "hidden",
        );
        sheet.style.setProperty(
          "--overlay-vis",
          useCurl ? "hidden" : "visible",
        );
        // Full art when resting; strip mesh only while the page curls.
        sheet.style.setProperty("--art-vis", useCurl ? "hidden" : "visible");
        sheet.style.setProperty("--curl-vis", useCurl ? "visible" : "hidden");
        sheet.style.setProperty("--curl", String(curl));
        sheet.style.setProperty("--curl-pos", curlPos);
        sheet.style.setProperty("--turn", String(eased));

        // No translateZ while flipping — Z under perspective pulls the hinge
        // off the binding. Stacking uses z-index only; curl is strip rotateY.
        const stackZ = flipping
          ? 0
          : fullyTurned
            ? index * 0.4
            : (SHEET_COUNT - index) * 0.4;

        // Spine hinge must stay planted — GSAP defaults to 50% 50% which
        // orbits the sheet around its center and lifts the binding edge.
        gsap.set(sheet, {
          transformOrigin: "left center",
          rotateY: -180 * eased,
          rotateX: 0,
          z: stackZ,
        });
      });

      const openAmount = clamp(coverOpen, 0, 1);
      const closeAmount = clamp(backClosed, 0, 1);
      gsap.set(book, {
        transformOrigin: "50% 50%",
        xPercent: -25 * (1 - openAmount) + 25 * closeAmount,
      });

      gsap.set(leftGutterRef.current, {
        autoAlpha: openAmount * (1 - closeAmount * 0.85),
      });
      gsap.set(rightGutterRef.current, {
        autoAlpha: (1 - closeAmount) * Math.min(1, openAmount + 0.15),
      });
      gsap.set(spineRef.current, {
        autoAlpha: 0.25 + openAmount * 0.75 * (1 - closeAmount * 0.5),
      });

      const leftStack = clamp(turnedClamped / SHEET_COUNT, 0, 1);
      gsap.set(leftBlockRef.current, {
        autoAlpha: openAmount * 0.9,
        scaleX: 0.2 + leftStack * 0.8,
      });
      gsap.set(rightBlockRef.current, {
        autoAlpha: (1 - closeAmount) * 0.9,
        scaleX: 0.2 + (1 - leftStack) * 0.8,
      });

      gsap.set(shadowRef.current, {
        scaleX: 0.58 + Math.min(openAmount, 1 - closeAmount) * 0.42,
        opacity: 0.45 + liftAmount * 0.35,
      });

      const spread = clamp(Math.round(turnedClamped), 0, SHEET_COUNT);
      const label =
        spread === 0
          ? `01 / ${BOOKLET_PAGE_COUNT}`
          : spread === SHEET_COUNT
            ? `${BOOKLET_PAGE_COUNT} / ${BOOKLET_PAGE_COUNT}`
            : `${String(spread * 2).padStart(2, "0")}–${String(spread * 2 + 1).padStart(2, "0")} / ${BOOKLET_PAGE_COUNT}`;

      if (counterRef.current && counterRef.current.textContent !== label) {
        counterRef.current.textContent = label;
      }
      gsap.set(progressRef.current, {
        scaleX: clamp(turnedClamped / SHEET_COUNT, 0, 1),
      });
    };

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducedMotion) {
      render(1);
      return;
    }

    render(0);

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.35,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const span = 1 - LEAD_IN - LEAD_OUT;
        const t = clamp((self.progress - LEAD_IN) / span, 0, 1);
        render(t * SHEET_COUNT);
      },
    });

    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener("resize", onResize);
    ScrollTrigger.refresh();

    return () => {
      window.removeEventListener("resize", onResize);
      trigger.kill();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="booklet"
      className="booklet-section relative h-[700vh]"
      aria-label="Team of Silicons offer booklet"
    >
      <div className="booklet-pin sticky top-0 flex h-dvh flex-col justify-center px-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center">
          <div className="booklet-stage">
            <div className="booklet-stage__light" aria-hidden />

            <div ref={bookRef} className="booklet-book">
              <div className="booklet-half booklet-half--left">
                <div className="booklet-half__paper" aria-hidden />
                <div
                  ref={leftGutterRef}
                  className="booklet-half__gutter"
                  aria-hidden
                />
              </div>

              <div className="booklet-half booklet-half--right">
                <div className="booklet-half__paper" aria-hidden />
                <div
                  ref={rightGutterRef}
                  className="booklet-half__gutter"
                  aria-hidden
                />
              </div>

              <div
                ref={leftBlockRef}
                className="booklet-block booklet-block--left"
                aria-hidden
              />
              <div
                ref={rightBlockRef}
                className="booklet-block booklet-block--right"
                aria-hidden
              />

              {bookletSheets.map((sheet, index) => (
                <div
                  key={sheet.front}
                  ref={(el) => {
                    sheetRefs.current[index] = el;
                  }}
                  className="booklet-sheet"
                >
                  <BookletFace
                    src={bookletPageSrc(sheet.front)}
                    side="front"
                    alt={
                      index === 0
                        ? "Offer booklet front cover"
                        : `Booklet page ${sheet.front}`
                    }
                  />
                  <BookletFace
                    src={bookletPageSrc(sheet.back)}
                    side="back"
                    alt={
                      index === SHEET_COUNT - 1
                        ? "Offer booklet back cover"
                        : `Booklet page ${sheet.back}`
                    }
                  />
                  <div className="booklet-sheet__edge" aria-hidden />
                  <div className="booklet-sheet__curl-shadow" aria-hidden />
                </div>
              ))}

              <div className="booklet-hinge" aria-hidden />

              <div ref={spineRef} className="booklet-spine" aria-hidden>
                <div className="booklet-spine__band" />
                {Array.from({ length: 6 }).map((_, i) => (
                  <span
                    key={i}
                    className="booklet-spine__stitch"
                    style={{ "--i": i } as React.CSSProperties}
                  />
                ))}
              </div>
            </div>

            <div ref={shadowRef} className="booklet-stage__shadow" aria-hidden />
          </div>

          <div className="booklet-meta">
            <span className="booklet-meta__label">Offer Booklet</span>
            <div className="booklet-meta__track" aria-hidden>
              <div ref={progressRef} className="booklet-meta__bar" />
            </div>
            <span ref={counterRef} className="booklet-meta__counter">
              01 / {BOOKLET_PAGE_COUNT}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
