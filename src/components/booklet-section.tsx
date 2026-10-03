import { createSignal, onCleanup, onMount } from "solid-js";
import { BOOKLET_PAGE_COUNT, bookletPageSrc } from "~/lib/booklet-pages";

export function BookletSection() {
  let section!: HTMLElement;
  let canvas!: HTMLCanvasElement;
  let fallback!: HTMLDivElement;
  let counter!: HTMLSpanElement;
  let progressBar!: HTMLDivElement;
  const [status, setStatus] = createSignal<"loading" | "ready" | "failed">("loading");

  onMount(() => {
    let cancelled = false;
    let teardown: (() => void) | undefined;

    // three.js is the bulk of the bundle, so it only loads with the home page
    // booklet, after first paint.
    import("~/lib/booklet-scene")
      .then(({ createBookletScene }) => {
        if (cancelled) return;
        teardown = createBookletScene({
          section,
          canvas,
          fallback,
          counter,
          progressBar,
          setStatus,
        });
      })
      .catch(() => {
        if (!cancelled) setStatus("failed");
      });

    onCleanup(() => {
      cancelled = true;
      teardown?.();
    });
  });

  return (
    <section
      ref={section}
      id="booklet"
      class="booklet-section relative h-[700vh]"
      data-status={status()}
      aria-label="Team of Silicons offer booklet"
    >
      <div class="sticky top-0 h-dvh overflow-hidden">
        <canvas
          ref={canvas}
          class="booklet-canvas"
          role="img"
          aria-label="Interactive 3D offer booklet. Scroll to turn its pages."
        />

        <div ref={fallback} class="booklet-fallback" aria-hidden={status() === "ready"}>
          <img src={bookletPageSrc(1)} alt="Offer booklet front cover" loading="lazy" />
        </div>

        <div class="booklet-meta">
          <span class="booklet-meta__label">Scroll to turn</span>
          <div class="booklet-meta__track" aria-hidden="true">
            <div ref={progressBar} class="booklet-meta__bar" />
          </div>
          <span ref={counter} class="booklet-meta__counter" aria-live="polite">
            01 / {BOOKLET_PAGE_COUNT}
          </span>
        </div>

        <p class="sr-only" role="status" aria-live="polite">
          {status() === "loading"
            ? "Interactive 3D offer booklet loading."
            : status() === "failed"
              ? "3D booklet unavailable. Showing the cover image."
              : "Interactive 3D offer booklet ready. Scroll to turn its pages."}
        </p>
      </div>
    </section>
  );
}
