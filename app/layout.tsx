import type { Metadata, Viewport } from "next";
import "./globals.css";
import TelegramInit from "@/components/TelegramInit";

export const metadata: Metadata = {
  title: "Vizaro Daromad",
  description: "Daromad boshqaruv tizimi",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // viewport-fit=cover — env(safe-area-inset-*) qiymatlarini faollashtiradi
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="https://telegram.org/js/telegram-web-app.js" />
      </head>
      <body>
        <TelegramInit />
        {children}
      </body>
    </html>
  );
}
