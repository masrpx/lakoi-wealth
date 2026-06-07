import { NextResponse } from "next/server";
import { list, put } from "@vercel/blob";

const KEY = "portfolio/lakoi-growth-portfolio.json";

export async function GET() {
  try {
    const { blobs } = await list({ prefix: KEY });
    if (blobs.length === 0) return NextResponse.json(null);
    const res = await fetch(blobs[0].url, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
    });
    if (!res.ok) return NextResponse.json(null);
    return NextResponse.json(await res.json());
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    await put(KEY, JSON.stringify(data), {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
