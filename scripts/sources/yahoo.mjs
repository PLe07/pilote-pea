import { get, sleep, num } from "../lib/http.mjs";
import { ALL_YAHOO } from "../lib/universe.mjs";

const BASES = [
  "https://query1.finance.yahoo.com/v8/finance/chart/",
  "https://query2.finance.yahoo.com/v8/finance/chart/"
];

async function chart(symbol) {
  let err;
  for (const base of BASES) {
    try {
      const url = `${base}${encodeURIComponent(symbol)}?range=2y&interval=1d&includePrePost=false`;
      const j = await get(url, { retries: 1, timeout: 15000 });
      const r = j?.chart?.result?.[0];
      if (!r) throw new Error("réponse vide");
      const ts = r.timestamp || [];
      const cl = r.indicators?.quote?.[0]?.close || [];
      const series = [];
      for (let i = 0; i < ts.length; i++) {
        if (num(cl[i]) !== null) {
          series.push([new Date(ts[i] * 1000).toISOString().slice(0, 10), +cl[i].toFixed(4)]);
        }
      }
      if (!series.length) throw new Error("aucune cotation");
      const meta = r.meta || {};
      return {
        symbol,
        currency: meta.currency || null,
        last: num(meta.regularMarketPrice) ?? series.at(-1)[1],
        prevClose: num(meta.chartPreviousClose) ?? (series.at(-2)?.[1] ?? null),
        date: series.at(-1)[0],
        series
      };
    } catch (e) { err = e; }
  }
  throw err;
}

export default async function yahoo() {
  const out = {};
  for (const inst of ALL_YAHOO) {
    try {
      const q = await chart(inst.y);
      out[inst.id] = { ...q, id: inst.id, label: inst.label, group: inst.group };
    } catch (e) {
      console.error(`    · yahoo ${inst.id} (${inst.y}) indisponible : ${e.message}`);
    }
    await sleep(120); // courtoisie : on ne martèle pas l'API
  }
  if (!Object.keys(out).length) throw new Error("aucun instrument récupéré");
  return out;
}
