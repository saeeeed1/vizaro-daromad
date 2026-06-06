"use client";

import { useState } from "react";
import type { AccountantData, WorkerSubmission } from "@/lib/api";

const TABS = ["Bu hafta", "Bu oy"] as const;

const STATUS_ICON: Record<string, string> = {
  confirmed:     "✅",
  pending:       "⏳",
  not_submitted: "📤",
};
const STATUS_COLOR: Record<string, string> = {
  confirmed:     "var(--accent-primary)",
  pending:       "var(--warning)",
  not_submitted: "var(--text-muted)",
};

function fmtUSD(n: number) {
  return "$" + new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}
function fmtUZS(n: number) {
  return new Intl.NumberFormat("uz").format(n) + " so'm";
}
function fmtAmt(usd: number, uzs: number) {
  const p: string[] = [];
  if (usd > 0) p.push(fmtUSD(usd));
  if (uzs > 0) p.push(fmtUZS(uzs));
  return p.join(" + ") || "—";
}
function fmtDate(dt: string) {
  if (!dt) return "";
  // "2026-06-05 20:10" → "5-iyn 01:10" (approx, just show last part)
  return dt.slice(5).replace("-", "-").replace(" ", " ");
}

// ── Worker card ────────────────────────────────────────────────────────────
function WorkerCard({ sub, maxUsd }: { sub: WorkerSubmission; maxUsd: number }) {
  const pct   = maxUsd > 0 ? Math.min(100, (sub.total_usd / maxUsd) * 100) : 0;
  const color = STATUS_COLOR[sub.status] ?? "var(--text-muted)";

  let statusLine = "";
  if (sub.status === "confirmed")     statusLine = `Tasdiqlangan: ${fmtDate(sub.confirmed_at)}`;
  else if (sub.status === "pending")  statusLine = "Tasdiqlash kutilmoqda";
  else                                statusLine = sub.count > 0 ? "Hali topshirilmagan" : "Kirim yo'q";

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span>{STATUS_ICON[sub.status] ?? "—"}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{sub.worker_name}</div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", marginTop: 1 }}>
              {sub.count > 0 ? `${sub.count} ta kirim` : "kirim yo'q"}
              {statusLine ? ` · ${statusLine}` : ""}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right", color, fontWeight: 700, fontSize: "0.85rem" }}>
          {fmtAmt(sub.total_usd, sub.total_uzs)}
        </div>
      </div>
      {pct > 0 && (
        <div className="progress-bar">
          <div
            style={{
              height: "100%", borderRadius: 2,
              background: color, width: `${pct}%`,
              transition: "width 0.6s ease",
            }}
          />
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function AccountantDashboard({
  data, name,
}: {
  data: AccountantData;
  name: string;
}) {
  const [tab, setTab] = useState(0);
  const isWeek = tab === 0;
  const sm     = isWeek ? data.summary : data.month_summary;

  // All managers for the list: confirmed first, then pending/not_submitted
  const allWorkers = [...data.received, ...data.pending];
  const maxUsd     = Math.max(...allWorkers.map((w) => w.total_usd), 1);

  return (
    <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 12 }}>

      {/* ── Hero ──────────────────────────────────── */}
      <div className="card" style={{ background: "linear-gradient(135deg, #0f1a0f, #1a2e1a)" }}>
        <div style={{ color: "var(--accent-primary)", fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.08em" }}>
          🧮 BUGALTER PANEL
        </div>
        <div style={{ color: "var(--text-secondary)", fontSize: "0.78rem", marginTop: 3 }}>
          {name} · {data.week_label}
        </div>
      </div>

      {/* ── 3 stat kartalar ───────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[
          { icon: "💰", val: fmtUSD(sm.total_usd),          label: "Qabul qilindi" },
          { icon: "✅", val: `${sm.confirmed_count} ta`,    label: "Tasdiqlandi" },
          { icon: "⏳", val: `${"pending_count" in sm ? sm.pending_count : "—"} ta`, label: "Kutilmoqda" },
        ].map(({ icon, val, label }) => (
          <div key={label} className="card" style={{ textAlign: "center", padding: "12px 8px" }}>
            <div style={{ fontSize: "1.2rem" }}>{icon}</div>
            <div style={{ color: "var(--accent-primary)", fontWeight: 700, fontSize: "0.95rem", marginTop: 4, lineHeight: 1.2 }}>
              {val}
            </div>
            <div className="stat-label" style={{ marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Tab + ishchilar ro'yxati ───────────────── */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>📋 Menejerlar holati</span>
          <div style={{ display: "flex", gap: 4, background: "var(--bg-secondary)", borderRadius: 20, padding: 3 }}>
            {TABS.map((t, i) => (
              <button key={t} className={`tab-btn${tab === i ? " active" : ""}`} onClick={() => setTab(i)}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {allWorkers.length === 0 ? (
          <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "24px 0" }}>
            Hali ma&apos;lumot yo&apos;q
          </div>
        ) : (
          allWorkers.map((sub) => (
            <WorkerCard key={sub.worker_id} sub={sub} maxUsd={maxUsd} />
          ))
        )}

        {/* Jami qator */}
        {(sm.total_usd > 0 || sm.total_uzs > 0) && (
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10, marginTop: 4 }}>
            {sm.total_usd > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>💰 Jami USD:</span>
                <span style={{ color: "var(--accent-primary)", fontWeight: 700, fontSize: "0.85rem" }}>
                  {fmtUSD(sm.total_usd)}
                </span>
              </div>
            )}
            {sm.total_uzs > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>💴 Jami UZS:</span>
                <span style={{ color: "var(--accent-second)", fontWeight: 700, fontSize: "0.85rem" }}>
                  {fmtUZS(sm.total_uzs)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Mening daromadim ──────────────────────── */}
      <div className="card safe-bottom">
        <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: 12 }}>
          💼 Mening daromadim
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <div className="stat-label">Bu hafta</div>
            <div style={{ color: "var(--accent-primary)", fontWeight: 700, fontSize: "1.1rem", marginTop: 3 }}>
              {fmtUSD(data.own_income.total_usd)}
            </div>
            {data.own_income.count > 0 && (
              <div style={{ color: "var(--text-muted)", fontSize: "0.7rem", marginTop: 2 }}>
                {data.own_income.count} ta kirim
              </div>
            )}
          </div>
          <div>
            <div className="stat-label">Bu oy</div>
            <div style={{ color: "var(--accent-second)", fontWeight: 700, fontSize: "1.1rem", marginTop: 3 }}>
              {fmtUSD(data.own_income.month_total)}
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            if (typeof window !== "undefined") {
              window.Telegram?.WebApp?.close?.();
            }
          }}
          style={{
            width: "100%", padding: "10px 0",
            background: "var(--accent-primary)", color: "#000",
            border: "none", borderRadius: 10,
            fontWeight: 700, fontSize: "0.88rem", cursor: "pointer",
          }}
        >
          + Kirim qo&apos;shish
        </button>
      </div>
    </div>
  );
}
