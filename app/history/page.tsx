"use client";

import { useEffect, useState } from "react";
import { SkeletonBlock } from "@/components/Skeleton";
import { fetchMe, fetchHistory } from "@/lib/api";
import type { IncomeItem } from "@/lib/api";

function getUserId(): number {
  if (typeof window !== "undefined") {
    const tg = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (tg?.id) return tg.id;
    const uid = new URLSearchParams(window.location.search).get("user_id");
    if (uid) return parseInt(uid);
  }
  return 0;
}

function fmt(amount: number, currency: string) {
  if (currency === "UZS")
    return new Intl.NumberFormat("uz").format(amount) + " so'm";
  return "$" + new Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(amount);
}

export default function HistoryPage() {
  const [incomes, setIncomes] = useState<IncomeItem[]>([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    const uid = getUserId();
    if (!uid) { setError("Telegram orqali oching"); setLoading(false); return; }

    fetchMe(uid).then((u) => {
      if (!u.authorized) { setError("⛔ Ruxsat yo'q"); setLoading(false); return; }
      return fetchHistory(uid, 50);
    }).then((h) => {
      if (h) { setIncomes(h.incomes); setTotal(h.total); }
    }).catch(() => setError("API ulanmadi"))
    .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: 12 }}>
      <div style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: 12 }}>
        📋 Kirimlar tarixi
      </div>

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {Array.from({ length: 8 }).map((_, i) => <SkeletonBlock key={i} h={52} />)}
        </div>
      )}

      {error && (
        <div style={{ color: "var(--danger)", textAlign: "center", padding: 40 }}>{error}</div>
      )}

      {!loading && !error && (
        <>
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12,
            padding: "10px 14px", marginBottom: 12, display: "flex", justifyContent: "space-between",
          }}>
            <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
              {incomes.length} ta kirim
            </span>
            <span style={{ color: "var(--accent-primary)", fontWeight: 700 }}>
              ${total.toFixed(2)}
            </span>
          </div>

          <div className="card safe-bottom">
            {incomes.length === 0 && (
              <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "30px 0" }}>
                Kirim yo&apos;q
              </div>
            )}
            {incomes.map((inc) => (
              <div key={inc.id} className="income-row">
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{inc.description}</div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", marginTop: 2 }}>
                    {inc.date}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "var(--accent-primary)", fontWeight: 700, fontSize: "0.9rem" }}>
                    {fmt(inc.amount, inc.currency)}
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>
                    ${inc.amount_usd.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
