import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const urlEncoded = req.nextUrl.searchParams.get("url") || "";
    const url = decodeURIComponent(urlEncoded);

    if (!url) {
      return NextResponse.json(
        { error: "Missing url parameter" },
        { status: 400 },
      );
    }

    const response = await fetch(url, {
      headers: {
        "sec-ch-ua": '"Not;A=Brand";v="8", "Chromium";v="150", "Brave";v="150"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "upgrade-insecure-requests": "1",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "sec-gpc": "1",
        "accept-language": "en-US,en;q=0.6",
        "sec-fetch-site": "cross-site",
        "sec-fetch-mode": "navigate",
        "sec-fetch-dest": "iframe",
        "sec-fetch-storage-access": "none",
        referer: "https://streamingunity.cc/",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch page" },
        { status: response.status },
      );
    }

    const html = await response.text();

    const videoId =
      html.match(/window\.video\s*=\s*{[\s\S]*?id:\s*'([^']+)'/)?.[1] ?? null;

    const masterUrl =
      html.match(/url:\s*'([^']*playlist\/[^']+)'/)?.[1] ?? null;

    const token = html.match(/'token':\s*'([^']+)'/)?.[1] ?? null;

    const expires = html.match(/'expires':\s*'([^']+)'/)?.[1] ?? null;

    const asn = html.match(/'asn':\s*'([^']*)'/)?.[1] ?? "";

    const canPlayFHD =
      html.match(/window\.canPlayFHD\s*=\s*(true|false)/)?.[1] === "true";

    const thumbnails =
      html.match(/window\.thumbnailsUrl\s*=\s*'([^']+)'/)?.[1] ?? null;

    const download =
      html.match(/window\.downloadUrl\s*=\s*'([^']+)'/)?.[1] ?? null;

    const embedParams = new URL(url).searchParams;
    const lang = embedParams.get("lang") ?? "en";

    let streamUrl: string | null = null;

    if (masterUrl && token && expires) {
      const params = new URLSearchParams({
        token,
        expires,
        h: "1",
        lang,
      });

      if (asn) {
        params.set("asn", asn);
      }

      streamUrl = `${masterUrl}?${params.toString()}`;
    }

    return NextResponse.json({
      videoId,
      token,
      expires,
      asn,
      canPlayFHD,
      thumbnails,
      download,
      streamUrl,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
