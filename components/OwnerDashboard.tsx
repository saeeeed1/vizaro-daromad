"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import type { OwnerDashboardData, WorkerStat } from "@/lib/api";

const WORKER_COLORS = ["#00d084", "#00ff9d", "#ffd700", "#ffa502", "#ff6b9d"];
const MEDALS = ["🥇", "🥈", "🥉"];

function fmt(n: number) {
  return "$" + new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function subBadge(status: WorkerStat["sub_status"]) {
  if (status === "confirmed") return <span className="badge badge-green">✅</span>;
  if (status === "pending")   return <span className="badge badge-yellow">⏳</span>;
  return <span className="badge" style={{ background: "rgba(74,107,74,0.2)", color: "var(--text-muted)" }}>—</span>;
}

export default function OwnerDashboard({ data }: { data: OwnerDashboardData }) {
  const submittedPct = data.total_month > 0
    ? (data.submitted_total / data.total_month) * 100
    : 0;

  const workerNames = data.workers.map((w) => w.name);

  return (
    <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 12 }}>

      {/* ── Hero ──────────────────────────────────── */}
      <div className="card" style={{ background: "linear-gradient(135deg, #0f1a0f, #1a2e1a)" }}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: "var(--accent-primary)", fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.08em" }}>
            👁 OWNER PANEL
          </div>
          <div style={{ color: "var(--text-secondary)", fontSize: "0.78rem", marginTop: 2 }}>
            Bu oy umumiy daromad
          </div>
        </div>

        <div className="stat-value" style={{ fontSize: "2rem", marginBottom: 14 }}>
          {fmt(data.total_month)}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span className="stat-label">Tasdiqlangan</span>
          <span style={{ color: "var(--accent-primary)", fontWeight: 600, fontSize: "0.82rem" }}>
            {fmt(data.submitted_total)}
          </span>
        </div>
        <div className="progress-bar" style={{ marginBottom: 8 }}>
          <div className="progress-fill" style={{ width: `${submittedPct}%` }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span className="stat-label">Kutilmoqda</span>
          <span style={{ color: "var(--warning)", fontWeight: 600, fontSize: "0.82rem" }}>
            {fmt(data.pending_total)}
          </span>
        </div>
      </div>

      {/* ── Ishchilar reytingi ─────────────────────── */}
      <div className="card">
        <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: 12 }}>
          🏆 Menejerlar reytingi
        </div>

        {data.workers.map((w, i) => (
          <div key={w.id} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "1.1rem" }}>{MEDALS[i] ?? `${i + 1}.`}</span>
                <div>
                  <span style={{ fontWeight: 600, fontSize: "0.88rem" }}>{w.name}</span>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.72rem", marginLeft: 6 }}>
                    {w.role === "accountant" ? "🧮" : ""}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: WORKER_COLORS[i] ?? "#00d084", fontWeight: 700, fontSize: "0.92rem" }}>
                  {fmt(w.month_total)}
                </span>
                {subBadge(w.sub_status)}
              </div>
            </div>
            <div className="progress-bar">
              <div
                style={{
                  height: "100%",
                  borderRadius: 2,
                  background: WORKER_COLORS[i] ?? "#00d084",
                  width: `${w.percentage}%`,
                  transition: "width 0.6s ease",
                }}
              />
            </div>
            <div style={{ textAlign: "right", color: "var(--text-muted)", fontSize: "0.7rem", marginTop: 3 }}>
              {w.percentage.toFixed(1)}%
            </div>
          </div>
        ))}
      </div>

      {/* ── Haftalik Stats ─────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div className="card" style={{ textAlign: "center" }}>
          <div className="stat-label">Bu hafta</div>
          <div className="stat-value">{fmt(data.total_week)}</div>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <div className="stat-label">Bu oy</div>
          <div className="stat-value" style={{ color: "var(--accent-second)" }}>
            {fmt(data.total_month)}
          </div>
        </div>
      </div>

      {/* ── Stacked Chart ─────────────────────────── */}
      <div className="card safe-bottom">
        <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: 12 }}>
          📊 Oylik daromad
        </div>

        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data.chart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              {workerNames.map((name, i) => (
                <linearGradient key={name} id={`g${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={WORKER_COLORS[i] ?? "#00d084"} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={WORKER_COLORS[i] ?? "#00d084"} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a1e" />
            <XAxis dataKey="day" tick={{ fill: "#7ab87a", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#7ab87a", fontSize: 10 }} axisLine={false} tickLine={false}
              tickFormatter={(v: number) => v === 0 ? "" : `$${v}`} />
            <Tooltip
              contentStyle={{ background: "#132213", border: "1px solid #1e3a1e", borderRadius: 10, fontSize: 12 }}
              labelStyle={{ color: "#e8f5e8", fontWeight: 600 }}
              formatter={(v, name) => [`$${Number(v).toFixed(2)}`, String(name)]}
            />
            {workerNames.map((name, i) => (
              <Area key={name} type="monotone" dataKey={name}
                stroke={WORKER_COLORS[i] ?? "#00d084"} strokeWidth={2}
                fill={`url(#g${i})`} dot={false}
                activeDot={{ r: 4, fill: WORKER_COLORS[i] ?? "#00d084" }}
                stackId="1"
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
