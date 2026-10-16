import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FarmSight XAI | Explainable Agriculture Intelligence",
  description: "Live, explainable crop-stress predictions and a farmer-to-buyer marketplace.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
