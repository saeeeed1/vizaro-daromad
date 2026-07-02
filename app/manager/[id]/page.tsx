"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { fetchManagerDetail } from "@/lib/api";
import type { ManagerDetail } from "@/lib/api";
import CategoryCard from "@/components/CategoryCard";
import IncomeRow from "@/components/IncomeRow";
import { DEBT_COLOR } from "@/lib/debt";

function fmtUSD(n: number) {
  return "$" + new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function getOwnerId(): number | undefined {
  if (typeof window === "undefined") return undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tg = (window as any)?.Telegram?.WebApp;
  const fromTg = tg?.initDataUnsafe?.user?.id;
  if (fromTg) return Number(fromTg);
  const u = new URLSearchParams(window.location.search).get("user_id");
  return u ? Number(u) : undefined;
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ flex: 1, background: "#161616", border: "1px solid #222", borderRadius: 12, padding: "12px 10px", textAlign: "center" }}>
      <div style={{ color, fontWeight: 700, fontSize: "1rem" }}>{value}</div>
      <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", marginTop: 3 }}>{label}</div>
    </div>
  );
}

function ManagerDetailInner() {
  const params = useParams();
  const search = useSearchParams();
  const router = useRouter();

  const managerId = Number(params?.id);
  const period    = search.get("period") || "month";

  const [data,    setData]    = useState<ManagerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any)?.Telegram?.WebApp?.ready?.();
    const ownerId = getOwnerId();
    if (!ownerId || !managerId) {
      setError("Telegram orqali oching");
      setLoading(false);
      return;
    }
    fetchManagerDetail(ownerId, managerId, period)
      .then((d) => setData(d))
      .catch(() => setError("Ma'lumot yuklanmadi"))
      .finally(() => setLoading(false));
  }, [managerId, period]);

  const wrap = { padding: 12, paddingBottom: `calc(24px + max(env(safe-area-inset-bottom, 0px), 20px))` } as const;

  if (loading) {
    return <div style={{ padding: 24, textAlign: "center", paddingTop: 80, color: "var(--text-muted)" }}>⌛ Yuklanmoqda...</div>;
  }
  if (error || !data) {
    return (
      <div style={wrap}>
        <BackButton onClick={() => router.back()} />
        <div style={{ textAlign: "center", paddingTop: 60, color: "var(--danger)", fontWeight: 600 }}>
          ⚠️ {error || "Ma'lumot yo'q"}
        </div>
      </div>
    );
  }

  const incomes = showAll ? data.incomes : data.incomes.slice(0, 15);
  const debtColor = DEBT_COLOR[data.debt.level] ?? "var(--text-muted)";

  return (
    <div style={wrap}>
      <BackButton onClick={() => router.back()} />

      {/* Sarlavha */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "#e0e0e0" }}>{data.name}</div>
        <div style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginTop: 2 }}>{data.period_label}</div>
      </div>

      {/* 3 ta stat */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <StatCard label="Kirim" value={fmtUSD(data.total)} color="#00c07a" />
        <StatCard label="Topshirgan" value={fmtUSD(data.submitted)} color="var(--accent-primary)" />
        <StatCard label="Qarz (bu oy)" value={fmtUSD(data.debt.remaining)} color={debtColor} />
      </div>

      {/* Kategoriyalar (mavjud komponent) */}
      <CategoryCard categories={data.categories} />

      {/* Kirimlar ro'yxati */}
      <div className="card" style={{ marginTop: 12 }}>
        <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: 10 }}>🕐 Kirimlar</div>
        {data.incomes.length === 0 ? (
          <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "20px 0" }}>Kirim yo&apos;q</div>
        ) : (
          <>
            {incomes.map((inc) => <IncomeRow key={inc.id} inc={inc} />)}
            {data.incomes.length > 15 && (
              <button
                onClick={() => setShowAll(!showAll)}
                style={{
                  width: "100%", marginTop: 10, padding: "9px 0",
                  background: "transparent", border: "1px solid var(--border)",
                  borderRadius: 10, color: "var(--accent-primary)",
                  fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
                }}
              >
                {showAll ? "Yopish ⌃" : `Yana ko'rsatish (${data.incomes.length - 15} ta) ⌄`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "transparent", border: "none", color: "var(--accent-primary)",
        fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", padding: "4px 0", marginBottom: 8,
      }}
    >
      ⬅️ Orqaga
    </button>
  );
}

export default function ManagerDetailPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24, textAlign: "center", paddingTop: 80, color: "var(--text-muted)" }}>⌛ Yuklanmoqda...</div>}>
      <ManagerDetailInner />
    </Suspense>
  );
}
