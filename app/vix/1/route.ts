import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q");
    const mediaType = req.nextUrl.searchParams.get("mediaType"); // movie | tv
    const year = req.nextUrl.searchParams.get("year");
    if (!q) {
      return NextResponse.json(
        { error: "Missing q parameter" },
        { status: 400 },
      );
    }
    if (mediaType && !["movie", "tv"].includes(mediaType)) {
      return NextResponse.json(
        { error: "mediaType must be 'movie' or 'tv'" },
        { status: 400 },
      );
    }

    if (year && !/^\d{4}$/.test(year)) {
      return NextResponse.json(
        { error: "year must be a 4-digit year" },
        { status: 400 },
      );
    }

    const url = `https://streamingunity.cc/en/search?q=${encodeURIComponent(q)}`;

    const response = await fetch(url, {
      headers: {
        Accept: "text/html, application/xhtml+xml",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "en-US,en;q=0.6",
        "Content-Type": "application/json",
        Cookie:
          "XSRF-TOKEN=eyJpdiI6InBXNkVNUjBiVGljYVhqOUNZd1ZQRUE9PSIsInZhbHVlIjoiMDZDcERGS0ZsazlXWUNzOEZqdWhuclNOOUFBajNmZU01UVlJdEhTWndCd1EyUFEvZ2Q5NTFtcW5HRnVVbkpES0FXTGdiT1l6OUV1RE5FMjRHbkhZNHZvN2R2cWordFVwWW5yaGFnR2dmR2pHVnQ4U0lsYWozNFpUdDRZRDNRMUEiLCJtYWMiOiJjNzZkODA5NDczZTZiNWIxNTllM2FiZTEzYTBkZDI0MmY2ZWI3NTE0MTM2YTU2NWQ2NzQ1YjY2YTQyNmI1MWMzIiwidGFnIjoiIn0%3D; streamingcommunity_session=eyJpdiI6IjJxM1NVVEFOY2JRbmNEREJCMlNzSXc9PSIsInZhbHVlIjoiMTJXdTNhZEg1dnJZM25Sc2JQeC9VTms4azZXUGp1ZjJmTWNSMGZjOXBmcGd5YTNnZ0lGK1RLUmhDU2lPRDRSRUtUYWxucjhvcU92M1VGdXpQakpNK2dTYWpWMllOUEhuRXJ4Z0lyakpQRGZhZGFpRFVBaXBIT2l0QUxlNy9rT2ciLCJtYWMiOiJkOTA2MTMxYzg4NzJlNTE0NzY0NDc2N2IwNjBjOTRlNjJiNzRlMjQ5ODgxMjU5ZDE1MGQ3ZTEwMGZmMDA0ZDBkIiwidGFnIjoiIn0%3D",
        Priority: "u=1, i",
        Referer: url,
        "Sec-CH-UA": '"Not;A=Brand";v="8", "Chromium";v="150", "Brave";v="150"',
        "Sec-CH-UA-Mobile": "?0",
        "Sec-CH-UA-Platform": '"Windows"',
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "Sec-GPC": "1",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",
        "X-Inertia": "true",
        "X-Inertia-Version": "bb68be11cfdb585b21ab9538f0d0e334",
        "X-Requested-With": "XMLHttpRequest",
        "X-XSRF-TOKEN":
          "eyJpdiI6InBXNkVNUjBiVGljYVhqOUNZd1ZQRUE9PSIsInZhbHVlIjoiMDZDcERGS0ZsazlXWUNzOEZqdWhuclNOOUFBajNmZU01UVlJdEhTWndCd1EyUFEvZ2Q5NTFtcW5HRnVVbkpES0FXTGdiT1l6OUV1RE5FMjRHbkhZNHZvN2R2cWordFVwWW5yaGFnR2dmR2pHVnQ4U0lsYWozNFpUdDRZRDNRMUEiLCJtYWMiOiJjNzZkODA5NDczZTZiNWIxNTllM2FiZTEzYTBkZDI0MmY2ZWI3NTE0MTM2YTU2NWQ2NzQ1YjY2YTQyNmI1MWMzIiwidGFnIjoiIn0=",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch upstream" },
        { status: response.status },
      );
    }

    const json = await response.json();

    const result =
      (json?.props?.titles ?? [])
        .filter((item: any) => {
          if (mediaType && item.type !== mediaType) return false;

          if (year && item.last_air_date?.slice(0, 4) !== year) return false;

          return true;
        })
        .map((item: any) => ({
          id: item.id,
          slug: item.slug,
          title: item.name,
          type: item.type,
          score: item.score,
          year: item.last_air_date?.slice(0, 4) ?? null,
          seasons: item.type === "tv" ? item.seasons_count : undefined,
          poster:
            item.images?.find((i: any) => i.type === "poster")?.filename ??
            null,
          cover:
            item.images?.find((i: any) => i.type === "cover")?.filename ?? null,
          logo:
            item.images?.find((i: any) => i.type === "logo")?.filename ?? null,
        }))[0] ?? null;

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
