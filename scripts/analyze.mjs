/* Analyse : transforme l'instantané brut en tableau de bord exploitable.
   Principe directeur — le biais par défaut est l'inaction. Un portefeuille
   long terme ne se pilote pas sur l'actualité ; l'app dit ce qui a changé,
   pas ce qu'il faut acheter. */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { ETFS, INDICES } from "./lib/universe.mjs";

const R = p => readFile(p, "utf8").then(JSON.parse).catch(() => null);
const round = (n, d = 2) => (n === null || !isFinite(n) ? null : +n.toFixed(d));
const today = new Date().toISOString().slice(0, 10);

const raw  = await R("docs/data/raw.json");
const prev = await R("docs/data/latest.json");
if (!raw) { console.error("raw.json introuvable — lancer d'abord `npm run collect`"); process.exit(1); }

/* ─────────── 1. Cotations enrichies ─────────── */
function enrich(q) {
  const s = q.series || [];
  if (!s.length) return null;
  const closes = s.map(x => x[1]), dates = s.map(x => x[0]);
  const last = q.last ?? closes.at(-1);
  const at = back => closes[Math.max(0, closes.length - 1 - back)] ?? null;
  const chg = ref => (ref ? (last / ref - 1) * 100 : null);

  const yStart = `${new Date().getFullYear()}-01-01`;
  let ytdRef = null;
  for (let i = 0; i < dates.length; i++) { if (dates[i] >= yStart) { ytdRef = closes[Math.max(0, i - 1)]; break; } }

  const win = closes.slice(-252);
  const hi = Math.max(...win), lo = Math.min(...win);
  const ma200 = closes.length >= 200 ? closes.slice(-200).reduce((a, b) => a + b, 0) / 200 : null;
  const ma50  = closes.length >= 50  ? closes.slice(-50).reduce((a, b) => a + b, 0) / 50  : null;

  // volatilité annualisée sur 60 séances
  const rets = [];
  for (let i = Math.max(1, closes.length - 60); i < closes.length; i++) rets.push(Math.log(closes[i] / closes[i - 1]));
  const mu = rets.reduce((a, b) => a + b, 0) / (rets.length || 1);
  const vol = rets.length > 5
    ? Math.sqrt(rets.reduce((a, b) => a + (b - mu) ** 2, 0) / (rets.length - 1)) * Math.sqrt(252) * 100 : null;

  /* Un taux ou un indice de volatilité se lit en points, pas en pourcentage. */
  const isRate = q.group === "rate" || q.id === "vix";
  const pts = ref => (ref ? last - ref : null);

  return {
    id: q.id, label: q.label, group: q.group, currency: q.currency, date: q.date,
    isRate,
    last: round(last, 4),
    d1Pts:  isRate ? round(pts(q.prevClose ?? at(1)), 3) : null,
    d1wPts: isRate ? round(pts(at(5)), 3) : null,
    d1mPts: isRate ? round(pts(at(21)), 3) : null,
    ytdPts: isRate ? round(pts(ytdRef), 3) : null,
    chg1d:  round(chg(q.prevClose ?? at(1))),
    chg1w:  round(chg(at(5))),
    chg1m:  round(chg(at(21))),
    chg3m:  round(chg(at(63))),
    chgYtd: round(chg(ytdRef)),
    chg1y:  round(chg(at(252))),
    high52: round(hi, 4), low52: round(lo, 4),
    ddFromHigh: round((last / hi - 1) * 100),
    fromLow:    round((last / lo - 1) * 100),
    ma50: round(ma50, 4), ma200: round(ma200, 4),
    aboveMa200: ma200 ? last > ma200 : null,
    vol60: round(vol, 1),
    spark: closes.filter((_, i) => i % Math.max(1, Math.ceil(closes.length / 60)) === 0).slice(-60).map(v => round(v, 2))
  };
}

