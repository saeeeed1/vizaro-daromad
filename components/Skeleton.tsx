export function SkeletonBlock({ h = 20, w = "100%" }: { h?: number; w?: string }) {
  return <div className="skeleton" style={{ height: h, width: w }} />;
}

export function DashboardSkeleton() {
  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      <SkeletonBlock h={120} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        <SkeletonBlock h={70} />
        <SkeletonBlock h={70} />
        <SkeletonBlock h={70} />
      </div>
      <SkeletonBlock h={180} />
      <SkeletonBlock h={200} />
    </div>
  );
}
