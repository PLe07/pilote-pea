import { get, sleep, num } from "../lib/http.mjs";

const SERIES = {
  cpi:        { id:"CPIAUCSL",  label:"Inflation US (IPC, g.a.)",         yoy:true },
  cpiCore:    { id:"CPILFESL",  label:"Inflation US sous-jacente (g.a.)", yoy:true },
  fedUpper:   { id:"DFEDTARU",  label:"Fed funds — borne haute" },
  fedLower:   { id:"DFEDTARL",  label:"Fed funds — borne basse" },
  dgs10:      { id:"DGS10",     label:"Treasury 10 ans" },
  dgs30:      { id:"DGS30",     label:"Treasury 30 ans" },
  dgs02:      { id:"DGS2",      label:"Treasury 2 ans" },
  spread102:  { id:"T10Y2Y",    label:"Pente 10 ans − 2 ans" },
  breakeven:  { id:"T10YIE",    label:"Inflation anticipée 10 ans" },
  real10:     { id:"DFII10",    label:"Taux réel US 10 ans" },
  unrate:     { id:"UNRATE",    label:"Chômage US" },
  hy:         { id:"BAMLH0A0HYM2", label:"Spread high yield US" }
};

export default async function fred() {
  const key = process.env.FRED_API_KEY;
  if (!key) throw new Error("FRED_API_KEY absente — source ignorée");
  const out = {};
  for (const [k, s] of Object.entries(SERIES)) {
    try {
      const j = await get(`https://api.stlouisfed.org/fred/series/observations` +
        `?series_id=${s.id}&api_key=${key}&file_type=json&sort_order=desc&limit=${s.yoy ? 15 : 8}`,
        { retries: 1, timeout: 15000 });
      const obs = (j.observations || []).filter(o => o.value !== ".")
                    .map(o => [o.date, parseFloat(o.value)]).filter(o => num(o[1]) !== null);
      if (!obs.length) continue;
      let value = obs[0][1], prev = obs[1]?.[1] ?? null;
      if (s.yoy && obs.length >= 13) {           // indice de prix → glissement annuel
        value = (obs[0][1] / obs[12][1] - 1) * 100;
        prev  = obs[1] && obs[13] ? (obs[1][1] / obs[13][1] - 1) * 100 : null;
      }
      out[k] = { id:k, label:s.label, date:obs[0][0],
                 value:+value.toFixed(2), prev: prev === null ? null : +prev.toFixed(2) };
    } catch (e) {
      console.error(`    · fred ${k} indisponible : ${e.message}`);
    }
    await sleep(150);
  }
  if (!Object.keys(out).length) throw new Error("aucune série FRED récupérée");
  return out;
}
