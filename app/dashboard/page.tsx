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
  const [accData,    setAccData]    = useState<AccountantData | AccountantLockedData | null>(null);
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
          const [wd, ad] = await Promise.all([
            fetchDashboard(uid, "week"),
            fetchAccountant(uid, "week"),
          ]);
          setWorkerData(wd as WorkerDashboardData);
          setAccData(ad);
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
    const UZ_M = ["yan","fev","mar","apr","may","iyun","iyul","avg","sen","okt","noy","dek"];

    const accContent = () => {
      if (!accData) return null;
      if ("show" in accData && !accData.show) {
        const { next_saturday } = accData as AccountantLockedData;
        const [, mo, dy] = next_saturday.split("-").map(Number);
        const nextSatStr = `${dy}-${UZ_M[mo - 1]}`;
        return (
          <div style={{ padding: 24, paddingTop: 60 }}>
            <div className="card" style={{ textAlign: "center", padding: "36px 16px" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🔒</div>
              <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: 6 }}>
                Haftalik hisobot
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: 20 }}>
                Faqat shanba kuni ko&apos;rinadi
              </div>
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                <div style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginBottom: 6 }}>
                  ⏳ Keyingi shanba:
                </div>
                <div style={{ color: "var(--accent-primary)", fontWeight: 700, fontSize: "1.15rem" }}>
                  {nextSatStr}
                </div>
              </div>
            </div>
          </div>
        );
      }
      return (
        <AccountantDashboard
          data={accData as AccountantData}
          name={user.name || user.username}
        />
      );
    };

    return (
      <>
        <div style={{ paddingBottom: `calc(90px + max(env(safe-area-inset-bottom), 20px))` }}>
          {activeTab === "manager" && workerData ? (
            <WorkerDashboard data={workerData} name={user.name || user.username} hideSubmission={true} />
          ) : activeTab === "accountant" ? (
            accContent()
          ) : null}
        </div>
        <BottomTabs active={activeTab} onChange={setActiveTab} />
      </>
    );
  }

  return <WorkerDashboard data={data as WorkerDashboardData} name={user.name || user.username} />;
}
