"use client";

import { useEffect, useState } from "react";
import { DashboardSkeleton } from "@/components/Skeleton";
import WorkerDashboard from "@/components/WorkerDashboard";
import OwnerDashboard from "@/components/OwnerDashboard";
import AccountantDashboard from "@/components/AccountantDashboard";
import { fetchMe, fetchDashboard, fetchAccountant } from "@/lib/api";
import type {
  UserInfo, DashboardData,
  WorkerDashboardData, OwnerDashboardData, AccountantData, AccountantLockedData,
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
  const [data,    setData]    = useState<DashboardData | AccountantData | AccountantLockedData | null>(null);
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
    const accData = data as AccountantData | AccountantLockedData;
    if ("show" in accData && !accData.show) {
      const { next_saturday } = accData as AccountantLockedData;
      const UZ_M = ["yan","fev","mar","apr","may","iyun","iyul","avg","sen","okt","noy","dek"];
      const [, mo, dy] = next_saturday.split("-").map(Number);
      const nextSatStr = `${dy}-${UZ_M[mo - 1]}`;
      return (
        <div style={{ padding: 24, paddingTop: 60 }}>
          <div className="card" style={{ textAlign: "center", padding: "36px 16px" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🔒</div>
            <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: 6 }}>Haftalik hisobot</div>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: 20 }}>
              Faqat shanba kuni ko&apos;rinadi
            </div>
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
              <div style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginBottom: 6 }}>⏳ Keyingi shanba:</div>
              <div style={{ color: "var(--accent-primary)", fontWeight: 700, fontSize: "1.15rem" }}>{nextSatStr}</div>
            </div>
          </div>
        </div>
      );
    }
    return <AccountantDashboard data={accData as AccountantData} name={user.name || user.username} />;
  }

  return <WorkerDashboard data={data as WorkerDashboardData} name={user.name || user.username} />;
}
