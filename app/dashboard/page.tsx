"use client";

import { useEffect, useState } from "react";
import { DashboardSkeleton } from "@/components/Skeleton";
import WorkerDashboard from "@/components/WorkerDashboard";
import OwnerDashboard from "@/components/OwnerDashboard";
import AccountantDashboard from "@/components/AccountantDashboard";
import { fetchMe, fetchDashboard, fetchAccountant } from "@/lib/api";
import type {
  UserInfo, DashboardData,
  WorkerDashboardData, OwnerDashboardData, AccountantData,
} from "@/lib/api";

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        close?: () => void;
        initDataUnsafe: { user?: { id: number; first_name: string; username?: string } };
      };
    };
  }
}

function getUserId(): number {
  if (typeof window !== "undefined") {
    const tg = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (tg?.id) return tg.id;
    const uid = new URLSearchParams(window.location.search).get("user_id");
    if (uid) return parseInt(uid);
  }
  return 0;
}

export default function DashboardPage() {
  const [user,    setUser]    = useState<UserInfo | null>(null);
  const [data,    setData]    = useState<DashboardData | AccountantData | null>(null);
  const [error,   setError]   = useState<string | null>(null);
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

    fetchMe(uid)
      .then(async (u) => {
        if (!u.authorized) {
          setError("⛔ Sizga ruxsat yo'q");
          return;
        }
        setUser(u);

        // Rolga qarab tegishli endpoint
        if (u.role === "accountant") {
          const d = await fetchAccountant(uid, "week");
          setData(d);
        } else {
          const d = await fetchDashboard(uid, "week");
          setData(d);
        }
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

  if (user.role === "owner") {
    return <OwnerDashboard data={data as OwnerDashboardData} />;
  }

  if (user.role === "accountant") {
    return <AccountantDashboard data={data as AccountantData} name={user.name || user.username} />;
  }

  return <WorkerDashboard data={data as WorkerDashboardData} name={user.name || user.username} />;
}
