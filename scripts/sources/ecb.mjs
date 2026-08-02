import { get, sleep, num } from "../lib/http.mjs";

const BASE = "https://data-api.ecb.europa.eu/service/data";

/* SDMX-JSON : les observations sont indexées par position, les dates vivent
   dans structure.dimensions.observation[0].values. */
function parseSdmx(j) {
  const ds = j?.dataSets?.[0];
  const series = ds?.series && Object.values(ds.series)[0];
  const dims = j?.structure?.dimensions?.observation?.[0]?.values || [];
  if (!series?.observations) return [];
  return Object.entries(series.observations)
    .map(([i, v]) => [dims[+i]?.id || dims[+i]?.name || String(i), num(v?.[0])])
    .filter(([, v]) => v !== null)
    .sort((a, b) => (a[0] < b[0] ? -1 : 1));
}

async function serie(key, n = 24) {
  const j = await get(`${BASE}/${key}?lastNObservations=${n}&format=jsondata`,
                      { retries: 1, timeout: 20000 });
  return parseSdmx(j);
}

const SERIES = {
  depo:      { key: "FM/D.U2.EUR.4F.KR.DFR.LEV",   n: 60,  label: "Taux de dépôt BCE" },
  refi:      { key: "FM/D.U2.EUR.4F.KR.MRR_FR.LEV",n: 60,  label: "Taux de refinancement BCE" },
  estr:      { key: "EST/B.EU000A2X2A25.WT",       n: 30,  label: "€STR" },
  hicp:      { key: "ICP/M.U2.N.000000.4.ANR",     n: 24,  label: "Inflation zone euro (IPCH, g.a.)" },
  hicpCore:  { key: "ICP/M.U2.N.XEF000.4.ANR",     n: 24,  label: "Inflation sous-jacente zone euro" },
  unemp:     { key: "LFSI/M.I9.S.UNEHRT.TOTAL0.15_74.T", n: 18, label: "Chômage zone euro" }
};

export default async function ecb() {
  const out = {};
  for (const [id, s] of Object.entries(SERIES)) {
    try {
      const pts = await serie(s.key, s.n);
      if (!pts.length) continue;
      const [date, value] = pts.at(-1);
      const prev = pts.at(-2)?.[1] ?? null;
      out[id] = { id, label: s.label, date, value, prev, series: pts.slice(-24) };
    } catch (e) {
      console.error(`    · bce ${id} indisponible : ${e.message}`);
    }
    await sleep(200);
  }
  if (!Object.keys(out).length) throw new Error("aucune série BCE récupérée");
  return out;
}
