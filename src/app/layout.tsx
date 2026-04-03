import type { Metadata, Viewport } from "next";
import "./globals.css";

const basePath = process.env.NETLIFY === 'true' ? '' : '/BaseballLineup';

export const metadata: Metadata = {
  title: "Baseball Lineup",
  description: "Baseball lineup management tool for coaches",
  icons: {
    apple: `${basePath}/apple-touch-icon.png`,
  },
  appleWebApp: {
    capable: true,
    title: "Lineup",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full md:overflow-hidden overscroll-none">{children}</body>
    </html>
  );
}
