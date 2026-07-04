// Xarajat kategoriyasi → emoji + rang (kirim kategoriyasidan ALOHIDA).
const EXP_META: Record<string, { emoji: string; color: string }> = {
  "Obed":     { emoji: "🍽", color: "#f59e0b" },
  "Ijara":    { emoji: "🏠", color: "#a855f7" },
  "Maosh":    { emoji: "💵", color: "#22c55e" },
  "Web-site": { emoji: "🌐", color: "#3b82f6" },
  "Reklama":  { emoji: "📢", color: "#ec4899" },
  "Server":   { emoji: "🖥", color: "#06b6d4" },
  "App":      { emoji: "📱", color: "#8b5cf6" },
  "Ofis":     { emoji: "🏢", color: "#eab308" },
  "Kommunal": { emoji: "💡", color: "#14b8a6" },
  "Boshqa":   { emoji: "📦", color: "#6b7280" },
};

export function expenseCatMeta(category: string): { emoji: string; color: string } {
  if (category && category.startsWith("Xodim")) return { emoji: "👤", color: "#ef4444" };
  return EXP_META[category] ?? EXP_META["Boshqa"];
}
