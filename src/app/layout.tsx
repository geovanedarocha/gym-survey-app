import "../lib/polyfills";
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof globalThis === 'undefined') {
                window.globalThis = window;
                self.globalThis = self;
              }
              if (!window.crypto) {
                window.crypto = {};
              }
              if (!window.crypto.randomUUID) {
                window.crypto.randomUUID = function() {
                  if (typeof window.crypto.getRandomValues === 'function') {
                    return ('10000000-1000-4000-8000-100000000000').replace(/[018]/g, function(c) {
                      var n = Number(c);
                      return (n ^ (window.crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (n / 4)))).toString(16);
                    });
                  }
                  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                    var r = Math.random() * 16 | 0;
                    var v = c === 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                  });
                };
              }
            `,
          }}
        />
      </head>
      <body className="min-h-screen w-full overflow-x-hidden overscroll-none flex flex-col bg-zinc-950" suppressHydrationWarning>{children}</body>
    </html>
  );
}