const quotes = {};
for (const [id, q] of Object.entries(raw.sources.yahoo || {})) {
  const e = enrich(q); if (e) quotes[id] = e;
}
/* Secours Stooq pour les indices manquants */
for (const [id, q] of Object.entries(raw.sources.stooq || {})) {
  if (!quotes[id]) quotes[id] = { id, label: q.label, group: "index", last: round(q.last, 2), date: q.date, degraded: true };
}
/* Si un instrument est tombé aujourd'hui, on garde la valeur de la veille plutôt que de perdre la ligne */
let carried = 0;
for (const [id, q] of Object.entries(prev?.quotes || {})) {
  if (!quotes[id]) { quotes[id] = { ...q, stale: true }; carried++; }
}

/* ─────────── 2. Macro consolidée ─────────── */
const bce = raw.sources.bce || {}, fred = raw.sources.fred || {};
const macro = {
  bce: {
    depo:     bce.depo     ? { v: bce.depo.value,     d: bce.depo.date,     l: "Taux de dépôt BCE" } : null,
    refi:     bce.refi     ? { v: bce.refi.value,     d: bce.refi.date,     l: "Refinancement BCE" } : null,
    estr:     bce.estr     ? { v: bce.estr.value,     d: bce.estr.date,     l: "€STR au jour le jour" } : null,
    hicp:     bce.hicp     ? { v: bce.hicp.value,     d: bce.hicp.date,     l: "Inflation zone euro", prev: bce.hicp.prev } : null,
    hicpCore: bce.hicpCore ? { v: bce.hicpCore.value, d: bce.hicpCore.date, l: "Inflation sous-jacente zone euro", prev: bce.hicpCore.prev } : null,
    unemp:    bce.unemp    ? { v: bce.unemp.value,    d: bce.unemp.date,    l: "Chômage zone euro" } : null
  },
  fed: {
    upper:    fred.fedUpper  ? { v: fred.fedUpper.value,  d: fred.fedUpper.date,  l: "Fed funds — borne haute" } : null,
    lower:    fred.fedLower  ? { v: fred.fedLower.value,  d: fred.fedLower.date,  l: "Fed funds — borne basse" } : null,
    cpi:      fred.cpi       ? { v: fred.cpi.value,       d: fred.cpi.date,       l: "Inflation US", prev: fred.cpi.prev } : null,
    cpiCore:  fred.cpiCore   ? { v: fred.cpiCore.value,   d: fred.cpiCore.date,   l: "Inflation US sous-jacente", prev: fred.cpiCore.prev } : null,
    real10:   fred.real10    ? { v: fred.real10.value,    d: fred.real10.date,    l: "Taux réel US 10 ans" } : null,
    breakeven:fred.breakeven ? { v: fred.breakeven.value, d: fred.breakeven.date, l: "Inflation anticipée 10 ans" } : null,
    slope:    fred.spread102 ? { v: fred.spread102.value, d: fred.spread102.date, l: "Pente 10 ans − 2 ans" } : null,
    unrate:   fred.unrate    ? { v: fred.unrate.value,    d: fred.unrate.date,    l: "Chômage US" } : null,
    hy:       fred.hy        ? { v: fred.hy.value,        d: fred.hy.date,        l: "Spread high yield US" } : null
  },
  fx: raw.sources.change || null,
  crypto: raw.sources.crypto || null
};

