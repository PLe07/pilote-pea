import { getText, sleep, num } from "../lib/http.mjs";
import { INDICES } from "../lib/universe.mjs";

/* Secours quand Yahoo ne répond pas. CSV : symbol,date,time,open,high,low,close,volume */
export default async function stooq() {
  const out = {};
  for (const ix of INDICES.filter(i => i.sq)) {
    try {
      const csv = await getText(
        `https://stooq.com/q/l/?s=${encodeURIComponent(ix.sq)}&f=sd2t2ohlcv&h&e=csv`,
        { retries: 1, timeout: 12000 });
      const [, row] = csv.trim().split(/\r?\n/);
      if (!row) continue;
      const c = row.split(",");
      const close = num(parseFloat(c[6]));
      if (close === null) continue;
      out[ix.id] = { id: ix.id, label: ix.label, last: close, date: c[1], source: "stooq" };
    } catch (e) {
      console.error(`    · stooq ${ix.id} indisponible : ${e.message}`);
    }
    await sleep(100);
  }
  if (!Object.keys(out).length) throw new Error("aucun indice récupéré");
  return out;
}
