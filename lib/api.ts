export interface UserInfo {
  user_id: number;
  role: "manager" | "accountant" | "owner" | "unknown";
  name: string;
  username: string;
  authorized: boolean;
}

export interface IncomeItem {
  id: number;
  description: string;
  amount: number;
  currency: "USD" | "UZS";
  amount_usd: number;
  date: string;
  status: string;
}

export interface ChartPoint {
  day: string;
  date: string;
  total?: number;
  [key: string]: number | string | undefined;
}

export interface WorkerStat {
  id: number;
  name: string;
  role: string;
  month_total: number;
  sub_status: "pending" | "confirmed" | "none";
  percentage: number;
}

export interface WorkerDashboardData {
  role: "manager" | "accountant";
  week_total: number;
  month_total: number;
  week_count: number;
  month_count: number;
  confirmed_count: number;
  pending_count: number;
  chart: ChartPoint[];
  recent: IncomeItem[];
}

export interface OwnerDashboardData {
  role: "owner";
  total_week: number;
  total_month: number;
  submitted_total: number;
  pending_total: number;
  workers: WorkerStat[];
  chart: ChartPoint[];
}

export type DashboardData = WorkerDashboardData | OwnerDashboardData;

export interface WorkerSubmission {
  worker_id: number;
  worker_name: string;
  total_usd: number;
  total_uzs: number;
  count: number;
  confirmed_at: string;
  status: "confirmed" | "pending" | "not_submitted";
}

export interface AccountantData {
  period: string;
  week_label: string;
  received: WorkerSubmission[];
  pending: WorkerSubmission[];
  summary: {
    total_usd: number;
    total_uzs: number;
    confirmed_count: number;
    pending_count: number;
  };
  month_summary: {
    total_usd: number;
    total_uzs: number;
    confirmed_count: number;
  };
  own_income: {
    total_usd: number;
    total_uzs: number;
    count: number;
    month_total: number;
  };
}

async function apiFetch(path: string): Promise<unknown> {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const fetchMe = (userId: number) =>
  apiFetch(`/api/me?user_id=${userId}`) as Promise<UserInfo>;

export const fetchDashboard = (userId: number, period = "week") =>
  apiFetch(`/api/dashboard?user_id=${userId}&period=${period}`) as Promise<DashboardData>;

export const fetchHistory = (userId: number, limit = 30) =>
  apiFetch(`/api/history?user_id=${userId}&limit=${limit}`) as Promise<{ incomes: IncomeItem[]; total: number }>;

export interface AccountantLockedData {
  show: false;
  next_saturday: string;
}

export const fetchAccountant = (userId: number, period = "week") =>
  apiFetch(`/api/accountant?user_id=${userId}&period=${period}`) as Promise<AccountantData | AccountantLockedData>;