/* ─────────── 3. Régime de marché ─────────── */
function regime() {
  const spx = quotes.spx, vix = quotes.vix, us10 = quotes.us10, ndx = quotes.ndx;
  let score = 0; const drivers = [];

  if (spx?.aboveMa200 !== null && spx?.aboveMa200 !== undefined) {
    score += spx.aboveMa200 ? 1 : -1.5;
    drivers.push(`S&P 500 ${spx.aboveMa200 ? "au-dessus" : "sous"} sa moyenne 200 séances`);
  }
  if (spx?.ddFromHigh !== null && spx?.ddFromHigh !== undefined) {
    if (spx.ddFromHigh > -3) { score += 1; drivers.push("indice à moins de 3 % de son plus haut annuel"); }
    else if (spx.ddFromHigh < -15) { score -= 2; drivers.push(`repli de ${Math.abs(spx.ddFromHigh).toFixed(0).replace(".",",")} % depuis le plus haut annuel`); }
    else if (spx.ddFromHigh < -8) { score -= 1; drivers.push(`correction de ${Math.abs(spx.ddFromHigh).toFixed(0).replace(".",",")} % en cours`); }
  }
  if (vix?.last != null) {
    if (vix.last > 28) { score -= 2; drivers.push(`VIX à ${vix.last.toFixed(0).replace(".",",")}, marché en tension`); }
    else if (vix.last > 20) { score -= 1; drivers.push(`VIX à ${vix.last.toFixed(0).replace(".",",")}, nervosité au-dessus de la normale`); }
    else if (vix.last < 14) { score += 0.5; drivers.push(`VIX à ${vix.last.toFixed(0).replace(".",",")}, complaisance`); }
  }
  if (us10?.chg1m != null) {
    if (us10.chg1m > 5)  { score -= 1; drivers.push("taux longs américains en nette hausse sur un mois"); }
    if (us10.chg1m < -5) { score += 0.5; drivers.push("détente des taux longs américains sur un mois"); }
  }
  if (ndx?.ddFromHigh != null && ndx.ddFromHigh < -12) {
    score -= 1; drivers.push(`Nasdaq-100 en repli de ${Math.abs(ndx.ddFromHigh).toFixed(0).replace(".",",")} % depuis son plus haut`);
  }
  const label = score >= 2 ? "Expansion" : score >= 0.5 ? "Progression prudente"
              : score >= -1 ? "Tension" : score >= -3 ? "Correction" : "Stress";
  const color = score >= 2 ? "up" : score >= 0.5 ? "acc" : score >= -1 ? "warn" : "down";
  return { score: round(score, 1), label, color, drivers };
}

