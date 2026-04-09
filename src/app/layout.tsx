import type { Metadata, Viewport } from "next";
import "./globals.css";

const isStaging = process.env.NEXT_PUBLIC_IS_STAGING === 'true';

export const metadata: Metadata = {
  title: isStaging ? "[STAGE] Baseball Lineup" : "Baseball Lineup",
  description: "Baseball lineup management tool for coaches",
  icons: {
    icon: isStaging ? '/favicon-stage.png' : '/Favicon.png',
    apple: '/Lineup_128-128.png',
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
  themeColor: "#181818",
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
