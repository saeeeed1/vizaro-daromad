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

export interface PendingSubmission {
  week: string;
  week_start: string;
  total: number;
  submitted_at?: string;
}

export interface PendingListItem {
  worker_name: string;
  week: string;
  week_start: string;
  total: number;
}

export interface WorkerStat {
  id: number;
  name: string;
  role: string;
  month_total: number;
  sub_status: "full" | "partial" | "none";
  percentage: number;
}

export interface Category {
  name: string;   // "Aviabilet" | "Mehmonxona" | "Viza" | "Tur" | "Boshqa"
  total: number;
  count: number;
}

// Fallback — API categories qaytarmasa yoki bo'sh bo'lsa
export const CATEGORY_FALLBACK: Category[] = [];

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
  pending_submissions?: PendingSubmission[];
  pending_total_all?: number;
  categories?: Category[];
}

export interface OwnerDashboardData {
  role: "owner";
  total_week: number;
  total_month: number;
  submitted_total: number;
  pending_total: number;
  workers: WorkerStat[];
  chart: ChartPoint[];
  pending_list?: PendingListItem[];
  pending_list_total?: number;
  categories?: Category[];
}

export type DashboardData = WorkerDashboardData | OwnerDashboardData;

export interface AccountantManager {
  worker_id: number;
  name: string;
  submitted: number;   // tasdiqlangan (confirmed) USD
  pending: number;     // hali tasdiqlanmagan USD
  submit_status: "full" | "partial" | "none"; // topshirish holati
}

export interface AccountantData {
  period: "week" | "month";
  period_label: string;
  summary: {
    submitted: number;
    pending: number;
    total: number;
  };
  managers: AccountantManager[];
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

export const fetchAccountant = (userId: number, period = "week") =>
  apiFetch(`/api/accountant?user_id=${userId}&period=${period}`) as Promise<AccountantData>;

export interface ManagerStat {
  name: string;
  total: number;
  count: number;
  rank: number;
  percentage: number;
}

export interface OwnerPeriodData {
  managers: ManagerStat[];
  period_label: string;
  grand_total: number;
  chart: ChartPoint[];
}

export const fetchOwnerPeriod = (userId: number, period = "month") =>
  apiFetch(`/api/owner?user_id=${userId}&period=${period}`) as Promise<OwnerPeriodData>;

export interface OwnerMonths {
  months: string[];   // ["2026-06", "2026-05", ...]
}

export const fetchOwnerMonths = (userId: number) =>
  apiFetch(`/api/owner/months?user_id=${userId}`) as Promise<OwnerMonths>;