/* ─────────── 4. Signaux ─────────── */
function signals() {
  const S = [], q = quotes, m = macro;
  const add = (level, title, text, why, action = null) => S.push({ level, title, text, why, action });

  const dd = q.spx?.ddFromHigh;
  if (dd != null && dd < -10)
    add("alert", `Marché actions américain en repli de ${Math.abs(dd).toFixed(1).replace(".",",")} %`,
      `Le S&P 500 est à ${Math.abs(dd).toFixed(1).replace(".",",")} % sous son plus haut des douze derniers mois.`,
      "Un repli supérieur à 10 % est statistiquement fréquent : il s'en produit environ un par an. Il ne dit rien de la suite.",
      "Continuer les versements sans les augmenter par réflexe. C'est précisément dans ces phases que l'arrêt des versements coûte le plus cher.");
  else if (dd != null && dd > -2)
    add("info", "Marché américain sur ses plus hauts",
      `Le S&P 500 évolue à ${Math.abs(dd).toFixed(1).replace(".",",")} % de son sommet annuel.`,
      "Acheter sur des plus hauts est inconfortable mais historiquement neutre : les indices passent une grande partie du temps près de leurs records.",
      "Ne rien changer. Attendre une baisse pour investir revient à parier sur un calendrier que personne ne connaît.");

  const nd = q.ndx?.ddFromHigh;
  if (nd != null && nd < -12)
    add("caution", `Technologie en correction de ${Math.abs(nd).toFixed(1).replace(".",",")} %`,
      `Le Nasdaq-100 est nettement sous son plus haut annuel${q.spx?.ddFromHigh != null ? `, contre ${Math.abs(q.spx.ddFromHigh).toFixed(1).replace(".",",")} % pour le S&P 500` : ""}.`,
      "La technologie est le poste où la volatilité est la plus forte, et il pèse déjà lourd dans un ETF World.",
      "Si tu détiens une poche Nasdaq dédiée, c'est le moment de vérifier qu'elle reste sous ton plafond — pas de la renforcer par opportunisme.");

  if (m.fed.slope?.v != null) {
    if (m.fed.slope.v < 0)
      add("caution", "Courbe des taux américaine inversée",
        `L'écart 10 ans − 2 ans ressort à ${m.fed.slope.v.toFixed(2).replace(".",",")} point.`,
        "Une courbe inversée a précédé la plupart des récessions américaines, avec un délai très variable — de six mois à deux ans.",
        "Aucune action sur un portefeuille long terme. Le signal est trop lent et trop imprécis pour piloter une allocation.");
    else if (m.fed.slope.v > 1.5)
      add("info", "Courbe des taux nettement repentifiée",
        `L'écart 10 ans − 2 ans atteint ${m.fed.slope.v.toFixed(2).replace(".",",")} point.`,
        "Une repentification traduit soit des anticipations de baisse des taux courts, soit une prime de risque exigée sur les échéances longues.");
  }

  if (m.fed.real10?.v != null && m.fed.real10.v > 2)
    add("caution", `Taux réel américain à ${m.fed.real10.v.toFixed(2).replace(".",",")} %`,
      "Le rendement réel du Treasury 10 ans reste nettement positif.",
      "Quand l'argent sans risque rapporte au-dessus de l'inflation, les actifs dont la valeur repose sur des profits lointains sont mécaniquement moins bien valorisés — la technologie en premier.",
      "Argument de plus pour ne pas payer 0,60 % de frais sur un ETF thématique : chaque point de base pèse davantage dans ce régime.");

  const infl = m.fed.cpi?.v, inflEz = m.bce.hicp?.v;
  if (infl != null && infl > 3)
    add("caution", `Inflation américaine à ${infl.toFixed(1).replace(".",",")} %`,
      `Toujours au-dessus de la cible de 2 %${m.fed.cpiCore?.v != null ? `, sous-jacente à ${m.fed.cpiCore.v.toFixed(1).replace(".",",")} %` : ""}.`,
      "Une inflation qui résiste retarde les baisses de taux et maintient la pression sur les valorisations.",
      "Rien à faire côté allocation. En revanche, une poche monétaire qui rapporte moins que l'inflation te fait perdre du pouvoir d'achat chaque année.");
  if (inflEz != null && inflEz < 2.2 && inflEz > 0)
    add("info", `Inflation zone euro à ${inflEz.toFixed(1).replace(".",",")} %`,
      "Proche de la cible de la BCE.",
      "Une inflation maîtrisée en zone euro donne à la BCE une marge de manœuvre que la Fed n'a pas forcément.");

  if (q.vix?.last != null && q.vix.last > 25)
    add("alert", `VIX à ${q.vix.last.toFixed(0).replace(".",",")}`,
      "La volatilité implicite dépasse nettement sa moyenne de long terme, autour de 19.",
      "Un VIX élevé signale une demande de protection, pas une direction. Il ne prédit ni la hausse ni la baisse.",
      "Ne pas prendre de décision d'allocation en pleine tension. Si une décision doit être prise, l'écrire et la relire le lendemain.");

  const eur = q.eurusd;
  if (eur?.chgYtd != null && Math.abs(eur.chgYtd) > 5)
    add("info", `EUR/USD : ${eur.chgYtd > 0 ? "+" : ""}${eur.chgYtd.toFixed(1).replace(".",",")} % depuis janvier`,
      `Parité à ${eur.last?.toFixed(4).replace(".",",")}.`,
      `Tes ETF World et S&P 500 en PEA ne sont pas couverts contre le risque de change. Un euro ${eur.chgYtd > 0 ? "qui s'apprécie ampute" : "qui se déprécie gonfle"} la performance de la poche américaine convertie en euros.`,
      "Sur un horizon de dix ans et plus, le change est un facteur de diversification, pas un défaut à corriger.");

  if (q.gold?.chgYtd != null && q.gold.chgYtd > 15)
    add("info", `Or en hausse de ${q.gold.chgYtd.toFixed(0).replace(".",",")} % depuis janvier`,
      `L'once cote ${Math.round(q.gold.last)} $.`,
      "Une progression forte de l'or traduit une demande de protection contre l'inflation, la dette publique ou le risque géopolitique.",
      "L'or n'est pas éligible au PEA. Si tu veux cette exposition, elle passe par un compte-titres ou une assurance-vie.");

  if (m.fed.hy?.v != null && m.fed.hy.v > 5)
    add("caution", `Spread high yield américain à ${m.fed.hy.v.toFixed(2).replace(".",",")} points`,
      "L'écart de rendement exigé sur la dette d'entreprise risquée s'élargit.",
      "C'est l'un des rares indicateurs de stress qui anticipe réellement : les marchés de crédit se tendent souvent avant les actions.");

  const OBLI = q.OBLI, depo = m.bce.depo?.v, estr = m.bce.estr?.v;
  const tauxCourt = estr ?? depo;
  if (tauxCourt != null && inflEz != null && tauxCourt - 0.25 < inflEz)
    add("caution", "La poche défensive du PEA perd du pouvoir d'achat",
      `Le seul instrument défensif éligible (Amundi PEA Euro Court Terme) suit le taux €STR, à ${tauxCourt.toFixed(2).replace(".",",")} %. Net de 0,25 % de frais : ${(tauxCourt - 0.25).toFixed(2).replace(".",",")} %. L'inflation zone euro est à ${inflEz.toFixed(1).replace(".",",")} %.`,
      "Le rendement réel de cette poche est négatif. Elle amortit la volatilité mais n'enrichit pas.",
      "Loger le défensif hors PEA — fonds euro, obligataire ou or — et garder le PEA pour les actions. C'est aussi là que l'exonération d'impôt sur le revenu rapporte le plus.");

  /* Où diriger le prochain versement : purement factuel, aucune prédiction. */
  const bricks = ["WPEA", "ETZ", "PAEEM", "RS2K", "PUST"].map(id => q[id]).filter(x => x?.ddFromHigh != null);
  if (bricks.length >= 2) {
    const worst = bricks.reduce((a, b) => (a.ddFromHigh < b.ddFromHigh ? a : b));
    const etf = ETFS.find(e => e.id === worst.id);
    add("info", `Ligne la plus éloignée de son plus haut : ${etf?.name || worst.id}`,
      `${worst.ddFromHigh.toFixed(1).replace(".",",")} % sous son sommet des douze derniers mois.`,
      "Ce n'est pas une recommandation d'achat : une ligne peut baisser longtemps. C'est simplement l'information dont tu as besoin si tu rééquilibres par les versements plutôt que par la vente.",
      "Vérifie d'abord la dérive réelle de ton portefeuille dans l'onglet Rééquilibrage. En dessous de 5 points d'écart, ne rien faire.");
  }

  return S;
}

