import { NextResponse } from "next/server";

const decode = (str: string) =>
  str
    .replace(/\\"/g, '"')
    .replace(/\\\//g, "/")
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    );

export async function GET() {
  try {
    const res = await fetch(
      "https://hdrezka.in/cartoons/fiction/71565-dikiy-robot-2024-latest/238-subtitles.html",
      {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.6",
          "Cache-Control": "max-age=0",
          "Sec-GPC": "1",
          "Upgrade-Insecure-Requests": "1",
          "sec-ch-ua":
            '"Not;A=Brand";v="8", "Chromium";v="150", "Brave";v="150"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "Sec-Fetch-Site": "none",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-User": "?1",
          "Sec-Fetch-Dest": "document",
          Cookie:
            "techaro.lol-anubis-cookie-verification=019fac37-ba5c-77ba-96b6-9f1dd3ca98c5; techaro.lol-anubis-auth=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhY3Rpb24iOiJDSEFMTEVOR0UiLCJjaGFsbGVuZ2UiOiIwMTlmYWMzNy1iYTVjLTc3YmEtOTZiNi05ZjFkZDNjYTk4YzUiLCJleHAiOjE3ODc4OTI3NjIsImlhdCI6MTc4NTMwMDc2MiwibWV0aG9kIjoiZmFzdCIsIm5iZiI6MTc4NTMwMDcwMiwicG9saWN5UnVsZSI6ImFjOTgwZjQ5YzRkMzVmYWIiLCJyZXN0cmljdGlvbiI6IjJkODZmMGMzZjRiYTg1ODY5NzA5NDQ4NzhhMjM0MDQ0YzI4YjE3Y2JlMDkzYTg1MzI0Y2NjNzMwZDM4ZDZmMDcifQ.Od_JSvTDyVrYDlDSmFUZbiw7s_owH0ZwLv_js-qE5Jhb7RIaUrp2Fp9ZIGh3_kEb29lYIrUzvhFrZNTZZPLfAg; PHPSESSID=t1l02sl6tdg6m7o17li5ff0nuu; dle_user_taken=1; dle_user_token=80595b3c0d2a6b8e3419d53881169808; _vc_id=E_rgXBIoJm-r96q6wFL7tLbcGh0TKth2; _vc_day=2026-07-29",
        },
        redirect: "follow",
      },
    );

    const html = await res.text();

    // Find sof.tv.initCDNSeriesEvents(...)
    const match = html.match(
      /sof\.tv\.initCDN(?:Series|Movies)Events\([\s\S]*?\{([\s\S]*?)\}\s*\);/,
    );
    if (!match) {
      return NextResponse.json(
        {
          error: "initCDNSeriesEvents not found",
        },
        { status: 404 },
      );
    }

    const data = match[1];

    const streamsMatch = data.match(/"streams"\s*:\s*"([\s\S]*?)"/);
    const subtitleMatch = data.match(/"subtitle"\s*:\s*"([\s\S]*?)"/);

    const streamsRaw = streamsMatch ? decode(streamsMatch[1]) : "";
    const subtitlesRaw = subtitleMatch ? decode(subtitleMatch[1]) : "";

    const streamRegex =
      /\[(.*?)\](https?:\/\/[^\s,"]+)(?:\s+or\s+(https?:\/\/[^\s,"]+))?/g;
    const subtitleRegex = /\[(.*?)\](https?:\/\/[^\s,"]+)/g;

    const streams: {
      quality: string;
      hls: string | null;
      mp4: string | null;
    }[] = [];

    let m: RegExpExecArray | null;

    while ((m = streamRegex.exec(streamsRaw)) !== null) {
      const quality = m[1].replace(/<[^>]+>/g, "").trim();

      const first = m[2];
      const second = m[3] ?? null;

      streams.push({
        quality,
        hls: first.includes(":hls:manifest.m3u8") ? first : second,
        mp4: first.includes(":hls:manifest.m3u8") ? second : first,
      });
    }

    const subtitles: {
      language: string;
      url: string;
    }[] = [];

    while ((m = subtitleRegex.exec(subtitlesRaw)) !== null) {
      subtitles.push({
        language: m[1],
        url: m[2],
      });
    }

    return NextResponse.json({
      streams,
      subtitles,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
