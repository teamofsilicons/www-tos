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

/** Hedvig Letters Serif: hero/display serif. */
export const hedvigLettersSerif = localFont({
  src: [
    {
      path: "../fonts/hedvig-letters-serif/HedvigLettersSerif-Regular.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-hedvig-serif",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

/** BDO Grotesk: sans body/UI font. */
export const bdoGrotesk = localFont({
  src: [
    {
      path: "../fonts/bdo-grotesk/BDOGrotesk-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/bdo-grotesk/BDOGrotesk-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/bdo-grotesk/BDOGrotesk-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../fonts/bdo-grotesk/BDOGrotesk-Black.woff2",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-bdo-grotesk",
  display: "swap",
  adjustFontFallback: "Arial",
});
