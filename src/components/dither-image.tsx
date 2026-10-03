import { onCleanup, onMount } from "solid-js";
import { BLUE_NOISE_SIZE, blueNoise } from "~/lib/blue-noise";

/**
 * A photo printed in the hero's three inks (ink, blue, cream) with a blue-noise
 * screen, one dot per CSS pixel. It is a still image until its card is
 * hovered; then the frame pushes in slowly and leans towards the cursor, and
 * the screen re-forms under the moving picture so the grain comes alive.
 */

const PALETTE = [
  [0x18, 0x18, 0x18],
  [0x1f, 0x5c, 0xb1],
  [0xec, 0xe8, 0xde],
] as const;
const LEVELS = PALETTE.length - 1;

const REST_ZOOM = 1;
const HOVER_ZOOM = 1.05;
/** Extra push-in that keeps creeping on for as long as the card is hovered. */
const HOVER_CREEP = 0.05;
const CREEP_SECONDS = 5;
/** Share of the available slack the frame may lean towards the cursor. */
const LEAN = 0.7;

export type DitherTone = {
  /** Point of the photo, in 0–1, that the frame centres and zooms on. */
  focus?: [number, number];
  /** Resting crop beyond cover-fit, e.g. 1.1 trims scan borders. */
  scale?: number;
  /** Source luminance (0–1) that prints as solid ink. */
  black?: number;
  /** Source luminance (0–1) that prints as solid cream. */
  white?: number;
  /** Above 1 pushes mid-tones towards ink, below 1 towards cream. */
  gamma?: number;
  /**
   * How hard each band snaps to its flat ink. 1 is a plain ramp; higher
   * values leave broad solid areas with dither only along the edges, the way
   * the hero image is printed.
   */
  posterize?: number;
};

type Source = { width: number; height: number; luma: Uint8Array };

