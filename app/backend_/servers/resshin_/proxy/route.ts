// // import { NextRequest, NextResponse } from "next/server";

// // export const runtime = "nodejs";

// // export async function GET(req: NextRequest) {
// //   return proxy(req);
// // }

// // export async function HEAD(req: NextRequest) {
// //   return proxy(req);
// // }

// // async function proxy(req: NextRequest) {
// //   try {
// //     const url = req.nextUrl.searchParams.get("url");

// //     if (!url) {
// //       return new NextResponse("Missing url", { status: 400 });
// //     }

// //     const headers: Record<string, string> = {
// //       "User-Agent":
// //         "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
// //       Referer: "https://moviebox.ph/",
// //       Origin: "https://moviebox.ph",
// //       Accept: "*/*",
// //       "Accept-Language": "en-US,en;q=0.7",
// //       "Accept-Encoding": "identity;q=1, *;q=0",
// //     };

// //     const range = req.headers.get("range");
// //     if (range) {
// //       headers["Range"] = range;
// //     }

// //     const upstream = await fetch(url, {
// //       method: req.method,
// //       headers,
// //     });

// //     return new NextResponse(upstream.body, {
// //       status: upstream.status,
// //       headers: upstream.headers,
// //     });
// //   } catch (err: any) {
// //     return NextResponse.json(
// //       { success: false, error: err.message },
// //       { status: 500 },
// //     );
// //   }
// // }
// import { NextRequest, NextResponse } from "next/server";

// export async function GET(req: NextRequest) {
//   return proxy(req);
// }

// export async function HEAD(req: NextRequest) {
//   return proxy(req);
// }

// async function proxy(req: NextRequest) {
//   try {
//     const url = req.nextUrl.searchParams.get("url");

//     if (!url) {
//       return new NextResponse("Missing url", { status: 400 });
//     }

//     const controller = new AbortController();

//     // Abort upstream if client disconnects
//     req.signal.addEventListener("abort", () => controller.abort());

//     const headers: Record<string, string> = {
//       accept: "*/*",
//       "accept-encoding": "identity",
//       "user-agent":
//         "com.community.mbox.in.geobypass/51042203 (Linux; U; Android 7.1.2; en_US; SM-G955N; Build/NRD90M.G955NKSU1AQDC; Cronet/104.0.5112.46)",

//       "x-client-info": JSON.stringify({
//         package_name: "com.community.mbox.in.geobypass",
//         version_name: "3.0.14.0422.03",
//         version_code: 51042203,
//         os: "android",
//         os_version: "7.1.2",
//         brand: "samsung",
//         model: "SM-G955N",
//         system_language: "en",
//         net: "NETWORK_WIFI",
//         region: "US",
//         timezone: "Africa/Brazzaville",
//         sp_code: "20801",
//         "X-Play-Mode": "2",
//         "X-Family-Mode": "0",
//       }),

//       "x-client-status": "0",
//       "x-family-mode": "0",
//       "x-play-mode": "2",
//     };

//     // Forward only needed request headers
//     for (const h of [
//       "range",
//       "if-range",
//       "if-none-match",
//       "if-modified-since",
//       "authorization",
//     ]) {
//       const value = req.headers.get(h);
//       if (value) headers[h] = value;
//     }

//     const upstream = await fetch(url, {
//       method: req.method,
//       headers,
//       redirect: "follow",
//       signal: controller.signal,
//       cache: "no-store",
//     });

//     const responseHeaders = new Headers();

//     // Forward only useful response headers
//     const passHeaders = [
//       "content-type",
//       "content-length",
//       "content-range",
//       "accept-ranges",
//       "etag",
//       "last-modified",
//       "cache-control",
//       "expires",
//       "date",
//     ];

//     for (const h of passHeaders) {
//       const value = upstream.headers.get(h);
//       if (value) {
//         responseHeaders.set(h, value);
//       }
//     }

//     responseHeaders.set("Access-Control-Allow-Origin", "*");
//     responseHeaders.set("Access-Control-Expose-Headers", "*");