/* ─────────── 5. Actualités classées ─────────── */
function newsBlock() {
  const n = raw.sources.actualites;
  const av = raw.sources.alphavantage;
  if (!n?.items?.length) return { top: [], byTag: {}, feeds: n?.feeds || [], sentiment: av?.sentimentAvg ?? null };
  const byTag = {};
  for (const it of n.items) for (const t of it.tags) (byTag[t.k] ||= []).push(it);
  for (const k of Object.keys(byTag)) byTag[k] = byTag[k].slice(0, 8);
  const top = n.items.filter(i => i.tags.length).slice(0, 24);
  return {
    top: top.length ? top : n.items.slice(0, 24),
    byTag, feeds: n.feeds,
    counts: Object.fromEntries(Object.entries(byTag).map(([k, v]) => [k, v.length])),
    sentiment: av?.sentimentAvg ?? null,
    sentimentN: av?.n ?? null
  };
}

/* ─────────── 6. Brief du jour ─────────── */
function brief(reg, sig, nw) {
  const q = quotes, p = [];
  const f = (x, d = 1) => (x == null ? "n.c." : (x > 0 ? "+" : "") + x.toFixed(d).replace(".", ",") + " %");

  const eq = [q.cac, q.sxxp, q.spx, q.ndx].filter(Boolean);
  if (eq.length) {
    p.push(`Séance du ${q.spx?.date || today} : ` + eq.map(x => `${x.label} ${f(x.chg1d)}`).join(", ") + ".");
  }
  const ytd = [q.cac, q.sx5e, q.spx, q.ndx, q.n225].filter(x => x?.chgYtd != null);
  if (ytd.length) {
    const best = ytd.reduce((a, b) => (a.chgYtd > b.chgYtd ? a : b));
    const worst = ytd.reduce((a, b) => (a.chgYtd < b.chgYtd ? a : b));
    p.push(`Depuis le 1ᵉʳ janvier, ${best.label} mène avec ${f(best.chgYtd)} et ${worst.label} ferme la marche à ${f(worst.chgYtd)}.`);
  }
  const rt = [];
  if (q.us10?.last != null) rt.push(`Treasury 10 ans à ${q.us10.last.toFixed(2).replace(".", ",")} %`);
  if (macro.fed.upper?.v != null) rt.push(`Fed funds jusqu'à ${macro.fed.upper.v.toFixed(2).replace(".", ",")} %`);
  if (macro.bce.depo?.v != null) rt.push(`taux de dépôt BCE à ${macro.bce.depo.v.toFixed(2).replace(".", ",")} %`);
  if (rt.length) p.push("Côté taux : " + rt.join(", ") + ".");

  const inf = [];
  if (macro.fed.cpi?.v != null) inf.push(`${macro.fed.cpi.v.toFixed(1).replace(".", ",")} % aux États-Unis`);
  if (macro.bce.hicp?.v != null) inf.push(`${macro.bce.hicp.v.toFixed(1).replace(".", ",")} % en zone euro`);
  if (inf.length) p.push(`Inflation : ${inf.join(", ")}.`);

  const alerts = sig.filter(s => s.level === "alert").length;
  const cautions = sig.filter(s => s.level === "caution").length;
  const verdict = alerts
    ? `${alerts} point${alerts > 1 ? "s" : ""} de vigilance et ${cautions} à surveiller. Aucun n'appelle un arbitrage : ce sont des éléments de contexte, pas des ordres.`
    : cautions
    ? `${cautions} point${cautions > 1 ? "s" : ""} à surveiller, rien d'alarmant. Le portefeuille n'a pas besoin d'être touché.`
    : "Rien d'inhabituel dans les données du jour. Le portefeuille n'a besoin d'aucune intervention.";

  return {
    date: today,
    regime: reg.label,
    headline: `${reg.label} — ${alerts ? "vigilance" : "aucune action requise"}`,
    paragraphs: p,
    verdict,
    action: alerts || cautions ? "Lire les signaux, ne rien exécuter avant d'avoir vérifié la dérive réelle du portefeuille."
                               : "Aucune action. Laisser le versement automatique faire son travail.",
    newsCount: nw.top.length
  };
}

