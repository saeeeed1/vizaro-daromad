"use client";

import { useState, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import type { WorkerDashboardData, IncomeItem } from "@/lib/api";
import CategoryCard from "@/components/CategoryCard";
import { DEBT_COLOR } from "@/lib/debt";

const PERIODS = ["1 oy", "3 oy", "6 oy", "1 yil"] as const;
const PERIOD_MAP: Record<string, string> = {
  "1 oy": "month", "3 oy": "3month", "6 oy": "6month", "1 yil": "year",
};

function fmt(amount: number, currency?: string) {
  if (currency === "UZS")
    return new Intl.NumberFormat("uz").format(amount) + " so'm";
  return "$" + new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

const UZ_M_FULL = ["yan", "fev", "mar", "apr", "may", "iyun",
                   "iyul", "avg", "sen", "okt", "noy", "dek"];
// "2026-06-08" → "8-iyun" (tooltip sanasi)
function prettyDate(d: string): string {
  const p = String(d).split("-");
  if (p.length !== 3) return d;
  return `${Number(p[2])}-${UZ_M_FULL[Number(p[1]) - 1] ?? ""}`;
}

function relDate(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diff === 0) return "Bugun";
  if (diff === 1) return "Kecha";
  return `${diff} kun oldin`;
}

function statusBadge(s: string) {
  if (s === "confirmed") return <span className="badge badge-green">✅</span>;
  if (s === "rejected")  return <span className="badge badge-red">❌</span>;
  return <span className="badge badge-yellow">⏳</span>;
}

export default function WorkerDashboard({
  data, name, hideSubmission = false, userId,
}: {
  data: WorkerDashboardData;
  name: string;
  hideSubmission?: boolean;
  userId: number;
}) {
  const [period, setPeriod]             = useState("1 oy");
  const [chartData, setChartData]       = useState(data.chart);
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    setPeriod("1 oy");
    setChartLoading(true);
    fetch(`/api/dashboard?user_id=${userId}&period=month`)
      .then(r => r.json())
      .then(j => { if (j.chart) setChartData(j.chart); })
      .catch(() => setChartData(data.chart))
      .finally(() => setChartLoading(false));
  }, [data, userId]);

  const handlePeriodClick = async (label: string) => {
    if (period === label) return;
    setPeriod(label);
    setChartLoading(true);
    try {
      const res  = await fetch(`/api/dashboard?user_id=${userId}&period=${PERIOD_MAP[label]}`);
      const json = await res.json();
      if (json.chart) setChartData(json.chart);
    } catch {
      // network error — keep current chart
    } finally {
      setChartLoading(false);
    }
  };

  const weekPct = data.month_total > 0
    ? Math.min(100, (data.week_total / data.month_total) * 100)
    : 0;

  // X o'qi UNIKAL "date" bo'yicha — tooltip aniq nuqtani topishi uchun.
  // Tik yorliqlari (Du/Se.. yoki oy) uchun date→day xaritasi.
  const dayByDate: Record<string, string> = {};
  chartData.forEach((p) => { dayByDate[String(p.date)] = String(p.day); });

  return (
    <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 12 }}>

      {/* ── Hero card ─────────────────────────────── */}
      <div className="card" style={{ background: "linear-gradient(135deg, #132213, #1a2e1a)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <div style={{ color: "var(--accent-primary)", fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.08em" }}>
              💰 VIZARO DAROMAD
            </div>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.78rem", marginTop: 2 }}>
              {name}
            </div>
          </div>
          <span className="badge badge-green">Menejer</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 12 }}>
          <div>
            <div className="stat-label">Bu hafta</div>
            <div className="stat-value">{fmt(data.week_total)}</div>
          </div>
          <div>
            <div className="stat-label">Bu oy</div>
            <div className="stat-value" style={{ color: "var(--accent-second)" }}>
              {fmt(data.month_total)}
            </div>
          </div>
        </div>

        <div className="stat-label" style={{ marginBottom: 6 }}>
          Hafta — oy nisbati: {weekPct.toFixed(0)}%
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${weekPct}%` }} />
        </div>
      </div>

      {/* ── Stat kartalar (oylik ma'lumot) ─────────── */}
      {(() => {
        const ms = data.month_stats ?? {
          total_count: data.month_count,
          submitted_count: 0,
          pending_count: data.month_count,
        };
        const cards = hideSubmission
          ? [{ icon: "📦", val: ms.total_count, label: "Bu oy kirimlar" }]
          : [
              { icon: "📦", val: ms.total_count,     label: "Kirimlar"    },
              { icon: "✅", val: ms.submitted_count, label: "Topshirildi" },
              { icon: "⏳", val: ms.pending_count,   label: "Kutilmoqda"  },
            ];
        return (
          <div style={{ display: "grid", gridTemplateColumns: hideSubmission ? "1fr" : "1fr 1fr 1fr", gap: 8 }}>
            {cards.map(({ icon, val, label }) => (
              <div key={label} className="card" style={{ textAlign: "center", padding: "12px 8px" }}>
                <div style={{ fontSize: "1.3rem" }}>{icon}</div>
                <div style={{ color: "var(--accent-primary)", fontWeight: 700, fontSize: "1.3rem" }}>{val}</div>
                <div className="stat-label">{label}</div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* ── Qarzdorlik holati ──────────────────────── */}
      {data.debt && data.debt.remaining > 0.005 && (() => {
        const dc = DEBT_COLOR[data.debt.level];
        return (
          <div
            style={{
              border: `1px solid ${dc}55`,
              borderLeft: `4px solid ${dc}`,
              borderRadius: 14,
              padding: "14px 16px",
              background: `${dc}12`,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: dc, marginBottom: 10 }}>
              ⚠️ Qarzdorlik holati
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: "var(--text-secondary)", fontSize: "0.84rem" }}>Topshirilmagan:</span>
              <span style={{ color: dc, fontWeight: 700, fontSize: "0.9rem" }}>
                ${data.debt.remaining.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary)", fontSize: "0.84rem" }}>⏱ Eng eski:</span>
              <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "0.84rem" }}>
                {data.debt.oldest_days} kun oldin
              </span>
            </div>
            <div style={{
              marginTop: 10, paddingTop: 10, borderTop: `1px solid ${dc}33`,
              color: "var(--text-muted)", fontSize: "0.78rem", textAlign: "center",
            }}>
              Iltimos, bugalterga topshiring
            </div>
          </div>
        );
      })()}

      {/* ── Pending submissions (qizil karta) ───────── */}
      {data.pending_submissions && data.pending_submissions.length > 0 && (
        <div style={{
          border: "1px solid #ef444433",
          borderLeft: "3px solid #ef4444",
          borderRadius: 12,
          padding: "12px 14px",
          background: "#ef44440d",
        }}>
          <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#ef4444", marginBottom: 10 }}>
            ⚠️ Topshirilmagan kirimlar
          </div>
          {data.pending_submissions.map((sub) => (
            <div key={sub.week_start} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>{sub.week}</span>
              <span style={{ fontWeight: 600, color: "#ef4444", fontSize: "0.82rem" }}>
                ${sub.total.toFixed(2)}
              </span>
            </div>
          ))}
          <div style={{
            borderTop: "1px solid #ef444433", paddingTop: 8, marginTop: 4,
            display: "flex", justifyContent: "space-between",
          }}>
            <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Jami qarzdorlik:</span>
            <span style={{ fontWeight: 700, color: "#ef4444", fontSize: "0.88rem" }}>
              ${(data.pending_total_all ?? 0).toFixed(2)}
            </span>
          </div>
          <button
            onClick={() => window.Telegram?.WebApp?.close?.()}
            style={{
              marginTop: 10, width: "100%", padding: "8px 0",
              background: "#ef4444", color: "#fff", border: "none",
              borderRadius: 8, fontWeight: 600, fontSize: "0.85rem", cursor: "pointer",
            }}
          >
            📦 Hozir topshirish
          </button>
        </div>
      )}

      {/* ── Chart ─────────────────────────────────── */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>📈 Daromad grafigi</span>
          <div style={{ display: "flex", gap: 4, background: "var(--bg-secondary)", borderRadius: 20, padding: 3 }}>
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => handlePeriodClick(p)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 16,
                  border: "none",
                  fontSize: "0.75rem",
                  fontWeight: period === p ? 700 : 400,
                  background: period === p ? "var(--accent-primary)" : "transparent",
                  color: period === p ? "#000" : "var(--text-secondary)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={160}>
          <AreaChart
            data={chartLoading ? [] : chartData}
            margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="gGreen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#00d084" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#00d084" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a1e" />
            <XAxis dataKey="date"
              tickFormatter={(d) => dayByDate[String(d)] ?? String(d)}
              interval="preserveStartEnd" minTickGap={18}
              tick={{ fill: "#7ab87a", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#7ab87a", fontSize: 10 }} axisLine={false} tickLine={false}
              tickFormatter={(v: number) => v === 0 ? "" : `$${v}`} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const pt = payload[0].payload as { date?: string; total?: number };
                return (
                  <div style={{ background: "#132213", border: "1px solid #1e3a1e",
                                borderRadius: 10, padding: "6px 10px", fontSize: 12 }}>
                    <div style={{ color: "#e8f5e8", fontWeight: 600, marginBottom: 2 }}>
                      {prettyDate(String(pt.date ?? ""))}
                    </div>
                    <div style={{ color: "#00d084", fontWeight: 700 }}>
                      ${Number(pt.total ?? 0).toFixed(2)}
                    </div>
                  </div>
                );
              }}
            />
            <Area type="monotone" dataKey="total" stroke="#00d084" strokeWidth={2}
              fill="url(#gGreen)" dot={false} activeDot={{ r: 4, fill: "#00d084" }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Kategoriya bo'yicha ───────────────────── */}
      <CategoryCard categories={data.categories} />

      {/* ── Oxirgi kirimlar ───────────────────────── */}
      <div className="card safe-bottom">
        <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: 10 }}>
          🕐 Oxirgi kirimlar
        </div>
        {data.recent.length === 0 ? (
          <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "20px 0" }}>
            Hali kirim yo&apos;q
          </div>
        ) : (
          data.recent.map((inc: IncomeItem) => (
            <div key={inc.id} className="income-row">
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{inc.description}</div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", marginTop: 2 }}>
                  {relDate(inc.date)}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                <div style={{ color: "var(--accent-primary)", fontWeight: 700, fontSize: "0.92rem" }}>
                  {fmt(inc.amount, inc.currency)}
                </div>
                {statusBadge(inc.status)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
