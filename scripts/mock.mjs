/* Génère un raw.json de démonstration à partir des niveaux réels du 31/07/2026.
   Deux usages : amorcer l'app avant le premier passage de la collecte
   automatique, et tester le moteur d'analyse hors ligne.
   Lancer : node scripts/mock.mjs */
import { writeFile, mkdir } from "node:fs/promises";
import { ALL_YAHOO } from "./lib/universe.mjs";

const REF = { // [dernier, clôture 31/12/2025]
  cac:[8509.64,8149.50], sx5e:[6358.01,5791.41], sxxp:[596,565], dax:[25630.78,24490.41],
  spx:[7489.72,6879.57], ndx:[27100,25050], comp:[25373.85,23372.75], rut:[2610,2430],
  n225:[64362.02,50339.48], shcomp:[3832.26,3968.84], vix:[18.4,16.2],
  us10:[4.735,4.138], us30:[5.21,4.55], us02:[3.86,3.92],
  eurusd:[1.1515,1.1735], gold:[4045.90,4325.17], brent:[89.86,61.23], btc:[62720.99,87566.44],
  WPEA:[6.42,5.95], DCAM:[27.9,25.8], CW8:[655,607], GPEA:[10.2,10.0],
  ETZ:[124.5,118.2], EUAM:[31.4,29.9], PAEEM:[35.8,33.1], PAASI:[37.2,34.0],
  PUST:[52.1,48.3], RS2K:[212,198], PSP5:[45.6,42.0], ESE:[38.9,35.8], OBLI:[126.4,124.1]
};

const D = n => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
const isBiz = d => ![0, 6].includes(new Date(d).getDay());

/* Volatilité annualisée par instrument — un fonds monétaire ne doit pas
   bouger comme le Nasdaq dans le jeu de démonstration. */
const VOL = {
  cac:.16, sx5e:.17, sxxp:.14, dax:.17, spx:.15, ndx:.22, comp:.20, rut:.21,
  n225:.19, shcomp:.18, vix:.85,
  us10:.13, us30:.12, us02:.16,
  eurusd:.07, gold:.15, brent:.32, btc:.55,
  WPEA:.15, DCAM:.15, CW8:.15, GPEA:.15, ETZ:.14, EUAM:.14,
  PAEEM:.19, PAASI:.20, PUST:.22, RS2K:.21, PSP5:.16, ESE:.16, OBLI:.004
};

/* Marche aléatoire ancrée exactement sur deux points connus :
   la clôture du 31/12 et le dernier cours. */
function serie(last, yearStart, vol = 0.16) {
  const dates = [];
  for (let i = 520; i >= 0; i--) { const d = D(i); if (isBiz(d)) dates.push(d); }
  const N = dates.length, sd = vol / Math.sqrt(252);
  const yStart = `${new Date().getFullYear()}-01-01`;
  let i0 = dates.findIndex(d => d >= yStart); if (i0 < 1) i0 = Math.floor(N * 0.55);

  const w = [0];
  for (let i = 1; i < N; i++) {
    const u = Math.random() || 1e-9, v = Math.random();
    const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);   // Box-Muller
    w.push(w[i - 1] + z * sd);
  }
  // correction affine en logarithme : h(i0) = log(yearStart), h(N-1) = log(last)
  const t0 = Math.log(yearStart), t1 = Math.log(last);
  const b = ((t1 - w[N - 1]) - (t0 - w[i0])) / (N - 1 - i0);
  const a = t0 - w[i0] - b * i0;
  const out = dates.map((d, i) => [d, +Math.exp(w[i] + a + b * i).toFixed(4)]);
  out[i0][1] = +yearStart.toFixed(4);
  out[N - 1][1] = +last.toFixed(4);
  return out;
}

const yahoo = {};
for (const inst of ALL_YAHOO) {
  const r = REF[inst.id]; if (!r) continue;
  const s = serie(r[0], r[1], VOL[inst.id] ?? 0.16);
  yahoo[inst.id] = {
    id: inst.id, label: inst.label, group: inst.group,
    symbol: inst.y, currency: inst.group === "etf" ? "EUR" : null,
    last: r[0], prevClose: s.at(-2)?.[1] ?? r[0], date: s.at(-1)[0], series: s
  };
}

