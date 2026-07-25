// // import { NextResponse } from "next/server";

// // export const runtime = "nodejs";

// // export async function GET() {
// //   try {
// //     const res = await fetch(
// //       "https://www.febbox.com/console/video_quality_list?fid=47092463",
// //       {
// //         method: "GET",
// //         headers: {
// //           Accept: "application/json, text/javascript, */*; q=0.01",
// //           "Accept-Encoding": "gzip, deflate, br, zstd",
// //           "Accept-Language": "en-US,en;q=0.8",

// //           Referer: "https://www.febbox.com/console",

// //           "User-Agent":
// //             "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",

// //           "X-Requested-With": "XMLHttpRequest",

// //           Cookie:
// //             'show_mode=; share_file_mode=grid2; ci=98e9d195fd72195760dafe1b2551423f; PHPSESSID=f3j8bqnmmh7gsnrjo3ivsqc7m2; g_state={"i_l":0,"i_ll":1784918868164,"i_b":"K+GbWkCYq4wQrLUriHUEygG61xmPv91v7hrG5JWnZvY","i_e":{"enable_itp_optimization":24},"i_et":1784918868164}; ui=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3ODQ5MTg5NTIsIm5iZiI6MTc4NDkxODk1MiwiZXhwIjoxODE2MDIyOTcyLCJkYXRhIjp7InVpZCI6MTk0MjU1NSwidG9rZW4iOiI5OGU5ZDE5NWZkNzIxOTU3NjBkYWZlMWIyNTUxNDIzZiJ9fQ.4vwhf-Sic_IKn1K_Rh_ddGWU6pE3X7-6R8yWCf3UHoo; cf_clearance=ECrN5SNhp.dG4E0lrPVDAgkGSfa88UXSbdao4E23vI4-1784919691-1.2.1.1-hAehJX5FkZZLRaESAjqxsls1Kk8b2JZLeK1eXaPHeE9JEgm1EQVf3PbjdlUDQF2zg185nWCYw0VdGzd1b97uWx5EZgxjBgUn7VgwURg5kXJk9x3Nc2PpfPUboh8weP82mtPkhcBTx4IHG6dnjqHp5w7c_ioDvvY8oeOedUWizujloFHxD3f2DXeX6qkxzgmQrdXTC55gXB9mvDql6GHGZlTnOw0tRiit1NdK_hAiwS.Hwxb6a_QY3YtMgcVAQoaMvVGShIz7LFFhyBJwWtrASn1p3rD.MBy8Kd7_fHzsAWF4J47T7PNMLyuCqoYlXRw3Pfynlv6OO82XlM06MZ7IrfLB6r5OAqWgWt9cY4gdsWA',
// //         },
// //       },
// //     );

// //     const data = await res.json();

// //     return NextResponse.json({
// //       success: res.ok,
// //       status: res.status,
// //       data,
// //     });
// //   } catch (e: any) {
// //     return NextResponse.json(
// //       {
// //         success: false,
// //         error: e.message,
// //       },
// //       { status: 500 },
// //     );
// //   }
// // }
// // app/api/vidfast/route.ts

// import { NextRequest, NextResponse } from "next/server";

// const API = "https://enc-dec.app/api";

// const HEADERS = {
//   "User-Agent":
//     "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
//   Referer: "https://vidfast.vc/",
//   "X-Requested-With": "XMLHttpRequest",
// };

// async function decrypt(text: string) {
//   const res = await fetch(`${API}/dec-vidfast`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({ text }),
//   });

//   const data = await res.json();

//   if (data.status !== 200) {
//     throw new Error(data.error);
//   }

//   return data.result;
// }

// export async function GET(req: NextRequest) {
//   try {
//     const type = req.nextUrl.searchParams.get("type");
//     const id = req.nextUrl.searchParams.get("id");
//     const season = req.nextUrl.searchParams.get("season");
//     const episode = req.nextUrl.searchParams.get("episode");

//     if (!type || !id) {
//       return NextResponse.json(
//         { success: false, error: "Missing parameters" },
//         { status: 400 },
//       );
//     }

//     const page =
//       type === "movie"
//         ? `https://vidfast.vc/movie/${id}`
//         : `https://vidfast.vc/tv/${id}/${season}/${episode}/`;

//     const html = await fetch(page).then((r) => r.text());

//     const token = html.match(/\\"(?:en|token)\\":\\"(.*?)\\"/)?.[1];

//     if (!token) {
//       throw new Error("Token not found");
//     }

//     const enc = await fetch(
//       `${API}/enc-vidfast?text=${encodeURIComponent(token)}`,
//     ).then((r) => r.json());

//     if (enc.status !== 200) {
//       throw new Error(enc.error);
//     }

//     const headers = {
//       ...HEADERS,
//       "X-CSRF-Token": enc.result.token,
//     };

//     const encryptedServers = await fetch(enc.result.servers, {
//       method: "POST",
//       headers,
//     }).then((r) => r.text());

//     const servers = await decrypt(encryptedServers);

//     const vRapid = servers.find((s: any) => s.name === "vRapid");

//     if (!vRapid) {
//       throw new Error("vRapid not found");
//     }

//     const encryptedStream = await fetch(`${enc.result.stream}/${vRapid.data}`, {
//       method: "POST",
//       headers,
//     }).then((r) => r.text());

//     const stream = await decrypt(encryptedStream);

//     return NextResponse.json({
//       success: true,
//       referer: HEADERS.Referer,
//       server: {
//         ...vRapid,
//         stream,
//       },
//     });
//   } catch (e: any) {
//     return NextResponse.json(
//       {
//         success: false,
//         error: e.message,
//       },
//       { status: 500 },
//     );
//   }
// }
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = {
  Origin: "https://vidfast.vc",
  Referer: "https://vidfast.vc/",
  Accept: "*/*",
  "Accept-Encoding": "identity",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",
};

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  const headers = new Headers(HEADERS);

  const range = req.headers.get("range");
  if (range) headers.set("Range", range);

  const ims = req.headers.get("if-modified-since");
  if (ims) headers.set("If-Modified-Since", ims);

  const res = await fetch(url, {
    headers,
    redirect: "follow",
    cache: "no-store",
  });

  const type = res.headers.get("content-type") || "";

  // Playlist
  if (
    type.includes("mpegurl") ||
    url.endsWith(".m3u8") ||
    url.includes(".m3u8?")
  ) {
    const base = new URL(res.url);

    let text = await res.text();

    text = text.replace(/^([^#].+)$/gm, (line) => {
      const absolute = new URL(line.trim(), base).toString();
      return `/ngi/?url=${encodeURIComponent(absolute)}`;
    });

    return new NextResponse(text, {
      status: res.status,
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  // Segments / images / ts / etc.
  const out = new Headers();

  [
    "content-type",
    "content-length",
    "content-range",
    "accept-ranges",
    "cache-control",
    "etag",
    "last-modified",
  ].forEach((h) => {
    const v = res.headers.get(h);
    if (v) out.set(h, v);
  });

  out.set("Access-Control-Allow-Origin", "*");

  return new NextResponse(res.body, {
    status: res.status,
    headers: out,
  });
}
