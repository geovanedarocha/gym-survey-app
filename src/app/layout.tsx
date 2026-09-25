import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Skyfit Pesquisa de Satisfação",
  description: "Totem de pesquisa de satisfação para academia SkyFit",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Skyfit",
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
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-zinc-950`}
      suppressHydrationWarning
    >
      <body className="min-h-screen w-full overflow-x-hidden overscroll-none flex flex-col bg-zinc-950" suppressHydrationWarning>{children}</body>
    </html>
  );
}
