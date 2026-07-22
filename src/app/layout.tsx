import type { Metadata } from "next";
import { GeistPixelSquare, GeistPixelGrid, aktivGrotesk } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Team of Silicons",
  description: "Your team of elite AI employees, deployed in days.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${aktivGrotesk.variable} ${GeistPixelSquare.variable} ${GeistPixelGrid.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
