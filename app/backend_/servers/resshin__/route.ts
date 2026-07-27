//RESSHIN SERVER (thin proxy)
import { NextRequest, NextResponse } from "next/server";
import { validateBackendToken } from "@/lib/validate-token";
import { FIELD_MAP } from "@/lib/token";

// Change this to the URL of Backend B
// const EXTRACTION_BACKEND_URL =
//   process.env.RESSHIN_EXTRACTION_URL || "http://localhost:3000/extract";

export async function GET(req: NextRequest) {
  const logRequest = (status: number, reason: string) => {
    const tmdbId = req.nextUrl.searchParams.get(FIELD_MAP.id);
    const mediaType = req.nextUrl.searchParams.get("b");
    const season = req.nextUrl.searchParams.get(FIELD_MAP.season);
    const episode = req.nextUrl.searchParams.get(FIELD_MAP.episode);
    const extra = mediaType === "tv" ? `/${season}/${episode}` : "";

    const ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    console.log(
      `[RESSHIN] ${tmdbId}/${mediaType}${extra} | ${status} | ${reason} | IP: ${ip}`,
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
    const dubType = Number(req.nextUrl.searchParams.get("dubType") ?? "0");

    if (!tmdbId || !mediaType || !title || !date || !ts || !token) {
      logRequest(404, "missing params");
      return NextResponse.json(
        { success: false, error: "missing params" },
        { status: 404 },
      );
    }

    if (
      Date.now() - ts > 120000 ||
      !validateBackendToken(tmdbId, f_token, ts, token)
    ) {
      logRequest(403, "invalid token");
      return NextResponse.json(
        { success: false, error: "Invalid token" },
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
      dubType: String(dubType),
    });
    const origin = req.nextUrl.origin;
    const res = await fetch(
      `https://v-zxc-stream-xyz.up.railway.app/backend_/servers/resshin?${params.toString()}`,
      {
        method: "GET",
        // headers: {
        //   // optional: add an internal secret if you want
        //   // "x-internal-key": process.env.INTERNAL_KEY || "",
        // },
      },
    );

    const data = await res.json();

    if (!data.success) {
      logRequest(data.status || 500, data.error || "extraction failed");
      return NextResponse.json(
        { success: false, error: data.error || "extraction failed" },
        { status: data.status || 500 },
      );
    }

    logRequest(200, "OK");
    return NextResponse.json(data);
  } catch (err: any) {
    logRequest(500, err.message);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
