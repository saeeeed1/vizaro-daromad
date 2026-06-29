"use client";

import { useEffect, useState } from "react";

import { fetchAccountant } from "@/lib/api";
import type { AccountantData, AccountantManager } from "@/lib/api";
import { DEBT_COLOR } from "@/lib/debt";

const GREEN = "#22c55e";
const YELLOW = "#f59e0b";

function fmtUSD(n: number) {
  return "$" + new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

// ── Davr tablari: Bu hafta / Bu oy ─────────────────────────────────────────────
function PeriodTabs({
  period,
  onChange,
}: {
  period: "week" | "month";
  onChange: (p: "week" | "month") => void;
}) {
  const tabs: { key: "week" | "month"; label: string }[] = [
    { key: "week", label: "Bu hafta" },
    { key: "month", label: "Bu oy" },
  ];
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {tabs.map(({ key, label }) => {
        const active = period === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            style={{
              flex: 1,
              padding: "10px 0",
              background: active ? "#00c07a" : "#1a1a1a",
              color: active ? "#000" : "#888",
              border: "none",
              borderRadius: 10,
              cursor: "pointer",
              fontWeight: active ? 700 : 500,
              fontSize: "0.85rem",
              transition: "background 0.15s, color 0.15s",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ── Bitta menejer kartasi (to'liq qarzdorlik ma'lumoti) ─────────────────────────
function ManagerCard({ m }: { m: AccountantManager }) {
  const hasPending = m.pending > 0.005;
  const debtColor  = m.debt_level ? DEBT_COLOR[m.debt_level] : GREEN;
  // Rang KARTA border/foni'da — qarzdorlik darajasi bo'yicha (toza, nuqtasiz)
  const accent = hasPending ? debtColor : GREEN;
  const days   = m.oldest_days ?? 0;

  return (
    <div
      style={{
        border: `1px solid ${accent}33`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: 10,
        padding: "12px 14px",
        marginBottom: 10,
        background: `${accent}0d`,
      }}
    >
      <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 8 }}>{m.name}</div>
      <div style={{ height: 1, background: "var(--border)", marginBottom: 8 }} />

      {/* ✅ Topshirgan */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: hasPending ? 6 : 0 }}>
        <span style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>✅ Topshirgan:</span>
        <span style={{ color: GREEN, fontWeight: 700, fontSize: "0.85rem" }}>{fmtUSD(m.submitted)}</span>
      </div>

      {/* ⏳ Qarzi (debt_level rangida) */}
      {hasPending && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: days > 0 ? 6 : 0 }}>
          <span style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>⏳ Qarzi:</span>
          <span style={{ color: debtColor, fontWeight: 700, fontSize: "0.85rem" }}>{fmtUSD(m.pending)}</span>
        </div>
      )}

      {/* ⏱ Eng eski qarz */}
      {hasPending && days > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>⏱ Eng eski:</span>
          <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "0.82rem" }}>
            {days} kun oldin
          </span>
        </div>
      )}
    </div>
  );
}

// ── Umumiy karta ───────────────────────────────────────────────────────────────
function SummaryCard({ data }: { data: AccountantData }) {
  const { submitted, pending, total } = data.summary;
  return (
    <div className="card">
      <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: 10 }}>📊 Umumiy holat</div>
      <div style={{ height: 1, background: "var(--border)", margin: "0 0 10px" }} />

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ color: "var(--text-secondary)", fontSize: "0.84rem" }}>✅ Topshirilgan:</span>
        <span style={{ fontWeight: 700, fontSize: "0.9rem", color: GREEN }}>{fmtUSD(submitted)}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ color: "var(--text-secondary)", fontSize: "0.84rem" }}>⏳ Kutilayotgan:</span>
        <span style={{ fontWeight: 700, fontSize: "0.9rem", color: YELLOW }}>{fmtUSD(pending)}</span>
      </div>

      <div style={{ height: 1, background: "var(--border)", margin: "10px 0" }} />

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ color: "var(--text-secondary)", fontSize: "0.86rem" }}>💰 Jami:</span>
        <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--accent-primary)" }}>{fmtUSD(total)}</span>
      </div>
    </div>
  );
}

// ── Asosiy komponent (o'zi fetch qiladi) ────────────────────────────────────────
export default function AccountantDashboard({
  userId,
  name,
}: {
  userId: number;
  name: string;
}) {
  const [period, setPeriod] = useState<"week" | "month">("week");
  const [data, setData] = useState<AccountantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(false);
    fetchAccountant(userId, period)
      .then((d) => { if (alive) setData(d); })
      .catch(() => { if (alive) setError(true); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [userId, period]);

  return (
    <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Hero */}
      <div className="card" style={{ background: "linear-gradient(135deg, #0f1a0f, #1a2e1a)" }}>
        <div style={{ color: "var(--accent-primary)", fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.08em" }}>
          🧮 BUGALTER PANEL
        </div>
        <div style={{ color: "var(--text-secondary)", fontSize: "0.78rem", marginTop: 3 }}>
          {name}{data ? ` · ${data.period_label}` : ""}
        </div>
      </div>

      {/* Davr tablari */}
      <PeriodTabs period={period} onChange={setPeriod} />

      {loading ? (
        <div className="card" style={{ textAlign: "center", padding: "30px 0", color: "var(--text-muted)" }}>
          Yuklanmoqda…
        </div>
      ) : error ? (
        <div className="card" style={{ textAlign: "center", padding: "24px 0", color: "var(--danger)" }}>
          ⚠️ Ma&apos;lumot yuklanmadi
        </div>
      ) : data ? (
        <>
          <SummaryCard data={data} />

          {/* Menejerlar */}
          <div className="card safe-bottom">
            <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: 12 }}>👥 Menejerlar</div>
            {data.managers.length === 0 ? (
              <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "24px 0" }}>
                Hali ma&apos;lumot yo&apos;q
              </div>
            ) : (
              data.managers.map((m) => <ManagerCard key={m.worker_id} m={m} />)
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
