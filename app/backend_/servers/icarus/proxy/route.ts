import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const urlParam = searchParams.get("url");
    if (!urlParam) return new Response("Missing url", { status: 400 });

    const decodedUrl = decodeURIComponent(urlParam);

    const ranges: [number, number][] = [
      [41, 57],
      [41, 60],
      [41, 72],
      [41, 73],
      [41, 116],
      [41, 138],
      [41, 160],
      [41, 175],
      [41, 188],
      [41, 203],
      [41, 215],
      [41, 222],
      [102, 0],
      [102, 22],
      [102, 68],
      [102, 89],
      [102, 130],
      [102, 164],
      [102, 176],
      [102, 212],
      [105, 16],
      [105, 48],
      [105, 112],
      [105, 160],
      [105, 224],
      [197, 136],
      [197, 148],
      [197, 156],
      [197, 210],
      [197, 232],
      [197, 248],
      [45, 96],
      [45, 100],
      [45, 108],
    ];
    const base = ranges[Math.floor(Math.random() * ranges.length)];
    const rand = () => Math.floor(Math.random() * 254) + 1;
    const randomIP = `${base[0]}.${base[1]}.${rand()}.${rand()}`;

    // Only do a HEAD request — no video bytes consumed
    const check = await fetch(decodedUrl, {
      method: "HEAD",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
        Referer: "https://netfilm.world/",
        Origin: "https://netfilm.world",
        Accept: "*/*",
        "X-Forwarded-For": randomIP,
        "CF-Connecting-IP": randomIP,
        "X-Real-IP": randomIP,
      },
    });

    if (!check.ok) {
      return Response.json(
        { success: false, status: check.status },
        { status: check.status },
      );
    }

    // Return the confirmed working URL back to the Worker
    return Response.json({ success: true, url: decodedUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
