"use client";

import { useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import type { WorkerDashboardData, IncomeItem } from "@/lib/api";

const PERIODS = ["1 oy", "3 oy", "6 oy", "1 yil"] as const;

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
  data, name,
}: {
  data: WorkerDashboardData;
  name: string;
}) {
  const [period, setPeriod] = useState(0);
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

      {/* ── 3 stat karta ──────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[
          { icon: "📦", val: data.week_count,      label: "Kirimlar" },
          { icon: "✅", val: data.confirmed_count, label: "Topshirildi" },
          { icon: "⏳", val: data.pending_count,   label: "Kutilmoqda" },
        ].map(({ icon, val, label }) => (
          <div key={label} className="card" style={{ textAlign: "center", padding: "12px 8px" }}>
            <div style={{ fontSize: "1.3rem" }}>{icon}</div>
            <div style={{ color: "var(--accent-primary)", fontWeight: 700, fontSize: "1.3rem" }}>{val}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* ── Chart ─────────────────────────────────── */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>📈 Daromad grafigi</span>
          <div style={{ display: "flex", gap: 4, background: "var(--bg-secondary)", borderRadius: 20, padding: 3 }}>
            {PERIODS.map((p, i) => (
              <button key={p} className={`tab-btn${period === i ? " active" : ""}`} onClick={() => setPeriod(i)}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={data.chart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
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
