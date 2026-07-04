"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ExpensesCard from "@/components/ExpensesCard";

function getUserId(): number | undefined {
  if (typeof window === "undefined") return undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tg = (window as any)?.Telegram?.WebApp;
  const fromTg = tg?.initDataUnsafe?.user?.id;
  if (fromTg) return Number(fromTg);
  const u = new URLSearchParams(window.location.search).get("user_id");
  return u ? Number(u) : undefined;
}

export default function ExpensesPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<number | undefined>(undefined);
  const [ready, setReady]   = useState(false);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any)?.Telegram?.WebApp?.ready?.();
    setUserId(getUserId());
    setReady(true);
  }, []);

  const wrap = { padding: 12, paddingBottom: `calc(24px + max(env(safe-area-inset-bottom, 0px), 20px))` } as const;

  return (
    <div style={wrap}>
      <button
        onClick={() => router.back()}
        style={{
          background: "transparent", border: "none", color: "var(--accent-primary)",
          fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", padding: "4px 0", marginBottom: 8,
        }}
      >
        ⬅️ Orqaga
      </button>

      {!ready ? (
        <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)" }}>⌛ Yuklanmoqda...</div>
      ) : !userId ? (
        <div style={{ textAlign: "center", paddingTop: 40, color: "var(--danger)", fontWeight: 600 }}>
          ⚠️ Telegram orqali oching
        </div>
      ) : (
        <ExpensesCard userId={userId} />
      )}
    </div>
  );
}
