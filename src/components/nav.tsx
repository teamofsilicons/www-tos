import { A, useLocation } from "@solidjs/router";
import { createSignal, For, onCleanup, onMount } from "solid-js";

const navLinks = [
  { href: "/products", label: "Products" },
  { href: "/writings", label: "Writings" },
];

const pillShellClass =
  "inline-flex items-center h-9 rounded-lg border border-neutral-200 bg-white/70 p-1 shadow-md backdrop-blur-md";

const pillLinkClass =
  "relative z-10 inline-flex items-center h-7 rounded py-1 px-2 text-sm transition-colors focus-visible:ring-4 focus-visible:ring-blue-200 focus:text-foreground hover:text-foreground";

export function Nav() {
  const location = useLocation();
  const linkRefs = new Map<string, HTMLAnchorElement>();
  const [hoveredHref, setHoveredHref] = createSignal<string | null>(null);
  const [animate, setAnimate] = createSignal(false);
  const [indicator, setIndicator] = createSignal({ width: 0, left: 0, opacity: 0 });

  const activeHref = () =>
    navLinks.find(
      (link) => location.pathname === link.href || location.pathname.startsWith(`${link.href}/`),
    )?.href ?? null;

  const positionIndicator = (href: string | null, animated: boolean) => {
    setAnimate(animated);
    const el = href ? linkRefs.get(href) : undefined;
    if (!el) {
      setIndicator((prev) => ({ ...prev, opacity: 0 }));
      return;
    }
    setIndicator({ width: el.offsetWidth, left: el.offsetLeft, opacity: 1 });
  };

  const isHighlighted = (href: string) =>
    hoveredHref() === href || (!hoveredHref() && href === activeHref());

  onMount(() => {
    const sync = () => positionIndicator(hoveredHref() ?? activeHref(), false);
    sync();
    // Fonts swap in after first paint and change the pill widths.
    document.fonts?.ready.then(sync);
    window.addEventListener("resize", sync);
    onCleanup(() => window.removeEventListener("resize", sync));
  });

  return (
    <nav class="pointer-events-none fixed inset-x-0 top-0 isolate z-50 px-4 py-4 sm:px-8">
      <div class="flex items-center justify-between gap-3">
        <A
          href="/"
          class="pointer-events-auto flex shrink-0 select-none"
          aria-label="Team of Silicons home"
        >
          <img
            src="/team-of-silicons-logo.svg"
            alt="Team of Silicons"
            width="197"
            height="28"
            class="hidden h-7 w-auto sm:block"
          />
          <img src="/logo.svg" alt="Team of Silicons" width="36" height="36" class="size-9 sm:hidden" />
        </A>

        <div class="pointer-events-auto flex items-center gap-2 sm:gap-3">
          <div
            class={`relative flex ${pillShellClass}`}
            onMouseLeave={() => {
              setHoveredHref(null);
              positionIndicator(activeHref(), true);
            }}
          >
            <div
              class="absolute left-0 -z-10 h-7 rounded bg-[#EDE8E0] will-change-[transform,width]"
              style={{
                width: `${indicator().width}px`,
                transform: `translateX(${indicator().left}px)`,
                opacity: indicator().opacity,
                "transition-property": "width, transform, opacity",
                "transition-duration": animate() ? "200ms" : "0ms",
                "transition-timing-function": "ease",
              }}
            />
            <For each={navLinks}>
              {(link) => (
                <A
                  ref={(el) => linkRefs.set(link.href, el)}
                  href={link.href}
                  onMouseEnter={() => {
                    setHoveredHref(link.href);
                    positionIndicator(link.href, true);
                  }}
                  onFocus={() => {
                    setHoveredHref(link.href);
                    positionIndicator(link.href, true);
                  }}
                  onBlur={() => {
                    setHoveredHref(null);
                    positionIndicator(activeHref(), true);
                  }}
                  onClick={() => queueMicrotask(() => positionIndicator(activeHref(), true))}
                  class={`${pillLinkClass} ${isHighlighted(link.href) ? "text-foreground" : "text-neutral-600"}`}
                  activeClass=""
                  inactiveClass=""
                >
                  {link.label}
                </A>
              )}
            </For>
          </div>

          <div class={pillShellClass}>
            <a
              href="mailto:hello@teamofsilicons.com"
              class={`${pillLinkClass} text-foreground hover:bg-[#1F5CB1] hover:text-white`}
            >
              Book a call
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
