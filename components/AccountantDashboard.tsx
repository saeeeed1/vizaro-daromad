"use client";

import type { AccountantData, WorkerSubmission } from "@/lib/api";

function fmtUSD(n: number) {
  return "$" + new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function fmtDate(dt: string) {
  if (!dt) return "";
  const UZ_M = ["yan","fev","mar","apr","may","iyun","iyul","avg","sen","okt","noy","dek"];
  try {
    const [datePart, timePart] = dt.split(" ");
    const [, m, d] = datePart.split("-").map(Number);
    return `${d}-${UZ_M[m - 1]} ${(timePart ?? "").slice(0, 5)}`.trim();
  } catch {
    return dt.slice(5, 16);
  }
}

function WorkerCard({ sub }: { sub: WorkerSubmission }) {
  const isOk = sub.status === "confirmed";
  const isNo = sub.status === "not_submitted";

  const color = isOk ? "#22c55e" : isNo ? "#ef4444" : "#f59e0b";
  const icon  = isOk ? "✅" : isNo ? "❌" : "⏳";

  const line2 = isOk
    ? `${fmtUSD(sub.total_usd)} · ${sub.count} ta kirim`
    : isNo
    ? "Hali topshirmadi"
    : `${fmtUSD(sub.total_usd)} · ${sub.count} ta kirim`;

  const line3 = isOk
    ? (sub.confirmed_at ? `Topshirildi: ${fmtDate(sub.confirmed_at)}` : "")
    : isNo
    ? (sub.total_usd > 0 ? `Bu hafta: ${fmtUSD(sub.total_usd)} (kutilmoqda)` : "Bu hafta kirim yo'q")
    : "Tasdiqlash kutilmoqda";

  return (
    <div style={{
      border: `1px solid ${color}33`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 10,
      padding: "10px 12px",
      marginBottom: 10,
      background: `${color}0d`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
        <span>{icon}</span>
        <span style={{ fontWeight: 700, fontSize: "0.9rem", color }}>{sub.worker_name}</span>
      </div>
      <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginLeft: 22 }}>{line2}</div>
      {line3 && (
        <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginLeft: 22, marginTop: 2 }}>{line3}</div>
      )}
    </div>
  );
}

export default function AccountantDashboard({
  data,
  name,
}: {
  data: AccountantData;
  name: string;
}) {
  const allWorkers     = [...data.received, ...data.pending];
  const confirmedTotal = data.received.reduce((s, w) => s + w.total_usd, 0);
  const pendingTotal   = data.pending.reduce((s, w) => s + w.total_usd, 0);
  const grandTotal     = confirmedTotal + pendingTotal;

  return (
    <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Hero */}
      <div className="card" style={{ background: "linear-gradient(135deg, #0f1a0f, #1a2e1a)" }}>
        <div style={{ color: "var(--accent-primary)", fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.08em" }}>
          🧮 BUGALTER PANEL
        </div>
        <div style={{ color: "var(--text-secondary)", fontSize: "0.78rem", marginTop: 3 }}>
          {name} · {data.week_label}
        </div>
      </div>

      {/* Worker kartalar */}
      <div className="card">
        <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: 12 }}>
          📋 Menejerlar holati
        </div>
        {allWorkers.length === 0 ? (
          <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "24px 0" }}>
            Hali ma&apos;lumot yo&apos;q
          </div>
        ) : (
          allWorkers.map((sub) => <WorkerCard key={sub.worker_id} sub={sub} />)
        )}
      </div>

      {/* Jami */}
      <div className="card safe-bottom">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>💰 Jami olish kerak:</span>
          <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--accent-primary)" }}>
            {fmtUSD(grandTotal)}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>✅ Tasdiqlangan:</span>
          <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "#22c55e" }}>
            {fmtUSD(confirmedTotal)}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>❌ Kutilmoqda:</span>
          <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "#ef4444" }}>
            {fmtUSD(pendingTotal)}
          </span>
        </div>
      </div>

    </div>
  );
}
