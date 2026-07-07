import { NextRequest, NextResponse } from "next/server";

const HEADERS = {
  Origin: "https://s1.devcorp.me",
  Referer: "https://s1.devcorp.me/",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
};

const proxy = (url: string) =>
  `/backend_/servers/daedalus/proxy?url=${encodeURIComponent(url)}`;

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  const headers = new Headers(HEADERS);

  // Forward Range requests (required for MP4 seeking)
  ["range", "if-range"].forEach((name) => {
    const value = req.headers.get(name);
    if (value) headers.set(name, value);
  });

  const res = await fetch(url, {
    headers,
    redirect: "follow",
  });

  const type = res.headers.get("content-type") || "";

  // HLS playlist
  if (
    url.endsWith(".m3u8") ||
    type.includes("mpegurl") ||
    type.includes("application/vnd.apple.mpegurl")
  ) {
    const base = new URL(url);

    const playlist = (await res.text())
      .split("\n")
      .map((line) =>
        !line || line.startsWith("#")
          ? line
          : proxy(new URL(line.trim(), base).toString()),
      )
      .join("\n");

    return new NextResponse(playlist, {
      status: res.status,
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        ...CORS,
      },
    });
  }

  const responseHeaders = new Headers(res.headers);

  responseHeaders.set("Access-Control-Allow-Origin", "*");
  responseHeaders.set("Access-Control-Allow-Headers", "*");
  responseHeaders.set("Access-Control-Allow-Methods", "GET,OPTIONS");

  responseHeaders.delete("connection");
  responseHeaders.delete("transfer-encoding");

  return new NextResponse(res.body, {
    status: res.status,
    headers: responseHeaders,
  });
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS,
  });
}
