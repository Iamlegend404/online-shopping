import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URLSearchParams(req.nextUrl.search.slice(1)).get("url");
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
      Referer: "https://play.xpass.top/",
    },
  });

  if (!res.ok)
    return NextResponse.json({ error: "Failed" }, { status: res.status });

  const base = new URL(url);
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("host")!;
  const proxy = `${proto}://${host}/backend/proxy`;

  const rewritten = (await res.text())
    .split("\n")
    .map((line) => {
      if (!line.trim() || line.startsWith("#")) return line;
      const abs = line.startsWith("http")
        ? line
        : new URL(line, base).toString();
      return abs.includes(".m3u8")
        ? `${proxy}?url=${encodeURIComponent(abs)}`
        : abs;
    })
    .join("\n");

  return new NextResponse(rewritten, {
    headers: {
      "Content-Type": "application/vnd.apple.mpegurl",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
