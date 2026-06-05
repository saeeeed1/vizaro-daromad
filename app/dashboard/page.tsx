"use client";

import { useEffect, useState } from "react";
import { DashboardSkeleton } from "@/components/Skeleton";
import WorkerDashboard from "@/components/WorkerDashboard";
import OwnerDashboard from "@/components/OwnerDashboard";
import { fetchMe, fetchDashboard } from "@/lib/api";
import type { UserInfo, DashboardData, WorkerDashboardData, OwnerDashboardData } from "@/lib/api";

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        initDataUnsafe: { user?: { id: number; first_name: string; username?: string } };
      };
    };
  }
}

function getUserId(): number {
  if (typeof window !== "undefined") {
    const tg = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (tg?.id) return tg.id;
    const p = new URLSearchParams(window.location.search);
    const uid = p.get("user_id");
    if (uid) return parseInt(uid);
  }
  return 0;
}

export default function DashboardPage() {
  const [user, setUser]     = useState<UserInfo | null>(null);
  const [data, setData]     = useState<DashboardData | null>(null);
  const [error, setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.Telegram?.WebApp?.ready?.();
    window.Telegram?.WebApp?.expand?.();

    const uid = getUserId();
    if (!uid) {
      setError("Telegram orqali oching yoki URL-ga ?user_id= qo'shing");
      setLoading(false);
      return;
    }

    Promise.all([fetchMe(uid), fetchDashboard(uid, "week")])
      .then(([u, d]) => {
        if (!u.authorized) { setError("⛔ Sizga ruxsat yo'q"); setLoading(false); return; }
        setUser(u);
        setData(d);
      })
      .catch(() => setError("API server ulanmagan. Bot ishlamoqdami?"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div style={{ padding: 24, textAlign: "center", paddingTop: 80 }}>
        <div style={{ fontSize: "2rem", marginBottom: 16 }}>⚠️</div>
        <div style={{ color: "var(--danger)", fontWeight: 600, marginBottom: 8 }}>{error}</div>
        <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
          Bot /start bosing, keyin qayta urinib ko&apos;ring
        </div>
      </div>
    );
  }

  if (!user || !data) return null;

  if (data.role === "owner") {
    return <OwnerDashboard data={data as OwnerDashboardData} />;
  }

  return <WorkerDashboard data={data as WorkerDashboardData} name={user.name || user.username} />;
}
