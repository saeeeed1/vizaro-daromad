"use client";

import { useState, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import type { WorkerDashboardData, IncomeItem } from "@/lib/api";
import CategoryCard from "@/components/CategoryCard";

const PERIODS = ["1 oy", "3 oy", "6 oy", "1 yil"] as const;
const PERIOD_MAP: Record<string, string> = {
  "1 oy": "month", "3 oy": "3month", "6 oy": "6month", "1 yil": "year",
};

function fmt(amount: number, currency?: string) {
  if (currency === "UZS")
    return new Intl.NumberFormat("uz").format(amount) + " so'm";
  return "$" + new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
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

      {/* ── Stat kartalar ─────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: hideSubmission ? "1fr" : "1fr 1fr 1fr", gap: 8 }}>
        {(hideSubmission
          ? [{ icon: "📦", val: data.week_count, label: "Bu hafta kirimlar" }]
          : [
              { icon: "📦", val: data.week_count,      label: "Kirimlar"    },
              { icon: "✅", val: data.confirmed_count, label: "Topshirildi" },
              { icon: "⏳", val: data.pending_count,   label: "Kutilmoqda"  },
            ]
        ).map(({ icon, val, label }) => (
          <div key={label} className="card" style={{ textAlign: "center", padding: "12px 8px" }}>
            <div style={{ fontSize: "1.3rem" }}>{icon}</div>
            <div style={{ color: "var(--accent-primary)", fontWeight: 700, fontSize: "1.3rem" }}>{val}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

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
            <XAxis dataKey="day" tick={{ fill: "#7ab87a", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#7ab87a", fontSize: 10 }} axisLine={false} tickLine={false}
              tickFormatter={(v: number) => v === 0 ? "" : `$${v}`} />
            <Tooltip
              contentStyle={{ background: "#132213", border: "1px solid #1e3a1e", borderRadius: 10, fontSize: 12 }}
              labelStyle={{ color: "#e8f5e8", fontWeight: 600 }}
              formatter={(v) => [`$${Number(v).toFixed(2)}`, "Daromad"]}
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
