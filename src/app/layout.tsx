import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRATEFALL — open crates, feel something",
  description:
    "A deliberately habit-forming loot-crate economy. Simulated money, real psychology.",
};

export const viewport: Viewport = {
  themeColor: "#05060d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="cf-bg min-h-screen text-white antialiased selection:bg-fuchsia-500/40">
        {children}
      </body>
    </html>
  );
}
