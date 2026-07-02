import type { IncomeItem } from "@/lib/api";

// Mavjud .income-row + statusBadge dizayni (WorkerDashboard bilan bir xil).
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

export default function IncomeRow({ inc }: { inc: IncomeItem }) {
  return (
    <div className="income-row">
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
  );
}
