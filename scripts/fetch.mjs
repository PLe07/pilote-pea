/* Collecte : lance chaque source en parallèle, n'échoue jamais globalement,
   écrit un instantané brut + un journal de santé. */
import { writeFile, mkdir } from "node:fs/promises";
import { runSource } from "./lib/http.mjs";

import yahoo  from "./sources/yahoo.mjs";
import stooq  from "./sources/stooq.mjs";
import ecb    from "./sources/ecb.mjs";
import fx     from "./sources/fx.mjs";
import crypto from "./sources/crypto.mjs";
import fred   from "./sources/fred.mjs";
import av     from "./sources/alphavantage.mjs";
import fmp    from "./sources/fmp.mjs";
import news   from "./sources/news.mjs";

const SOURCES = [
  ["yahoo",        yahoo,  "Cours ETF, indices, taux, change, matières premières"],
  ["stooq",        stooq,  "Indices — source de secours"],
  ["bce",          ecb,    "Taux directeurs, €STR, inflation zone euro"],
  ["change",       fx,     "Taux de change de référence BCE"],
  ["crypto",       crypto, "Bitcoin, Ethereum"],
  ["fred",         fred,   "Macro États-Unis : inflation, taux, chômage, spreads"],
  ["alphavantage", av,     "Actualités notées en sentiment"],
  ["fmp",          fmp,    "Calendrier économique"],
  ["actualites",   news,   "Agrégation RSS multi-sources"]
];

const t0 = Date.now();
console.log(`Collecte — ${new Date().toISOString()}`);

const results = await Promise.all(SOURCES.map(([n, fn]) => runSource(n, fn)));

const raw = { collectedAt: new Date().toISOString(), durationMs: Date.now() - t0, sources: {}, health: [] };
results.forEach((r, i) => {
  raw.sources[r.name] = r.data;
  raw.health.push({
    name: r.name, label: SOURCES[i][2], ok: r.ok,
    ms: r.ms, points: r.points, error: r.error ?? null
  });
  console.log(`${r.ok ? "  ✓" : "  ✗"} ${r.name.padEnd(13)} ${String(r.points).padStart(4)} pts  ${r.ms} ms${r.error ? "  — " + r.error : ""}`);
});

const okCount = raw.health.filter(h => h.ok).length;
raw.quality = Math.round(okCount / SOURCES.length * 100);
console.log(`\nSources disponibles : ${okCount}/${SOURCES.length} (${raw.quality} %) en ${raw.durationMs} ms`);

await mkdir("docs/data", { recursive: true });
await writeFile("docs/data/raw.json", JSON.stringify(raw));
console.log("→ docs/data/raw.json");

/* Un seul cas justifie un échec dur : plus aucune donnée de marché. */
if (!raw.sources.yahoo && !raw.sources.stooq) {
  console.error("\nAucune source de cotation disponible. Les données précédentes seront conservées.");
  process.exit(0);
}
