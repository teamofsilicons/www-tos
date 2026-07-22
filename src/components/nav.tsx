"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const navLinks = [
  { href: "/product", label: "Product" },
  { href: "/case-studies", label: "Case Studies" },
  { href: "/security", label: "Security" },
  { href: "/pricing", label: "Pricing" },
  { href: "/team", label: "Team" },
];

const pillShellClass =
  "inline-flex items-center h-9 rounded-lg border border-neutral-200 bg-white/70 p-1 shadow-md backdrop-blur-md";

const pillLinkClass =
  "relative z-10 inline-flex items-center h-7 rounded py-1 px-2 text-sm tracking-tight transition-colors focus-visible:ring-4 focus-visible:ring-blue-200 focus:text-foreground hover:text-foreground";

type IndicatorState = {
  width: number;
  transform: number;
  opacity: number;
};

export function Nav() {
  const pathname = usePathname();
  const pillRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);
  const [animateIndicator, setAnimateIndicator] = useState(false);
  const [indicator, setIndicator] = useState<IndicatorState>({
    width: 0,
    transform: 0,
    opacity: 0,
  });

  const activeHref =
    navLinks.find(
      (link) =>
        pathname === link.href ||
        (link.href !== "/" && pathname.startsWith(`${link.href}/`)),
    )?.href ?? null;

  const positionIndicator = useCallback(
    (href: string | null, animated: boolean) => {
      if (!href) {
        setAnimateIndicator(animated);
        setIndicator((prev) => ({ ...prev, opacity: 0 }));
        return;
      }

      const el = linkRefs.current.get(href);
      if (!el) return;

      setAnimateIndicator(animated);
      setIndicator({
        width: el.offsetWidth,
        transform: el.offsetLeft,
        opacity: 1,
      });
    },
    [],
  );

  useEffect(() => {
    const onResize = () => {
      positionIndicator(hoveredHref ?? activeHref, false);
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [activeHref, hoveredHref, positionIndicator]);

  const handleLinkEnter = (href: string) => {
    setHoveredHref(href);
    positionIndicator(href, true);
  };

  const handlePillLeave = () => {
    setHoveredHref(null);
    positionIndicator(activeHref, true);
  };

  const isHighlighted = (href: string) =>
    hoveredHref === href || (!hoveredHref && href === activeHref);

  return (
    <nav className="pointer-events-none fixed inset-x-0 top-0 isolate z-50 px-8 py-4">
      <div className="flex items-center justify-between">
        <Link href="/" className="pointer-events-auto flex shrink-0 select-none">
          <Image
            src="/team-of-silicons-logo.svg"
            alt="Team of Silicons"
            width={197}
            height={28}
            className="h-7 w-auto"
            priority
          />
        </Link>

        <div className="pointer-events-auto flex items-center gap-3">
          <div
            ref={pillRef}
            className={`relative flex ${pillShellClass}`}
            onMouseLeave={handlePillLeave}
          >
            <div
              className="absolute left-0 -z-10 h-7 rounded bg-[#EDE8E0] backdrop-blur will-change-[transform,width]"
              style={{
                width: indicator.width,
                transform: `translateX(${indicator.transform}px)`,
                opacity: indicator.opacity,
                transitionProperty: "width, transform, opacity",
                transitionDuration: animateIndicator ? "200ms" : "0ms",
                transitionTimingFunction: "ease",
              }}
            />

            {navLinks.map((link) => (
              <Link
                key={link.href}
                ref={(el) => {
                  if (el) linkRefs.current.set(link.href, el);
                  else linkRefs.current.delete(link.href);
                }}
                href={link.href}
                onMouseEnter={() => handleLinkEnter(link.href)}
                onFocus={() => handleLinkEnter(link.href)}
                className={`${pillLinkClass} ${
                  isHighlighted(link.href)
                    ? "text-foreground"
                    : "text-neutral-600"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className={pillShellClass}>
            <Link
              href="/#contact"
              className={`${pillLinkClass} text-foreground hover:bg-[#1F5CB1] hover:text-white`}
            >
              Book a call
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
