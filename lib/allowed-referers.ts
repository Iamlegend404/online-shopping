const ALLOWED_REFERERS = [
  "http://localhost:3000/",
  "http://192.168.1.5:3000/",
  //
  "https://zxcstream.xyz/",
  "https://www.zxcstream.xyz/",
  //
  "https://zxcprime.xyz/",
  "https://www.zxcprime.xyz/",
  //
  "https://zxcprime.site/",
  "https://www.zxcprime.site/",
  //
  "https://z.zxcstream.xyz/",
  "https://daedalus.zxcstream.xyz/",
  "https://q.zxcstream.xyz/",
  "https://a.zxcstream.xyz/",
  "https://embed.zxcstream.xyz/",
  "https://cdn.zxcstream.xyz/",
];

export const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://192.168.1.5:3000",
  //
  "https://zxcstream.xyz",
  "https://www.zxcstream.xyz",
  //
  "https://zxcprime.xyz",
  "https://www.zxcprime.xyz",
  //
  "https://zxcprime.site",
  "https://www.zxcprime.site",
  //
  "https://z.zxcstream.xyz",
  "https://daedalus.zxcstream.xyz",
  "https://q.zxcstream.xyz",
  "https://a.zxcstream.xyz",
  "https://embed.zxcstream.xyz",
  "https://cdn.zxcstream.xyz",
];
export function isValidReferer(referer: string): boolean {
  return ALLOWED_REFERERS.some((allowed) => referer.includes(allowed));
}
