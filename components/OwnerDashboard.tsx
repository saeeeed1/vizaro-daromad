"use client";

import { useState, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import type { OwnerDashboardData, WorkerStat, OwnerPeriodData, ManagerStat } from "@/lib/api";

const WORKER_COLORS = ["#00d084", "#00ff9d", "#ffd700", "#ffa502", "#ff6b9d"];
const MEDALS        = ["🥇", "🥈", "🥉"];
const PERIODS       = ["1 oy", "3 oy", "6 oy", "1 yil"] as const;
const PERIOD_API: Record<string, string> = {
  "1 oy": "month", "3 oy": "3month", "6 oy": "6month", "1 yil": "year",
};

function fmt(n: number) {
  return "$" + new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(n);
}

function subBadge(status: WorkerStat["sub_status"]) {
  if (status === "confirmed") return <span className="badge badge-green">✅</span>;
  if (status === "pending")   return <span className="badge badge-yellow">⏳</span>;
  return (
    <span className="badge" style={{ background: "rgba(74,107,74,0.2)", color: "var(--text-muted)" }}>
      —
    </span>
  );
}

export default function OwnerDashboard({ data }: { data: OwnerDashboardData }) {
  const [period,  setPeriod]  = useState("1 oy");
  const [pdata,   setPdata]   = useState<OwnerPeriodData | null>(null);
  const [loading, setLoading] = useState(false);

  // Telegram user ID — always available in WebApp context
  const userId: number | undefined =
    typeof window !== "undefined"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id
      : undefined;

  useEffect(() => {
    if (userId) fetchOwner("month");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function fetchOwner(apiPeriod: string) {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/owner?user_id=${userId}&period=${apiPeriod}`);
      if (res.ok) setPdata(await res.json() as OwnerPeriodData);
    } catch {
      // network error — keep previous data
    } finally {
      setLoading(false);
    }
  }

  function handlePeriod(label: string) {
    if (period === label) return;
    setPeriod(label);
    fetchOwner(PERIOD_API[label]);
  }

  const submittedPct = data.total_month > 0
    ? (data.submitted_total / data.total_month) * 100
    : 0;

  // Rating + chart: period data yoki fallback (initial workers)
  const managers: ManagerStat[] = pdata?.managers ?? data.workers.map((w, i) => ({
    name:       w.name,
    total:      w.month_total,
    count:      0,
    rank:       i + 1,
    percentage: w.percentage,
  }));
  const chartData   = pdata?.chart      ?? data.chart;
  const grandTotal  = pdata?.grand_total ?? data.total_month;
  const periodLabel = pdata?.period_label ?? "";
  const chartNames  = managers.map((m) => m.name);

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

      {/* ── Reyting + period tabs ─────────────────── */}
      <div className="card">
        {/* Header: sarlavha + tabs */}
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: 14,
        }}>
          <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>🏆 Menejerlar reytingi</span>

          <div style={{
            display: "flex", gap: 3,
            background: "var(--bg-secondary)",
            borderRadius: 20, padding: "3px 4px",
          }}>
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => handlePeriod(p)}
                style={{
                  padding: "3px 9px",
                  borderRadius: 16,
                  border: "none",
                  fontSize: "0.72rem",
                  fontWeight: period === p ? 700 : 400,
                  background: period === p ? "var(--accent-primary)" : "transparent",
                  color:      period === p ? "#000"                  : "var(--text-secondary)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Manager kartalar */}
        {loading ? (
          <div style={{
            color: "var(--text-muted)", textAlign: "center",
            padding: "28px 0", fontSize: "0.85rem",
          }}>
            ⌛ Yuklanmoqda...
          </div>
        ) : (
          managers.map((m, i) => (
            <div key={m.name} style={{ marginBottom: 14 }}>
              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "flex-start", marginBottom: 5,
              }}>
                {/* Ism + count */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <span style={{ fontSize: "1.1rem", lineHeight: 1.2 }}>
                    {MEDALS[i] ?? `${i + 1}.`}
                  </span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{m.name}</div>
                    {m.count > 0 && (
                      <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", marginTop: 1 }}>
                        {m.count} ta kirim
                      </div>
                    )}
                  </div>
                </div>

                {/* Summa + sub badge (faqat initial data uchun) */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    color: WORKER_COLORS[i] ?? "#00d084",
                    fontWeight: 700, fontSize: "0.92rem",
                  }}>
                    {fmt(m.total)}
                  </span>
                  {!pdata && (
                    subBadge(data.workers[i]?.sub_status ?? "none")
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="progress-bar">
                <div style={{
                  height: "100%", borderRadius: 2,
                  background: WORKER_COLORS[i] ?? "#00d084",
                  width: `${m.percentage}%`,
                  transition: "width 0.6s ease",
                }} />
              </div>
              <div style={{
                textAlign: "right", color: "var(--text-muted)",
                fontSize: "0.7rem", marginTop: 3,
              }}>
                {m.percentage.toFixed(1)}%
              </div>
            </div>
          ))
        )}

        {/* Jami footer */}
        <div style={{
          borderTop: "1px solid #1e3a1e",
          paddingTop: 10, marginTop: 2,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
            💰 Jami{periodLabel ? ` · ${periodLabel}` : ""}:
          </span>
          <span style={{ fontWeight: 700, color: "var(--accent-primary)", fontSize: "0.9rem" }}>
            {fmt(grandTotal)}
          </span>
        </div>
      </div>

      {/* ── Stats grid ────────────────────────────── */}
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

      {/* ── Pending karta (sariq) ─────────────────── */}
      {data.pending_list && data.pending_list.length > 0 && (
        <div style={{
          border: "1px solid #f59e0b33",
          borderLeft: "3px solid #f59e0b",
          borderRadius: 12,
          padding: "12px 14px",
          background: "#f59e0b0d",
        }}>
          <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#f59e0b", marginBottom: 10 }}>
            ⏳ Kutilmoqda
          </div>
          {data.pending_list.map((item) => (
            <div
              key={`${item.week_start}-${item.worker_name}`}
              style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "center", marginBottom: 6,
              }}
            >
              <div>
                <span style={{ fontWeight: 600, fontSize: "0.82rem" }}>{item.worker_name}</span>
                <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginLeft: 6 }}>
                  · {item.week}
                </span>
              </div>
              <span style={{ fontWeight: 600, color: "#f59e0b", fontSize: "0.82rem" }}>
                ${item.total.toFixed(2)}
              </span>
            </div>
          ))}
          <div style={{
            borderTop: "1px solid #f59e0b33", paddingTop: 8, marginTop: 4,
            display: "flex", justifyContent: "space-between",
          }}>
            <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Jami:</span>
            <span style={{ fontWeight: 700, color: "#f59e0b", fontSize: "0.88rem" }}>
              ${(data.pending_list_total ?? 0).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* ── Stacked Chart (period-aware) ──────────── */}
      <div className="card safe-bottom">
        <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: 12 }}>
          📊 {period} daromad
        </div>

        <ResponsiveContainer width="100%" height={180}>
          <AreaChart
            data={loading ? [] : chartData}
            margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
          >
            <defs>
              {chartNames.map((name, i) => (
                <linearGradient key={name} id={`og${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={WORKER_COLORS[i] ?? "#00d084"} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={WORKER_COLORS[i] ?? "#00d084"} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a1e" />
            <XAxis
              dataKey="day"
              tick={{ fill: "#7ab87a", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#7ab87a", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => v === 0 ? "" : `$${v}`}
            />
            <Tooltip
              contentStyle={{
                background: "#132213", border: "1px solid #1e3a1e",
                borderRadius: 10, fontSize: 12,
              }}
              labelStyle={{ color: "#e8f5e8", fontWeight: 600 }}
              formatter={(v, name) => [`$${Number(v).toFixed(2)}`, String(name)]}
            />
            {chartNames.map((name, i) => (
              <Area
                key={name}
                type="monotone"
                dataKey={name}
                stroke={WORKER_COLORS[i] ?? "#00d084"}
                strokeWidth={2}
                fill={`url(#og${i})`}
                dot={false}
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
