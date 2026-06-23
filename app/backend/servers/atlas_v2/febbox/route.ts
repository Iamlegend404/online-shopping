// app/api/febbox/route.ts
import { NextRequest, NextResponse } from "next/server";

const FALLBACK_TOKEN =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3ODIyMjM5NTEsIm5iZiI6MTc4MjIyMzk1MSwiZXhwIjoxODEzMzI3OTcxLCJkYXRhIjp7InVpZCI6MjAxMjU1MCwidG9rZW4iOiI5MzI0ZDc3YzkzZmQ2ZWRlNGQyYTlmYzQxNmZiY2IxNiJ9fQ.3RjIoPHcm89xEZBBIyTx3p4SYMrwxkE4uxis8CGaoZo";
const NGROK_URL = "https://constrain-resonate-botanist.ngrok-free.dev/";

const FEBBOX_BASE = "https://www.febbox.com";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
  "sec-ch-ua":
    '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
};

// ✅ get token
async function getLiveToken() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(NGROK_URL, {
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeout);

    if (!res.ok) throw new Error("bad status");
    const data = await res.json();
    if (data?.token) return data.token;

    throw new Error("no token field");
  } catch (e: any) {
    console.log("ngrok failed, fallback:", e.message);
    return FALLBACK_TOKEN;
  }
}

// ✅ fetch player html
async function fetchPlayer(fid: string, shareKey: string, uiCookie: string) {
  const body = new URLSearchParams({
    fid,
    share_key: shareKey,
  });

  const res = await fetch(`${FEBBOX_BASE}/console/player2`, {
    method: "POST",
    headers: {
      ...BROWSER_HEADERS,
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Accept: "text/html, */*; q=0.01",
      "X-Requested-With": "XMLHttpRequest",
      Referer: `${FEBBOX_BASE}/share/${shareKey}`,
      Cookie: `ui=${uiCookie}`,
    },
    body: body.toString(),
    cache: "no-store",
  });

  return res.text();
}

// ✅ classify
function classifyResponse(text: string) {
  if (!text || text.trim().length < 200) return "empty";

  if (text.includes("Just a moment") || text.includes("__cf_chl"))
    return "cf_challenge";

  if (text.trim().startsWith("{")) {
    try {
      const p = JSON.parse(text);
      if (p?.code === -1 && p?.msg === "please login") return "login_error";
    } catch {}
  }

  if (
    text.includes("<title>Login - FEB</title>") ||
    text.includes("/login/google")
  ) {
    return "login_error";
  }

  return "ok";
}

// ✅ resolve html
async function resolveHtml(fid: string, shareKey: string) {
  const token = await getLiveToken();
  const entry = { gmail: "zxcprime370", token };

  try {
    const text = await fetchPlayer(fid, shareKey, token);
    const status = classifyResponse(text);

    if (status === "ok") {
      return { html: text, attempts: [{ result: status }], entry };
    }

    return { html: null, attempts: [{ result: status }], entry: null };
  } catch (err: any) {
    return {
      html: null,
      attempts: [{ result: "fetch_error", error: err.message }],
      entry: null,
    };
  }
}

// ✅ parsing functions (unchanged)
function parseSources(html: string) {
  const match = html.match(/var sources\s*=\s*(\[[\s\S]*?\]);/);
  if (!match) return [];

  try {
    return JSON.parse(match[1].replace(/\\\//g, "/")).map((s: any) => ({
      label: s.label,
      file: s.file,
      is_hls: s.file?.includes(".m3u8"),
      is_audio: s.label?.toLowerCase().startsWith("audio"),
    }));
  } catch {
    return [];
  }
}

function buildStreams(sources: any[]) {
  const hls = sources.find(
    (s) => !s.is_audio && s.is_hls && !s.file?.includes("vip_only"),
  );

  if (!hls) return {};

  if (!hls.file.includes("quality=")) {
    return { [hls.label.toLowerCase()]: hls.file };
  }

  const labels = sources
    .filter((s) => !s.is_audio && s.label)
    .map((s) => s.label.toLowerCase());

  return Object.fromEntries(
    labels.map((q) => [q, hls.file.replace(/quality=[^&]+/, `quality=${q}`)]),
  );
}

// ✅ handler
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const fid = searchParams.get("fid")?.trim();
  const shareKey = searchParams.get("share_key")?.trim();

  if (!fid || !shareKey) {
    return NextResponse.json(
      {
        error: "Missing parameters",
        example: "/api/febbox?fid=123&share_key=abc",
      },
      { status: 400 },
    );
  }

  const { html, attempts, entry } = await resolveHtml(fid, shareKey);

  if (!html) {
    return NextResponse.json(
      {
        error: "Failed to fetch",
        attempts,
      },
      { status: 401 },
    );
  }

  const sources = parseSources(html);
  const streams = buildStreams(sources);

  return NextResponse.json({
    success: true,
    fid,
    share_key: shareKey,
    streams,
    debug: { attempts },
  });
}
