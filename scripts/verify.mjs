/* Garde-fou exécuté après l'analyse : refuse de publier un tableau de bord
   manifestement cassé. Mieux vaut garder les données de la veille. */
import { readFile } from "node:fs/promises";

const j = JSON.parse(await readFile("docs/data/latest.json", "utf8"));
const errs = [], warns = [];

const nQ = Object.keys(j.quotes || {}).length;
if (nQ < 5) errs.push(`seulement ${nQ} instruments cotés`);
if (!j.brief?.paragraphs?.length) errs.push("brief vide");
if (!j.regime?.label) errs.push("régime non calculé");

for (const [id, q] of Object.entries(j.quotes || {})) {
  if (q.last == null || !isFinite(q.last)) errs.push(`${id} : cours invalide`);
  if (q.last <= 0) errs.push(`${id} : cours négatif ou nul`);
  if (Math.abs(q.chg1d ?? 0) > 35 && !q.isRate) warns.push(`${id} : variation de ${q.chg1d} % sur une séance, à vérifier`);
  if (q.stale) warns.push(`${id} : repris de la veille`);
}
if ((j.quality ?? 0) < 40) warns.push(`couverture des sources à ${j.quality} %`);
if (!j.news?.top?.length) warns.push("aucune actualité collectée");

warns.forEach(w => console.warn("  ⚠ " + w));
if (errs.length) { errs.forEach(e => console.error("  ✗ " + e)); process.exit(1); }
console.log(`Contrôle passé — ${nQ} instruments, ${j.signals.length} signaux, ${warns.length} avertissement(s).`);
