import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.API_URL ?? "http://localhost:8081";

export async function POST(req: NextRequest) {
  const initData = req.headers.get("x-telegram-init-data") || "";
  try {
    const body = await req.json();
    const res = await fetch(`${API_BASE}/api/owner/request-excel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Telegram-Init-Data": initData,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "API unavailable" }, { status: 503 });
  }
}