/* ─────────── 7. Assemblage ─────────── */
const reg = regime();
const sig = signals();
const nw  = newsBlock();

const out = {
  generatedAt: new Date().toISOString(),
  asOf: today,
  quality: raw.quality,
  demo: raw.demo === true,
  health: raw.health,
  carriedOver: carried,
  regime: reg,
  quotes,
  macro,
  signals: sig,
  brief: brief(reg, sig, nw),
  news: nw,
  calendar: raw.sources.fmp?.events || [],
  etfs: ETFS.map(e => ({ ...e, quote: quotes[e.id] || null })),
  indices: INDICES.map(i => i.id)
};

await mkdir("docs/data/history", { recursive: true });
await writeFile("docs/data/latest.json", JSON.stringify(out));
await writeFile(`docs/data/history/${today}.json`, JSON.stringify({
  date: today, quality: out.quality, regime: reg.label,
  quotes: Object.fromEntries(Object.entries(quotes).map(([k, v]) => [k, { last: v.last, chg1d: v.chg1d, chgYtd: v.chgYtd }])),
  macro, signalCount: sig.length
}));

console.log(`Analyse terminée — régime « ${reg.label} », ${sig.length} signaux, ${nw.top.length} actualités, qualité ${out.quality} %`);
if (carried) console.log(`${carried} instrument(s) repris de la veille faute de cotation fraîche.`);
console.log("→ docs/data/latest.json");
console.log(`→ docs/data/history/${today}.json`);
