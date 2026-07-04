"use client";

import { useEffect, useState } from "react";
import { fetchExpenses } from "@/lib/api";
import type { ExpensesData } from "@/lib/api";
import { expenseCatMeta } from "@/lib/expenseCategory";

function fmtMoney(amount: number, currency: string) {
  if (currency === "UZS")
    return new Intl.NumberFormat("uz").format(amount) + " so'm";
  return "$" + new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

// Rasxod bo'limi — FAQAT KO'RISH (buxgalter + owner). Joriy oy.
export default function ExpensesCard({ userId }: { userId: number }) {
  const [data, setData]       = useState<ExpensesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetchExpenses(userId)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return null;

  const expenses = data?.expenses ?? [];
  const totals   = data?.totals ?? { usd: 0, uzs: 0 };
  const shown    = showAll ? expenses : expenses.slice(0, 15);

  return (
    <div className="card safe-bottom">
      <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: 10 }}>💸 Rasxod (bu oy)</div>

      {expenses.length === 0 ? (
        <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "20px 0" }}>
          Bu oy xarajat yo&apos;q
        </div>
      ) : (
        <>
          {/* Jami — USD va so'm alohida */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Jami</span>
            <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>
              {totals.usd > 0 && <span style={{ color: "var(--danger)" }}>${totals.usd.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>}
              {totals.usd > 0 && totals.uzs > 0 && <span style={{ color: "var(--text-muted)" }}> · </span>}
              {totals.uzs > 0 && <span style={{ color: "var(--warning)" }}>{new Intl.NumberFormat("uz").format(totals.uzs)} so&apos;m</span>}
            </span>
          </div>

          {shown.map((e) => {
            const meta = expenseCatMeta(e.category);
            return (
              <div key={e.id} className="income-row">
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.86rem" }}>{meta.emoji} {e.description}</div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", marginTop: 2 }}>
                    <span style={{ color: meta.color }}>{e.category}</span> · {e.date}
                  </div>
                </div>
                <div style={{
                  fontWeight: 700, fontSize: "0.9rem",
                  color: e.currency === "USD" ? "var(--danger)" : "var(--warning)",
                }}>
                  {fmtMoney(e.amount, e.currency)}
                </div>
              </div>
            );
          })}

          {expenses.length > 15 && (
            <button
              onClick={() => setShowAll(!showAll)}
              style={{
                width: "100%", marginTop: 10, padding: "9px 0",
                background: "transparent", border: "1px solid var(--border)",
                borderRadius: 10, color: "var(--accent-primary)",
                fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
              }}
            >
              {showAll ? "Yopish ⌃" : `Yana ko'rsatish (${expenses.length - 15} ta) ⌄`}
            </button>
          )}
        </>
      )}
    </div>
  );
}
