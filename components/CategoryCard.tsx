import type { Category } from "@/lib/api";

// Kategoriya → emoji + rang
const CAT_META: Record<string, { emoji: string; color: string }> = {
  "Aviabilet":  { emoji: "✈️", color: "#3b82f6" },  // ko'k
  "Mehmonxona": { emoji: "🏨", color: "#a855f7" },  // binafsha
  "Viza":       { emoji: "📋", color: "#22c55e" },  // yashil
  "Tur":        { emoji: "🗺", color: "#f59e0b" },  // sariq
  "Poyezd":     { emoji: "🚆", color: "#14b8a6" },  // teal
  "Boshqa":     { emoji: "📦", color: "#6b7280" },  // kulrang
};

function fmtUSD(n: number): string {
  return "$" + new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(n));
}

export default function CategoryCard({ categories }: { categories?: Category[] }) {
  const cats = (categories ?? []).filter((c) => c.total > 0);
  if (cats.length === 0) return null;

  const max = Math.max(...cats.map((c) => c.total), 1);

  return (
    <div className="card">
      <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: 12 }}>
        📊 Kategoriya bo&apos;yicha
      </div>

      {cats.map((c) => {
        const meta = CAT_META[c.name] ?? CAT_META["Boshqa"];
        const pct = Math.round((c.total / max) * 100);
        return (
          <div key={c.name} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                {meta.emoji} {c.name}
              </span>
              <span style={{ fontSize: "0.82rem" }}>
                <span style={{ color: meta.color, fontWeight: 700 }}>{fmtUSD(c.total)}</span>
                <span style={{ color: "var(--text-muted)", marginLeft: 6, fontSize: "0.72rem" }}>
                  ({c.count} ta)
                </span>
              </span>
            </div>
            <div className="progress-bar">
              <div
                style={{
                  height: "100%",
                  borderRadius: 2,
                  background: meta.color,
                  width: `${pct}%`,
                  transition: "width 0.5s ease",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