export function DitherImage(props: { src: string; label: string; tone?: DitherTone }) {
  let canvas!: HTMLCanvasElement;

  onMount(() => {
    const context = canvas.getContext("2d");
    if (!context) return;

    const noise = blueNoise();
    const tone = props.tone ?? {};
    const [focusX, focusY] = tone.focus ?? [0.5, 0.5];
    const scale = tone.scale ?? 1;
    const black = tone.black ?? 0.18;
    const white = tone.white ?? 0.9;
    const gamma = tone.gamma ?? 1.35;
    const posterize = tone.posterize ?? 1.8;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Tone curve as a lookup so the per-pixel loop stays arithmetic-only.
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i += 1) {
      const t = Math.min(1, Math.max(0, (i / 255 - black) / (white - black)));
      const v = Math.pow(t, gamma) * LEVELS;
      const band = Math.min(LEVELS - 1, Math.floor(v));
      const within = Math.min(1, Math.max(0, (v - band - 0.5) * posterize + 0.5));
      curve[i] = band + within;
    }

    let image: HTMLImageElement | undefined;
    let source: Source | undefined;
    let output: ImageData | undefined;
    let disposed = false;
    let frame: number | undefined;
    let lastTime = 0;
    let hovered = false;
    let hoverStart = 0;
    let zoom = REST_ZOOM;
    let leanX = 0;
    let leanY = 0;
    let pointerX = 0;
    let pointerY = 0;

    /**
     * Resample the photo once per size so one source pixel is roughly one
     * screen dot at rest. The browser's scaler does the filtering, and the
     * per-frame loop only has to interpolate.
     */
    const prepareSource = (width: number, height: number) => {
      if (!image) return;
      const aspect = image.naturalWidth / image.naturalHeight;
      const coverScale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
      const sourceWidth = Math.max(2, Math.ceil(image.naturalWidth * coverScale * scale * 1.15));
      const sourceHeight = Math.max(2, Math.ceil(sourceWidth / aspect));

      const scratch = document.createElement("canvas");
      scratch.width = sourceWidth;
      scratch.height = sourceHeight;
      const scratchContext = scratch.getContext("2d", { willReadFrequently: true });
      if (!scratchContext) return;
      scratchContext.imageSmoothingQuality = "high";
      scratchContext.drawImage(image, 0, 0, sourceWidth, sourceHeight);
      const pixels = scratchContext.getImageData(0, 0, sourceWidth, sourceHeight).data;

      const luma = new Uint8Array(sourceWidth * sourceHeight);
      for (let i = 0, p = 0; i < luma.length; i += 1, p += 4) {
        luma[i] = (pixels[p] * 54 + pixels[p + 1] * 183 + pixels[p + 2] * 19) >> 8;
      }
      source = { width: sourceWidth, height: sourceHeight, luma };
    };

    const draw = () => {
      if (!source || !output) return;
      const { width, height } = canvas;
      const { luma, width: sw, height: sh } = source;
      const data = output.data;

      // Visible window of the photo in UV space: cover-fit, then zoomed.
      const sourceAspect = sw / sh;
      const viewAspect = width / height;
      const baseW = (sourceAspect > viewAspect ? viewAspect / sourceAspect : 1) / scale;
      const baseH = (sourceAspect > viewAspect ? 1 : sourceAspect / viewAspect) / scale;
      const windowW = baseW / zoom;
      const windowH = baseH / zoom;
      const centerX = clamp(focusX + leanX * ((baseW - windowW) / 2), windowW / 2, 1 - windowW / 2);
      const centerY = clamp(focusY + leanY * ((baseH - windowH) / 2), windowH / 2, 1 - windowH / 2);
      const left = (centerX - windowW / 2) * sw - 0.5;
      const top = (centerY - windowH / 2) * sh - 0.5;
      const stepX = (windowW * sw) / width;
      const stepY = (windowH * sh) / height;
      const maxX = sw - 1;
      const maxY = sh - 1;

      let p = 0;
      for (let y = 0; y < height; y += 1) {
        const sy = clamp(top + (y + 0.5) * stepY, 0, maxY);
        const y0 = sy | 0;
        const y1 = y0 < maxY ? y0 + 1 : y0;
        const fy = sy - y0;
        const row0 = y0 * sw;
        const row1 = y1 * sw;
        const noiseRow = (y % BLUE_NOISE_SIZE) * BLUE_NOISE_SIZE;

        for (let x = 0; x < width; x += 1) {
          const sx = clamp(left + (x + 0.5) * stepX, 0, maxX);
          const x0 = sx | 0;
          const x1 = x0 < maxX ? x0 + 1 : x0;
          const fx = sx - x0;
          const top0 = luma[row0 + x0] + (luma[row0 + x1] - luma[row0 + x0]) * fx;
          const bottom0 = luma[row1 + x0] + (luma[row1 + x1] - luma[row1 + x0]) * fx;
          const value = curve[(top0 + (bottom0 - top0) * fy) | 0];

          const base = value | 0;
          const threshold = (noise[noiseRow + (x % BLUE_NOISE_SIZE)] + 0.5) / 256;
          const level = base >= LEVELS ? LEVELS : base + (value - base > threshold ? 1 : 0);
          const ink = PALETTE[level];

          data[p] = ink[0];
          data[p + 1] = ink[1];
          data[p + 2] = ink[2];
          data[p + 3] = 255;
          p += 4;
        }
      }

      context.putImageData(output, 0, 0);
      canvas.dataset.ready = "";
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      if (width === canvas.width && height === canvas.height && source) return;

      canvas.width = width;
      canvas.height = height;
      output = context.createImageData(width, height);
      prepareSource(width, height);
      draw();
    };

    const tick = (time: number) => {
      frame = undefined;
      if (disposed) return;
      const dt = Math.min(0.1, (time - lastTime) / 1000);
      lastTime = time;

      const held = hovered ? (time - hoverStart) / 1000 : 0;
      const targetZoom = hovered
        ? HOVER_ZOOM + HOVER_CREEP * (1 - Math.exp(-held / CREEP_SECONDS))
        : REST_ZOOM;
      const targetLeanX = hovered ? pointerX * LEAN : 0;
      const targetLeanY = hovered ? pointerY * LEAN : 0;

      zoom += (targetZoom - zoom) * (1 - Math.exp(-dt * 2.4));
      leanX += (targetLeanX - leanX) * (1 - Math.exp(-dt * 3));
      leanY += (targetLeanY - leanY) * (1 - Math.exp(-dt * 3));

      const settled =
        !hovered &&
        Math.abs(zoom - REST_ZOOM) < 0.0005 &&
        Math.abs(leanX) < 0.002 &&
        Math.abs(leanY) < 0.002;
      if (settled) {
        zoom = REST_ZOOM;
        leanX = 0;
        leanY = 0;
      }

      draw();
      if (!settled) frame = requestAnimationFrame(tick);
    };

    const start = () => {
      if (frame !== undefined || reducedMotion) return;
      lastTime = performance.now();
      frame = requestAnimationFrame(tick);
    };

    // The whole card is the hover target, not just the picture.
    const hoverTarget = canvas.closest<HTMLElement>("[data-dither-hover]") ?? canvas;

    const onEnter = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      hovered = true;
      hoverStart = performance.now();
      onMove(event);
      start();
    };
    const onMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointerX = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
      pointerY = clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);
    };
    const onLeave = () => {
      hovered = false;
      start();
    };

    hoverTarget.addEventListener("pointerenter", onEnter);
    hoverTarget.addEventListener("pointermove", onMove);
    hoverTarget.addEventListener("pointerleave", onLeave);

    const resizeObserver = new ResizeObserver(() => {
      if (image) resize();
    });
    resizeObserver.observe(canvas);

    // Fetch the photo only once the card is close to the viewport.
    const loadObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        loadObserver.disconnect();
        const loader = new Image();
        loader.decoding = "async";
        loader.src = props.src;
        loader.decode().then(
          () => {
            if (disposed) return;
            image = loader;
            resize();
          },
          // A missing photo leaves the ink-coloured frame, which reads fine.
          () => {},
        );
      },
      { rootMargin: "600px 0px" },
    );
    loadObserver.observe(canvas);

    onCleanup(() => {
      disposed = true;
      if (frame !== undefined) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      loadObserver.disconnect();
      hoverTarget.removeEventListener("pointerenter", onEnter);
      hoverTarget.removeEventListener("pointermove", onMove);
      hoverTarget.removeEventListener("pointerleave", onLeave);
    });
  });

  return <canvas ref={canvas} class="dither-image" role="img" aria-label={props.label} />;
}

function clamp(value: number, min: number, max: number) {
  return value < min ? min : value > max ? max : value;
}
