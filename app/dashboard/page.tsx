"use client";

import { useEffect, useState } from "react";
import { DashboardSkeleton } from "@/components/Skeleton";
import WorkerDashboard from "@/components/WorkerDashboard";
import OwnerDashboard from "@/components/OwnerDashboard";
import AccountantDashboard from "@/components/AccountantDashboard";
import { fetchMe, fetchDashboard } from "@/lib/api";
import type {
  UserInfo, DashboardData,
  WorkerDashboardData, OwnerDashboardData,
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

function BottomTabs({
  active,
  onChange,
}: {
  active: "manager" | "accountant";
  onChange: (t: "manager" | "accountant") => void;
}) {
  const tabs = [
    { key: "manager" as const,   icon: "💼", label: "Menejer"  },
    { key: "accountant" as const, icon: "📒", label: "Bugalter" },
  ];
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: "#111",
        borderTop: "1px solid #222",
        paddingBottom: "max(env(safe-area-inset-bottom), 20px)",
        height: `calc(56px + max(env(safe-area-inset-bottom), 20px))`,
        alignItems: "flex-start",
        paddingTop: "8px",
        display: "flex",
        gap: 8,
        paddingLeft: 12,
        paddingRight: 12,
      }}
    >
      {tabs.map(({ key, icon, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          style={{
            flex: 1,
            padding: "10px 0",
            background: active === key ? "#00c07a" : "#1a1a1a",
            color: active === key ? "#000" : "#666",
            border: "none",
            borderRadius: 12,
            cursor: "pointer",
            fontWeight: active === key ? 700 : 500,
            fontSize: "0.82rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            transition: "background 0.15s, color 0.15s",
          }}
        >
          <span style={{ fontSize: "1.1rem" }}>{icon}</span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [user,       setUser]       = useState<UserInfo | null>(null);
  const [data,       setData]       = useState<DashboardData | null>(null);
  const [workerData, setWorkerData] = useState<WorkerDashboardData | null>(null);
  const [activeTab,  setActiveTab]  = useState<"manager" | "accountant">("manager");
  const [error,      setError]      = useState<string | null>(null);
  const [loading,    setLoading]    = useState(true);

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

        if (u.role === "accountant") {
          const wd = await fetchDashboard(uid, "week");
          setWorkerData(wd as WorkerDashboardData);
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

  if (!user) return null;

  if (user.role === "owner") {
    return <OwnerDashboard data={data as OwnerDashboardData} />;
  }

  if (user.role === "accountant") {
    return (
      <>
        <div style={{ paddingBottom: `calc(90px + max(env(safe-area-inset-bottom), 20px))` }}>
          {activeTab === "manager" && workerData ? (
            <WorkerDashboard data={workerData} name={user.name || user.username} hideSubmission={true} userId={user.user_id} />
          ) : activeTab === "accountant" ? (
            <AccountantDashboard userId={user.user_id} name={user.name || user.username} />
          ) : null}
        </div>
        <BottomTabs active={activeTab} onChange={setActiveTab} />
      </>
    );
  }

  return <WorkerDashboard data={data as WorkerDashboardData} name={user.name || user.username} userId={user.user_id} />;
}
