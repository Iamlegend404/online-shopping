import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing id parameter" },
        { status: 400 },
      );
    }

    const response = await fetch(`https://streamingunity.cc/en/iframe/${id}`, {
      headers: {
        "sec-ch-ua-platform": '"Windows"',
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "sec-ch-ua": '"Not;A=Brand";v="8", "Chromium";v="150", "Brave";v="150"',
        "upgrade-insecure-requests": "1",
        "sec-ch-ua-mobile": "?0",
        "sec-gpc": "1",
        "accept-language": "en-US,en;q=0.6",
        "sec-fetch-site": "same-origin",
        "sec-fetch-mode": "navigate",
        "sec-fetch-dest": "empty",
        referer: `https://streamingunity.cc/en/watch/${id}`,
        "accept-encoding": "gzip, deflate, br",
        cookie:
          "XSRF-TOKEN=eyJpdiI6ImRNbC9DaHVrczVSVGRYYTh2QWtTdlE9PSIsInZhbHVlIjoiT2dlVVZkVTFWSU9tQndMUG44UkVSQjc5WVNYcDA2aFZweEZBOUQ1bm44clpGcTBsQjFSOHBYRVhoeldwZ0NaanlDa3F1UzNlbHVHaTRzUjQ5blhlYk5MSGdab0lZZ2lHMFRhWWRYazR1MlZLL1h4L3dCaDhFcnpDT0RoVzBLZlYiLCJtYWMiOiI2Njk3MTgxYjc1YmE0MmJjODk1NjQxNjAzOWFhZTMyYzA0NWEzMzA1Zjg3NzVlYjM1YmUyYjRmOTkyYTk2ZjI5IiwidGFnIjoiIn0%3D; streamingcommunity_session=eyJpdiI6IjJIdkZmdmUvOVF4b0FqcVZobHVVYnc9PSIsInZhbHVlIjoiVHIvRzY4OTdwdUp2cUM2L29TTVZHdkFYWmFZWDREUy85NVZQbk1oc2RjTWVZSjlFRFppY2Z4YTdJWTBjSCtqUmpWSkZtU0VTUU9EWjBxSTd5QlYwRGNQMWxXdFZZaHU4V1dsODIvb2l3RVRJVXY0SHNQYUdxWEdTM05pMWRMaUEiLCJtYWMiOiJlYjhjOTBlYTMzNzRlMWVlZTMwZTY3ZjY5Zjc4YmMzMmExOThiOWRlNjY3MDZmNzY0N2RlYzRiNmFjNjVjODVjIiwidGFnIjoiIn0%3D",
        priority: "u=0, i",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch iframe" },
        { status: response.status },
      );
    }

    const html = await response.text();

    const src = html.match(/<iframe[^>]+src=["']([^"']+)["']/i)?.[1];

    if (!src) {
      return NextResponse.json(
        { error: "Iframe src not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      src: encodeURIComponent(src.replace(/&amp;/g, "&")),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