const raw = {
  collectedAt: new Date().toISOString(), durationMs: 0, demo: true,
  quality: 66,
  sources: {
    yahoo,
    stooq: null,
    bce: {
      depo:{ id:"depo", label:"Taux de dépôt BCE", date:D(1), value:2.25, prev:2.25 },
      refi:{ id:"refi", label:"Taux de refinancement BCE", date:D(1), value:2.40, prev:2.40 },
      estr:{ id:"estr", label:"€STR", date:D(1), value:2.21, prev:2.21 },
      hicp:{ id:"hicp", label:"Inflation zone euro (IPCH, g.a.)", date:"2026-06", value:2.8, prev:3.2 },
      hicpCore:{ id:"hicpCore", label:"Inflation sous-jacente zone euro", date:"2026-06", value:2.4, prev:2.5 },
      unemp:{ id:"unemp", label:"Chômage zone euro", date:"2026-06", value:6.2, prev:6.3 }
    },
    change: { date: D(1), base:"EUR", rates:{ USD:1.1515, GBP:0.845, CHF:0.94, JPY:172.4, CNY:8.25 }, usdStartOfYear:1.1735 },
    crypto: { bitcoin:{ eur:54470, usd:62721, usd_24h_change:-1.2 }, ethereum:{ eur:2180, usd:2510, usd_24h_change:-0.8 } },
    fred: {
      cpi:{ id:"cpi", label:"Inflation US (IPC, g.a.)", date:"2026-06-01", value:3.5, prev:3.8 },
      cpiCore:{ id:"cpiCore", label:"Inflation US sous-jacente (g.a.)", date:"2026-06-01", value:2.6, prev:2.8 },
      fedUpper:{ id:"fedUpper", label:"Fed funds — borne haute", date:D(1), value:3.75, prev:3.75 },
      fedLower:{ id:"fedLower", label:"Fed funds — borne basse", date:D(1), value:3.50, prev:3.50 },
      dgs10:{ id:"dgs10", label:"Treasury 10 ans", date:D(1), value:4.735, prev:4.654 },
      dgs30:{ id:"dgs30", label:"Treasury 30 ans", date:D(1), value:5.21, prev:5.09 },
      dgs02:{ id:"dgs02", label:"Treasury 2 ans", date:D(1), value:3.86, prev:3.88 },
      spread102:{ id:"spread102", label:"Pente 10 ans − 2 ans", date:D(1), value:0.88, prev:0.77 },
      breakeven:{ id:"breakeven", label:"Inflation anticipée 10 ans", date:D(1), value:2.62, prev:2.58 },
      real10:{ id:"real10", label:"Taux réel US 10 ans", date:D(1), value:2.12, prev:2.07 },
      unrate:{ id:"unrate", label:"Chômage US", date:"2026-06-01", value:4.3, prev:4.2 },
      hy:{ id:"hy", label:"Spread high yield US", date:D(1), value:3.42, prev:3.38 }
    },
    alphavantage: null,
    fmp: null,
    actualites: {
      items: [
        { title:"La Fed maintient ses taux entre 3,50 % et 3,75 % et durcit le ton sur l'inflation", link:"https://www.federalreserve.gov/", source:"Fed — politique monétaire", weight:3, lang:"en", date:new Date(Date.now()-2*864e5).toISOString(), summary:"Vote de 9 voix contre 3 pour le statu quo.", tags:[{k:"def",lbl:"Taux & inflation"},{k:"us",lbl:"États-Unis"}] },
        { title:"La BCE laisse ses trois taux directeurs inchangés après la hausse de juin", link:"https://www.ecb.europa.eu/", source:"BCE", weight:3, lang:"en", date:new Date(Date.now()-9*864e5).toISOString(), summary:"Taux de dépôt maintenu à 2,25 %.", tags:[{k:"def",lbl:"Taux & inflation"},{k:"eu",lbl:"Europe"}] },
        { title:"Le Stoxx Europe 600 inscrit un nouveau record, le CAC 40 repasse au-dessus de 8 500 points", link:"https://www.lesechos.fr/", source:"Les Échos", weight:2, lang:"fr", date:new Date(Date.now()-864e5).toISOString(), summary:"Les publications trimestrielles portent la cote.", tags:[{k:"eu",lbl:"Europe"}] },
        { title:"Alphabet relève ses investissements à près de 200 milliards de dollars pour 2026", link:"https://www.cnbc.com/", source:"CNBC", weight:1, lang:"en", date:new Date(Date.now()-4*864e5).toISOString(), summary:"Les besoins de financement de l'IA interrogent le marché.", tags:[{k:"nq",lbl:"Technologie & IA"},{k:"risk",lbl:"Risque"}] },
        { title:"Le Brent repasse au-dessus de 100 dollars après la reprise des hostilités au Moyen-Orient", link:"https://www.investing.com/", source:"Investing — marchés", weight:1, lang:"en", date:new Date(Date.now()-6*864e5).toISOString(), summary:"Le pétrole a joué aux montagnes russes en juillet.", tags:[{k:"commo",lbl:"Énergie & matières"},{k:"risk",lbl:"Risque"}] },
        { title:"Amazon et Microsoft rassurent sur le cloud, la technologie rebondit", link:"https://finance.yahoo.com/", source:"Yahoo Finance", weight:1, lang:"en", date:new Date(Date.now()-864e5).toISOString(), summary:"Bonne fin de mois pour les indices américains.", tags:[{k:"nq",lbl:"Technologie & IA"},{k:"us",lbl:"États-Unis"}] }
      ],
      feeds: [{ source:"jeu de démonstration", ok:true, items:6 }],
      fetched: 6, deduped: 0
    }
  },
  health: [
    { name:"yahoo", label:"Cours ETF, indices, taux, change, matières premières", ok:true, ms:0, points:Object.keys(yahoo).length, error:null },
    { name:"stooq", label:"Indices — source de secours", ok:false, ms:0, points:0, error:"non sollicitée en mode démonstration" },
    { name:"bce", label:"Taux directeurs, €STR, inflation zone euro", ok:true, ms:0, points:6, error:null },
    { name:"change", label:"Taux de change de référence BCE", ok:true, ms:0, points:4, error:null },
    { name:"crypto", label:"Bitcoin, Ethereum", ok:true, ms:0, points:2, error:null },
    { name:"fred", label:"Macro États-Unis", ok:true, ms:0, points:12, error:null },
    { name:"alphavantage", label:"Actualités notées en sentiment", ok:false, ms:0, points:0, error:"ALPHAVANTAGE_API_KEY absente" },
    { name:"fmp", label:"Calendrier économique", ok:false, ms:0, points:0, error:"FMP_API_KEY absente" },
    { name:"actualites", label:"Agrégation RSS multi-sources", ok:true, ms:0, points:6, error:null }
  ]
};

await mkdir("docs/data", { recursive: true });
await writeFile("docs/data/raw.json", JSON.stringify(raw));
console.log(`raw.json de démonstration écrit — ${Object.keys(yahoo).length} instruments, ${raw.sources.actualites.items.length} actualités.`);