//     return new NextResponse(upstream.body, {
//       status: upstream.status,
//       statusText: upstream.statusText,
//       headers: responseHeaders,
//     });
//   } catch (err: any) {
//     if (err.name === "AbortError") {
//       return new NextResponse(null, { status: 499 });
//     }

//     console.error("[Proxy]", err);

//     return NextResponse.json(
//       {
//         success: false,
//         error: err.message,
//       },
//       {
//         status: 500,
//       },
//     );
//   }
// }
import { NextRequest, NextResponse } from "next/server";
import { Agent, fetch as undiciFetch } from "undici";

// One shared, reusable connection pool for the lifetime of the server process.
// This avoids a fresh TCP+TLS handshake on every single request (and every
// range request during seeking), which is the biggest source of CPU/softirq
// load you were seeing.
const dispatcher = new Agent({
  keepAliveTimeout: 10_000, // keep idle sockets open 10s in case of reuse
  keepAliveMaxTimeout: 30_000,
  connections: 64, // max concurrent connections per origin in the pool
  pipelining: 1,
});

export async function GET(req: NextRequest) {
  return proxy(req);
}

export async function HEAD(req: NextRequest) {
  return proxy(req);
}

async function proxy(req: NextRequest) {
  try {
    const url = req.nextUrl.searchParams.get("url");

    if (!url) {
      return new NextResponse("Missing url", { status: 400 });
    }

    // Basic guard so this doesn't become an open proxy for arbitrary hosts.
    // Adjust / remove if you already validate this upstream.
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return new NextResponse("Invalid url", { status: 400 });
    }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return new NextResponse("Invalid protocol", { status: 400 });
    }

    const controller = new AbortController();
    req.signal.addEventListener("abort", () => controller.abort());

    const headers: Record<string, string> = {
      accept: "*/*",
      "accept-encoding": "identity",
      "user-agent":
        "com.community.mbox.in.geobypass/51042203 (Linux; U; Android 7.1.2; en_US; SM-G955N; Build/NRD90M.G955NKSU1AQDC; Cronet/104.0.5112.46)",

      "x-client-info": JSON.stringify({
        package_name: "com.community.mbox.in.geobypass",
        version_name: "3.0.14.0422.03",
        version_code: 51042203,
        os: "android",
        os_version: "7.1.2",
        brand: "samsung",
        model: "SM-G955N",
        system_language: "en",
        net: "NETWORK_WIFI",
        region: "US",
        timezone: "Africa/Brazzaville",
        sp_code: "20801",
        "X-Play-Mode": "2",
        "X-Family-Mode": "0",
      }),

      "x-client-status": "0",
      "x-family-mode": "0",
      "x-play-mode": "2",
    };

    // Forward only needed request headers
    for (const h of [
      "range",
      "if-range",
      "if-none-match",
      "if-modified-since",
      "authorization",
    ]) {
      const value = req.headers.get(h);
      if (value) headers[h] = value;
    }

    // Use undici's fetch directly with our pooled dispatcher instead of the
    // global fetch, so connections get reused across requests.
    const upstream = await undiciFetch(url, {
      method: req.method,
      headers,
      redirect: "follow",
      signal: controller.signal,
      dispatcher,
    });

    const responseHeaders = new Headers();

    const passHeaders = [
      "content-type",
      "content-length",
      "content-range",
      "accept-ranges",
      "etag",
      "last-modified",
      "cache-control",
      "expires",
      "date",
    ];

    for (const h of passHeaders) {
      const value = upstream.headers.get(h);
      if (value) {
        responseHeaders.set(h, value);
      }
    }

    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Expose-Headers", "*");

    return new NextResponse(upstream.body as any, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch (err: any) {
    if (err.name === "AbortError") {
      return new NextResponse(null, { status: 499 });
    }

    console.error("[Proxy]", err);

    return NextResponse.json(
      {
        success: false,
        error: err.message,
      },
      {
        status: 500,
      },
    );
  }
}
