// import { NextResponse } from "next/server";

// export async function GET() {
//   try {
//     const response = await fetch("https://linds425fur.com/play/tt3915174", {
//       headers: {
//         "user-agent":
//           "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",
//       },
//     });

//     const html = await response.text();

//     // Extract playlist URL
//     const playlistMatch = html.match(/"file":"(https?:\\\/\\\/[^"]+)"/);

//     if (!playlistMatch) {
//       return NextResponse.json({
//         error: "Playlist URL not found",
//       });
//     }

//     const playlistUrl = playlistMatch[1].replace(/\\\//g, "/");

//     // Fetch playlist
//     const playlistResponse = await fetch(playlistUrl, {
//       headers: {
//         "user-agent":
//           "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",
//       },
//     });

//     const playlistText = await playlistResponse.text();

//     // Find all .m3u8 URLs
//     const m3u8Links = [
//       ...new Set(
//         playlistText.match(/https?:\/\/[^\s"'\\]+\.m3u8[^\s"'\\]*/g) ?? [],
//       ),
//     ];

//     return NextResponse.json({
//       playlist: playlistUrl,
//       m3u8: m3u8Links,
//     });
//   } catch (err) {
//     return NextResponse.json(
//       {
//         error: err instanceof Error ? err.message : String(err),
//       },
//       { status: 500 },
//     );
//   }
// }
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const url =
      "https://linds425fur.com/playlist/bPZaj+BQXo8x36H5Jigwx-dCDTV559kmwAZQ70750Fl8Q$7p9Tv+piOB1wNBCHmzB19miHfoC-lCuG0aSqijCASPgwY9w4VrP4aLGHmWquifhCd8vN9wjGU6SjEF9sBWNuG1H$Gl+BCTSupsw1tyHnE4nV6Pwtl3STsw+C5Ot+bEVSwzaEcXn1Mqx-3uqUS3.txt";

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "content-length": "0",
        "sec-ch-ua-platform": `"Windows"`,
        "x-csrf-token":
          "Q6vsqjXd8w1eI4wJe+rXyTQTksedG7aMotFn+9cMzXyKyVVcuA+Izt7QswgpTuKH",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",
        "sec-ch-ua": `"Not;A=Brand";v="8", "Chromium";v="150", "Brave";v="150"`,
        "content-type": "application/x-www-form-urlencoded",
        "sec-ch-ua-mobile": "?0",
        accept: "*/*",
        "sec-gpc": "1",
        "accept-language": "en-US,en;q=0.7",
        origin: "https://linds425fur.com",
        "sec-fetch-site": "same-origin",
        "sec-fetch-mode": "cors",
        "sec-fetch-dest": "empty",
        referer: "https://linds425fur.com/play/tt3915174",
        "accept-encoding": "gzip, deflate, br, zstd",
        priority: "u=1, i",
      },
    });

    const text = await response.text();

    return new NextResponse(text, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("content-type") ?? "text/plain; charset=utf-8",
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
