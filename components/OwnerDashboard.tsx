"use client";

import { useState, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import type { OwnerDashboardData, WorkerStat, OwnerPeriodData, ManagerStat } from "@/lib/api";
import CategoryCard from "@/components/CategoryCard";

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
  if (status === "full")    return <span className="badge badge-green">✅</span>;
  if (status === "partial") return <span className="badge badge-yellow">◐</span>;
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
        <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: 10 }}>
          🏆 Menejerlar reytingi
        </div>

        {/* Period Tabs */}
        <div style={{
          display: "flex",
          gap: 4,
          marginBottom: 10,
          background: "#111",
          borderRadius: 10,
          padding: 3,
        }}>
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => handlePeriod(p)}
              style={{
                flex: 1,
                padding: "6px 0",
                borderRadius: 7,
                border: "none",
                fontSize: "0.72rem",
                fontWeight: period === p ? 700 : 400,
                background: period === p ? "#00c07a" : "transparent",
                color: period === p ? "#000" : "#555",
                cursor: "pointer",
              }}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Manager list */}
        {loading ? (
          <div style={{ textAlign: "center", color: "#666", padding: 20 }}>
            ⌛ Yuklanmoqda...
          </div>
        ) : (managers || []).map((m, i) => (
          <div key={m.name} style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            padding: "10px 12px",
            marginBottom: 6,
            background: "#161616",
            borderRadius: 10,
            border: "1px solid #222",
          }}>
            {/* Yuqori qator: medal + ism + summa */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: "1rem" }}>{MEDALS[i] || `${i + 1}.`}</span>
                <span style={{
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "#e0e0e0",
                }}>{m.name}</span>
                <span style={{
                  fontSize: "0.7rem",
                  color: "#555",
                }}>{m.count} ta</span>
              </div>
              <span style={{
                fontSize: "0.9rem",
                fontWeight: 700,
                color: "#00c07a",
              }}>${m.total.toFixed(0)}</span>
            </div>
            {/* Progress bar */}
            <div style={{
              background: "#222",
              borderRadius: 3,
              height: 3,
            }}>
              <div style={{
                background: WORKER_COLORS[i % WORKER_COLORS.length],
                borderRadius: 3,
                height: 3,
                width: `${m.percentage || 0}%`,
                transition: "width 0.4s",
              }} />
            </div>
          </div>
        ))}

        {/* Footer */}
        <div style={{
          textAlign: "center",
          color: "#666",
          fontSize: "0.78rem",
          padding: "8px 0",
        }}>
          💰 Jami · {pdata?.period_label || ""}: ${(pdata?.grand_total || 0).toFixed(2)}
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

      {/* ── Kategoriya bo'yicha (hamma menejer) ───── */}
      <CategoryCard categories={data.categories} />

      {/* ── Trading Chart (period-aware) ─────────── */}
      <div className="card safe-bottom">
        <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: 12 }}>
          📊 {period} daromad
        </div>

        <ResponsiveContainer width="100%" height={200}>
          <AreaChart
            data={loading ? [] : chartData}
            margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="ownerGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#00c07a" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00c07a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fill: "#444", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval={period === "1 oy" ? 4 : 0}
            />
            <YAxis
              tick={{ fill: "#444", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => v === 0 ? "" : `$${v}`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const detail = (payload[0]?.payload?.detail || {}) as Record<string, number>;
                return (
                  <div style={{
                    background: "#111", border: "1px solid #222",
                    borderRadius: 8, padding: "8px 10px", fontSize: 11,
                  }}>
                    <div style={{ color: "#888", marginBottom: 4 }}>
                      {period === "1 oy" ? `${label}-kun` : label}
                    </div>
                    <div style={{ color: "#00c07a", fontWeight: 700, marginBottom: 6 }}>
                      Jami: ${Number(payload[0].value).toFixed(2)}
                    </div>
                    {Object.entries(detail).map(([name, val]) =>
                      Number(val) > 0 && (
                        <div key={name} style={{ color: "#666" }}>
                          {name.split(" ")[0]}: ${Number(val).toFixed(0)}
                        </div>
                      )
                    )}
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#00c07a"
              strokeWidth={2}
              fill="url(#ownerGrad)"
              dot={false}
              activeDot={{ r: 4, fill: "#00c07a", stroke: "#000", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
