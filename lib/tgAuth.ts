// Telegram WebApp XOM (imzolangan) initData — API chaqiruvlari uchun.
// BOSQICH 1: faqat yuboriladi; API hali TEKSHIRMAYDI (user_id zaxira sifatida qoladi).

export function getInitData(): string {
  if (typeof window === "undefined") return "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tg = (window as any)?.Telegram?.WebApp;
  return tg?.initData || ""; // XOM, imzolangan satr
}

// API chaqiruvlariga qo'shiladigan standart sarlavhalar.
// Mavjud bo'lsa XOM initData'ni X-Telegram-Init-Data header'ida yuboradi.
export function tgHeaders(extra?: Record<string, string>): Record<string, string> {
  const h: Record<string, string> = { ...(extra || {}) };
  const init = getInitData();
  if (init) h["X-Telegram-Init-Data"] = init;
  return h;
}
