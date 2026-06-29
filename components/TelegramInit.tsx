"use client";

import { useEffect } from "react";

/**
 * Telegram WebApp init — barcha sahifalar uchun (layout'da bir marta mount).
 * - ready() + expand()
 * - requestFullscreen() — faqat mobil qurilmada (Bot API 8.0+)
 * - disableVerticalSwipes() — scroll qilganda Mini App yopilmasin
 * - safe-area'larni CSS o'zgaruvchilarga yozadi (--app-top / --app-bottom),
 *   device safe-area + Telegram UI insetini birlashtirib.
 */
export default function TelegramInit() {
  useEffect(() => {
    // Yangi Telegram API'lar tip ta'rifida yo'q — any orqali ishlatamiz.
    const tg = (window as unknown as { Telegram?: { WebApp?: any } }).Telegram?.WebApp;
    if (!tg) return;

    try { tg.ready?.(); } catch { /* eski versiya */ }
    try { tg.expand?.(); } catch { /* eski versiya */ }

    // Fullscreen — faqat mobil. Desktop/web'da kerak emas (expand yetarli).
    const plat: string = tg.platform || "";
    const NON_MOBILE = ["tdesktop", "macos", "web", "weba", "webk", "unknown"];
    if (!NON_MOBILE.includes(plat)) {
      try { tg.requestFullscreen?.(); } catch { /* eski versiya — expand yetarli */ }
    }

    // Vertikal swipe bilan tasodifan yopilishni oldini olamiz.
    try { tg.disableVerticalSwipes?.(); } catch { /* eski versiya */ }

    // ── Safe area → CSS o'zgaruvchilar ──────────────────────────────────
    const root = document.documentElement;
    const applySafeArea = () => {
      const sa = tg.safeAreaInset || {};          // device (notch, home indicator)
      const ca = tg.contentSafeAreaInset || {};   // Telegram UI (fullscreen header/X)
      const top    = (Number(sa.top)    || 0) + (Number(ca.top)    || 0);
      const bottom = (Number(sa.bottom) || 0) + (Number(ca.bottom) || 0);
      root.style.setProperty("--app-top", `${top}px`);
      root.style.setProperty("--app-bottom", `${bottom}px`);
    };
    applySafeArea();

    const EVENTS = [
      "safeAreaChanged",
      "contentSafeAreaChanged",
      "fullscreenChanged",
      "viewportChanged",
    ];
    EVENTS.forEach((e) => { try { tg.onEvent?.(e, applySafeArea); } catch { /* noop */ } });

    return () => {
      EVENTS.forEach((e) => { try { tg.offEvent?.(e, applySafeArea); } catch { /* noop */ } });
    };
  }, []);

  return null;
}
