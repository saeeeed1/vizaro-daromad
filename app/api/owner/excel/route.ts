import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.API_URL ?? "http://localhost:8081";

// Python API'dan Excel'ni server tomonda olib, brauzerga same-origin
// (HTTPS) orqali oqim qilib qaytaramiz — mixed-content muammosi bo'lmasin.
export async function GET(req: NextRequest) {
  const user_id = req.nextUrl.searchParams.get("user_id");
  const month   = req.nextUrl.searchParams.get("month") ?? "";
  const initData = req.headers.get("x-telegram-init-data") || "";
  try {
    const res = await fetch(
      `${API_BASE}/api/owner/excel?user_id=${user_id}&month=${month}`,
      { cache: "no-store", headers: { "X-Telegram-Init-Data": initData } }
    );
    if (!res.ok) {
      const body = await res.text();
      return new NextResponse(body || JSON.stringify({ error: res.status }), {
        status: res.status,
        headers: { "Content-Type": "application/json" },
      });
    }
    const buf = await res.arrayBuffer();
    const cd = res.headers.get("content-disposition")
      ?? `attachment; filename="owner_${month}.xlsx"`;
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": cd,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "API unavailable" }, { status: 503 });
  }
}
