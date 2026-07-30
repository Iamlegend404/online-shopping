// ICARUS SERVER (thin proxy)
import { NextRequest, NextResponse } from "next/server";
import { validateBackendToken } from "@/lib/validate-token";
import { isValidReferer } from "@/lib/allowed-referers";
import { FIELD_MAP } from "@/lib/token";

export async function GET(req: NextRequest) {
  const logRequest = (status: number, reason: string) => {
    const tmdbId = req.nextUrl.searchParams.get(FIELD_MAP.id);
    const mediaType = req.nextUrl.searchParams.get("b");
    const season = req.nextUrl.searchParams.get(FIELD_MAP.season);
    const episode = req.nextUrl.searchParams.get(FIELD_MAP.episode);
    const extra = mediaType === "tv" ? `/${season}/${episode}` : "";

    console.log(
      `[ICARUS] ${tmdbId}/${mediaType}${extra} | ${status} | ${reason}`,
    );
  };

  try {
    const tmdbId = req.nextUrl.searchParams.get(FIELD_MAP.id);
    const mediaType = req.nextUrl.searchParams.get("b");
    const season = req.nextUrl.searchParams.get(FIELD_MAP.season);
    const episode = req.nextUrl.searchParams.get(FIELD_MAP.episode);
    const title = req.nextUrl.searchParams.get(FIELD_MAP.title);
    const date = req.nextUrl.searchParams.get("date");
    const ts = Number(req.nextUrl.searchParams.get(FIELD_MAP.ts));
    const token = req.nextUrl.searchParams.get(FIELD_MAP.token)!;
    const f_token = req.nextUrl.searchParams.get(FIELD_MAP.fToken)!;
    const dubCode = req.nextUrl.searchParams.get("dubCode");
    const dubType = req.nextUrl.searchParams.get("dubType");

    if (!tmdbId || !mediaType || !title || !date || !ts || !token) {
      logRequest(404, "missing params");
      return NextResponse.json(
        { success: false, error: "need token" },
        { status: 404 },
      );
    }

    if (Date.now() - ts > 30000) {
      logRequest(403, "token expired");
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 403 },
      );
    }

    if (!validateBackendToken(tmdbId, f_token, ts, token)) {
      logRequest(403, "invalid token");
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 403 },
      );
    }

    const referer = req.headers.get("referer") || "";
    if (!isValidReferer(referer)) {
      logRequest(403, "invalid referrer");
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    // Forward only the extraction params to Backend B
    const params = new URLSearchParams({
      tmdbId,
      mediaType,
      title,
      date,
      ...(season && { season }),
      ...(episode && { episode }),
      ...(dubCode && { dubCode }),
      ...(dubType && { dubType }),
    });

    const res = await fetch(
      `https://v-zxc-stream-xyz.up.railway.app/backend_/servers/icarus__?${params.toString()}`,
      { method: "GET" },
    );

    const data = await res.json();

    if (!data.success) {
      logRequest(data.status || 500, data.error || "extraction failed");
      return NextResponse.json(
        { success: false, error: data.error || "extraction failed" },
        { status: data.status || 500 },
      );
    }

    logRequest(200, "ICARUS OK!!!!!");
    return NextResponse.json(data);
  } catch (err: any) {
    logRequest(500, `exception: ${err?.message}`);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
