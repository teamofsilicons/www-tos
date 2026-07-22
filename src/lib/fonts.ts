import localFont from "next/font/local";
import { GeistPixelSquare, GeistPixelGrid } from "geist/font/pixel";

/**
 * Geist Pixel: the display/style font, from Vercel's official `geist`
 * package (https://vercel.com/font?type=pixel).
 *
 * - Square: logo/wordmark, nav, small pixel accents.
 * - Grid: large display headlines (hero).
 */
export { GeistPixelSquare, GeistPixelGrid };

/** Aktiv Grotesk: sans body/UI font. */
export const aktivGrotesk = localFont({
  src: [
    {
      path: "../fonts/aktiv-grotesk/AktivGrotesk-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/aktiv-grotesk/AktivGrotesk-Medium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/aktiv-grotesk/AktivGrotesk-Bold.otf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-aktiv-grotesk",
  display: "swap",
  adjustFontFallback: "Arial",
});
