import { fetchWithTimeout } from "@/lib/fetch-timeout";
import { NextRequest, NextResponse } from "next/server";
import { validateBackendToken } from "@/lib/validate-token";
import { isValidReferer } from "@/lib/allowed-referers";
import { FIELD_MAP } from "@/lib/token";
import { encryptUrl } from "@/lib/encryptor";
import { createClient } from "@supabase/supabase-js";

let blacklistCache: Set<string> | null = null;
let blacklistCacheTime = 0;
const BLACKLIST_TTL = 5 * 60_000;
async function getNext8AMPH(): Promise<string> {
  const now = new Date();
  const ph = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  const next8AM = new Date(ph);
  next8AM.setHours(8, 0, 0, 0);
  if (ph >= next8AM) next8AM.setDate(next8AM.getDate() + 1);
  const diff = next8AM.getTime() - ph.getTime();
  return new Date(now.getTime() + diff).toISOString();
}
async function blacklistProxy(proxy: string) {
  const expires_at = await getNext8AMPH();
  await supabase
    .from("proxy_blacklist")
    .upsert(
      { proxy, expires_at },
      { onConflict: "proxy", ignoreDuplicates: false },
    );
  blacklistCache?.add(proxy);
  console.log(`[PROXY] ⛔ blacklisted ${proxy}`);
}
async function getActiveProxies(proxies: string[]): Promise<string[]> {
  if (!blacklistCache || Date.now() - blacklistCacheTime > BLACKLIST_TTL) {
    const { data } = await supabase
      .from("proxy_blacklist")
      .select("proxy")
      .gt("expires_at", new Date().toISOString());
    blacklistCache = new Set((data ?? []).map((r: any) => r.proxy));
    blacklistCacheTime = Date.now();
  }
  return proxies.filter((p) => !blacklistCache!.has(p));
}
const supabase = createClient(
  process.env.NEXT_PUBLIC_HOLLY_SUPABASE_URL_HOLLY!,
  process.env.HOLLY_SUPABASE_SERVICE_ROLE_KEY_HOLLY!,
);
const GOOD_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.7871.114 Safari/537.36",
  Origin: "https://goodstream.cc",
  Referer:
    "https://goodstream.cc/embed/W3cPjhjEzF?__cf_chl_tk=SUf37oAYSwhfVhF8URs6D8SK2iP_w5RW9NDtbtCzul8-1783909042-1.0.1.1-2jmKyV_qr4Y10vE0u8rjgxQxVJxZZwFDSCLLQ_FdlbI",
  Cookie:
    "cf_clearance=Shib.kVZbVDgJDU1GKv1nbUVUVOmaQ5xdjU5pvCwLxg-1783909046-1.2.1.1-3iK8K2GIOeCtRAJ3l3WmPdDHjpKVpo8ieaAy17TRByJ0l0wKYlDPz2dRkqyRSeqz0TziVHmaJraDRzSBukJ.zJxeUwgxvat9hz8kCvB9kMjEmtKQpFxcxoYQ3I7FguWEndAqQppX9Xo.wkTgzNHGaQZuzDE6znn7G0RvI2BcRsIIR0u4wlxrsANladOz8CRnsMN.EQ7mvPcHd3AWq0hXpsjG1n6WJljyriChUetClEthytE4mhzRc_3qMEPlJ85W2wz9RfuH1247.rEjaBt1ztWlACrkcUtDDsYOquAojthHFmKygvZOYhnw.KVZXacdIQGVSakwm4ISD9z4C4M_qkxqYV4gG6jdqvOBLKKFho3j9rU.VpZ1vzMErFSMYH5NgETYeV3sYBCSOQFtd.ELqqBLIM_vvCF6WMj1OPDynQSxX28EGs7irFkcJGLQh6WPwE4LzHYfPYUfuP76bfKx3tj6aE6HVYfhZlmNb7QYTkgC62NvSBh6eh3snymTMkVN",
};
const HOLLY_WORKERS = [
  "https://orion.zxcprime362.workers.dev/",
  "https://orion.test8-98b.workers.dev/",
  "https://orion.test15-e6c.workers.dev/",
  "https://orion.test14-b67.workers.dev/",
  "https://orion.test13-ab8.workers.dev/",
  "https://orion.test12-3d3.workers.dev/",
  "https://orion.test11-a1b.workers.dev/",
  "https://orion.test5-9ab.workers.dev/",
  "https://orion.test7-337.workers.dev/",
  "https://orion.test6-cb9.workers.dev/",
  "https://orion.test9-6da.workers.dev/",
  "https://lucky-leaf-9eed.test26-ee5.workers.dev/",
  "https://black-thunder-0223.test25-30d.workers.dev/",
  "https://plain-lab-17af.test24-6ad.workers.dev/",
  "https://small-wood-adba.test23-515.workers.dev/",
  "https://dawn-field-efbb.test22-f82.workers.dev/",
  "https://rapid-rain-1898.test21-0af.workers.dev/",
  "https://blue-sun-2b6e.test20-5b4.workers.dev/",
  "https://broken-paper-2e14.test19-31a.workers.dev/",
  "https://polished-rice-b094.test18-8cb.workers.dev/",
  "https://soft-bread-864e.test16-011.workers.dev/",
];
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export async function getWorkingProxy(proxies: string[]) {
  const activeProxies = await getActiveProxies(proxies);
  const shuffledProxies = shuffle(activeProxies);
  for (const proxy of shuffledProxies) {
    try {
      const res = await fetchWithTimeout(
        proxy,
        { method: "HEAD", headers: { Range: "bytes=0-1" } },
        3000,
      );
      if (res.status === 429) {
        await blacklistProxy(proxy);
        continue;
      }
      if (res.ok) {
        return proxy;
      }
    } catch (e: any) {
      // console.log(`[PROXY] ✗ ${proxy} | ${e?.message}`);
    }
  }
  return null;
}
const priority = (file: string) => {
  if (file.includes("tripplestream.online")) return 0;
  if (file.includes("/pl/")) return 1;
  if (file.includes("/streamsvr/")) return 2;
  return 3;
};
export async function GET(req: NextRequest) {
  const logRequest = (status: number, reason: string) => {
    const tmdbId = req.nextUrl.searchParams.get(FIELD_MAP.id);
    const mediaType = req.nextUrl.searchParams.get("b");
    const season = req.nextUrl.searchParams.get(FIELD_MAP.season);
    const episode = req.nextUrl.searchParams.get(FIELD_MAP.episode);
    const extra = mediaType === "tv" ? `/${season}/${episode}` : "";
    console.log(
      `[ORION] ${tmdbId}/${mediaType}${extra} | ${status} | ${reason}`,
    );
  };

  try {
    const tmdbId = req.nextUrl.searchParams.get(FIELD_MAP.id);
    const mediaType = req.nextUrl.searchParams.get("b");
    const season = req.nextUrl.searchParams.get(FIELD_MAP.season) ?? "";
    const episode = req.nextUrl.searchParams.get(FIELD_MAP.episode) ?? "";
    const title = req.nextUrl.searchParams.get(FIELD_MAP.title);
    const year = req.nextUrl.searchParams.get(FIELD_MAP.year);
    const ts = Number(req.nextUrl.searchParams.get(FIELD_MAP.ts));
    const token = req.nextUrl.searchParams.get(FIELD_MAP.token)!;
    const f_token = req.nextUrl.searchParams.get(FIELD_MAP.fToken)!;

    if (!tmdbId || !mediaType || !title || !year || !ts || !token) {
      logRequest(404, "missing params");
      return NextResponse.json(
        { success: false, error: "need token" },
        { status: 404 },
      );
    }

    if (Date.now() - ts > 8000) {
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

    const worker = await getWorkingProxy(HOLLY_WORKERS);

    if (!worker) {
      logRequest(502, "no working worker");
      return NextResponse.json(
        { success: false, error: "No available worker" },
        { status: 502 },
      );
    }
    // ─── CACHE CHECK ─────────────────────────────────────────────────────────
    const { data: cached } = await supabase
      .from("holly_movie_cache")
      .select("sources")
      .eq("tmdb_id", Number(tmdbId))
      .eq("media_type", mediaType)
      .eq("season", season)
      .eq("episode", episode)
      .single();

    if (cached?.sources?.length) {
      const encryptedH = await encryptUrl(JSON.stringify(GOOD_HEADERS));

      const links = await Promise.all(
        [...cached.sources]
          .sort((a: any, b: any) => priority(a.file) - priority(b.file))
          .map(async (source: any) => ({
            source: source.file.includes("/pl/")
              ? "pl"
              : source.file.includes("/streamsvr/")
                ? "streamsvr"
                : "default",
            type: source.type === "hls" ? "hls" : "mp4",
            link: `${worker}proxy?data=${encodeURIComponent(await encryptUrl(source.file))}&h=${encodeURIComponent(encryptedH)}`,
            meow: true,
          })),
      );
      logRequest(200, "cache hit");
      return NextResponse.json({ success: true, links, subtitles: [] });
    }

    // ─── STEP 1: Scrape ──────────────────────────────────────────────────────
    const baseSlug = title
      .toLowerCase()
      .replace(/['''`]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const hollySlug =
      mediaType === "tv" && season && episode
        ? `${baseSlug}-season-${season}-episode-${episode}`
        : `${baseSlug}-${year}`;

    let step1Res = await fetchWithTimeout(
      `${worker}scrape?slug=${encodeURIComponent(hollySlug)}`,
      {},
      15000,
    );

    if (step1Res.status === 429) {
      const remaining = (await getActiveProxies(HOLLY_WORKERS)).filter(
        (w) => w !== worker,
      );
      for (const w of shuffle(remaining)) {
        const res = await fetchWithTimeout(
          `${w}scrape?slug=${encodeURIComponent(hollySlug)}`,
          {},
          15000,
        );
        if (res.status === 429) continue;
        step1Res = res;
        break;
      }
    }

    if (!step1Res.ok) {
      logRequest(502, "step 1 failed");
      return NextResponse.json(
        { success: false, error: "Holly step 1 failed" },
        { status: 502 },
      );
    }

    const step1Data = await step1Res.json();
    const qualities = step1Data.qualities ?? [];

    if (!qualities.length) {
      logRequest(404, "no qualities found");
      return NextResponse.json(
        { success: false, error: "No qualities found" },
        { status: 404 },
      );
    }

    // ─── STEP 2: Resolve embed ────────────────────────────────────────────────
    const bestQuality =
      qualities.find((q: any) => q.quality === "1080p") ??
      qualities.find((q: any) => q.quality === "default") ??
      qualities[0];
    const encryptedH = await encryptUrl(JSON.stringify(GOOD_HEADERS));
    const step2Res = await fetchWithTimeout(
      `${worker}resolve?embed_url=${encodeURIComponent(bestQuality.embed_url)}&h=${encodeURIComponent(encryptedH)}`,
      {},
      15000,
    );

    if (!step2Res.ok) {
      logRequest(502, "step 2 failed");
      return NextResponse.json(
        { success: false, error: "Holly step 2 failed" },
        { status: 502 },
      );
    }

    const step2Data = await step2Res.json();
    const sources = step2Data.sources ?? [];

    if (!sources.length) {
      logRequest(404, "no sources from step 2");
      return NextResponse.json(
        { success: false, error: "No sources from step 2" },
        { status: 404 },
      );
    }

    await supabase.from("holly_movie_cache").upsert(
      {
        tmdb_id: Number(tmdbId),
        media_type: mediaType,
        season,
        episode,
        embeds: qualities,
        sources,
      },
      { onConflict: "tmdb_id,media_type,season,episode" },
    );

    // ─── STEP 3: Build links ──────────────────────────────────────────────────

    const links = await Promise.all(
      [...sources]
        .sort((a: any, b: any) => priority(a.file) - priority(b.file))
        .map(async (source: any) => ({
          source: source.file.includes("/pl/")
            ? "pl"
            : source.file.includes("/streamsvr/")
              ? "streamsvr"
              : "default",
          type: source.type === "hls" ? "hls" : "mp4",
          link: `${worker}proxy?data=${encodeURIComponent(await encryptUrl(source.file))}&h=${encodeURIComponent(encryptedH)}`,
        })),
    );

    logRequest(200, "OK!!!!!");
    return NextResponse.json({ success: true, links, subtitles: [] });
  } catch (err) {
    console.error("Holly route error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
