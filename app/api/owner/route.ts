import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.API_URL ?? "http://localhost:8081";

export async function GET(req: NextRequest) {
  const user_id = req.nextUrl.searchParams.get("user_id");
  const period  = req.nextUrl.searchParams.get("period") ?? "month";
  const initData = req.headers.get("x-telegram-init-data") || "";
  try {
    const res = await fetch(
      `${API_BASE}/api/owner?user_id=${user_id}&period=${period}`,
      { cache: "no-store", headers: { "X-Telegram-Init-Data": initData } }
    );
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "API unavailable" }, { status: 503 });
  }
}
