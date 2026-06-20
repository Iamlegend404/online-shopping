// lib/token.ts  ← single source of truth, change here to rotate
import crypto from "crypto";
import { SALT } from "./salt";
// 🔁 Rotate these constants every few weeks

const FIELD_MAP = {
  id: "rgrwsdsdfgwrwrwwr", // was: zxczxc
  fToken: "xfgdfgdsffgrwgrwyjhkjt", // was: f_token
  ts: "rdghhdghhfssft", // was: ts / gago
  token: "ZDDVHJFGHYRHG", // was: putangnamo / token
  title: "TUKTHFSSFGDGHJS", // was: f
  year: "53653TRFG647GF", // was: g
  season: "adkljfhdahfladhfjahfjlahfhfljkadfdf", // was: c
  episode: "546745ygy46ytfgty", // was: d
  imdbId: "564745ygtuy5yi75yuy", // was: e
} as const;

export { FIELD_MAP };

export function generateFrontendToken(id: string) {
  const rt = Date.now();
  // 🔁 Rotate: swap order, add SALT, change hash algo to sha512 truncated
  const xt = crypto
    .createHash("sha512")
    .update(`${SALT}:${rt}:${id}`) // was: `${id}:${ts}`
    .digest("hex")
    .slice(0, 64); // truncate to 64 chars

  return { xt, rt }; // was: { f_token, f_ts }
}
