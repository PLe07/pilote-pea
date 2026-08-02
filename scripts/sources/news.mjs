import { getText, sleep } from "../lib/http.mjs";

/* Agrégateur RSS/Atom sans dépendance. Chaque flux est indépendant :
   si l'un tombe, les autres passent. */

const FEEDS = [
  // Banques centrales et institutions — la source primaire, jamais un commentaire
  { u:"https://www.ecb.europa.eu/rss/press.html",                    s:"BCE",            w:3, lang:"en" },
  { u:"https://www.federalreserve.gov/feeds/press_monetary.xml",     s:"Fed — politique monétaire", w:3, lang:"en" },
  { u:"https://www.federalreserve.gov/feeds/press_all.xml",          s:"Fed",            w:2, lang:"en" },
  { u:"https://www.insee.fr/fr/statistiques/rss",                    s:"Insee",          w:2, lang:"fr" },
  // Presse financière
  { u:"https://feeds.content.dowjones.io/public/rss/mw_topstories",  s:"MarketWatch",    w:1, lang:"en" },
  { u:"https://www.cnbc.com/id/100003114/device/rss/rss.html",       s:"CNBC",           w:1, lang:"en" },
  { u:"https://www.cnbc.com/id/10000664/device/rss/rss.html",        s:"CNBC — économie",w:2, lang:"en" },
  { u:"https://finance.yahoo.com/news/rssindex",                     s:"Yahoo Finance",  w:1, lang:"en" },
  { u:"https://www.investing.com/rss/news_25.rss",                   s:"Investing — indicateurs", w:2, lang:"en" },
  { u:"https://www.investing.com/rss/market_overview.rss",           s:"Investing — marchés", w:1, lang:"en" },
  { u:"https://services.lesechos.fr/rss/les-echos-finance-marches.xml", s:"Les Échos",   w:2, lang:"fr" },
  { u:"https://www.latribune.fr/rss/rubriques/bourse.html",          s:"La Tribune",     w:1, lang:"fr" },
  { u:"https://www.boursorama.com/rss/actualites",                   s:"Boursorama",     w:1, lang:"fr" },
  // Recherches ciblées Google News : filet large sur les sujets qui bougent l'allocation
  { u:"https://news.google.com/rss/search?q=BCE+taux+directeurs&hl=fr&gl=FR&ceid=FR:fr",         s:"Google News — BCE",      w:2, lang:"fr" },
  { u:"https://news.google.com/rss/search?q=Fed+inflation+taux&hl=fr&gl=FR&ceid=FR:fr",          s:"Google News — Fed",      w:2, lang:"fr" },
  { u:"https://news.google.com/rss/search?q=march%C3%A9s+actions+Europe+bourse&hl=fr&gl=FR&ceid=FR:fr", s:"Google News — marchés", w:1, lang:"fr" },
  { u:"https://news.google.com/rss/search?q=ETF+PEA+%C3%A9pargne&hl=fr&gl=FR&ceid=FR:fr",        s:"Google News — PEA/ETF",  w:2, lang:"fr" },
  { u:"https://news.google.com/rss/search?q=semi-conducteurs+intelligence+artificielle+capex&hl=fr&gl=FR&ceid=FR:fr", s:"Google News — IA", w:1, lang:"fr" }
];

/* Étiquetage : relie un titre aux briques du portefeuille. */
const TAGS = [
  { k:"def",   re:/\b(bce|ecb|fed|fomc|taux directeur|rate (hike|cut|decision)|inflation|cpi|ipch|obligation|bond|yield|oat|bund|treasury|powell|warsh|lagarde)\b/i, lbl:"Taux & inflation" },
  { k:"nq",    re:/\b(nvidia|semi-?conduct|nasdaq|intelligence artificielle|\bIA\b|\bAI\b|openai|hyperscaler|capex|data ?cent|cloud|microsoft|alphabet|google|meta|apple|amazon|tesla|broadcom|tsmc)\b/i, lbl:"Technologie & IA" },
  { k:"eu",    re:/\b(cac ?40|stoxx|euro ?stoxx|dax|bourse de paris|zone euro|union europ|allemagne|france|italie|espagne|ftse)\b/i, lbl:"Europe" },
  { k:"em",    re:/\b(chine|china|inde|india|brésil|brazil|émergent|emerging|taïwan|taiwan|corée|korea|asie)\b/i, lbl:"Émergents" },
  { k:"us",    role:1, re:/\b(wall street|s&p ?500|dow jones|états-unis|united states|us economy|trump|tarif|tariff)\b/i, lbl:"États-Unis" },
  { k:"commo", re:/\b(pétrole|oil|brent|wti|opep|opec|or\b|gold|énergie|gaz|matière première|commodit)\b/i, lbl:"Énergie & matières" },
  { k:"risk",  re:/\b(krach|crash|correction|récession|recession|krach|panique|selloff|plonge|chute|effondr|guerre|conflit|défaut|crise)\b/i, lbl:"Risque" }
];

function decode(s = "") {
  return s.replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(#\d+|#x[0-9a-f]+|\w+);/gi, (m, e) => {
      if (e[0] === "#") return String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : +e.slice(1));
      return { amp:"&", lt:"<", gt:">", quot:'"', apos:"'", nbsp:" ", eacute:"é", egrave:"è", agrave:"à", ccedil:"ç" }[e.toLowerCase()] ?? m;
    })
    .replace(/\s+/g, " ").trim();
}

const pick = (block, ...tags) => {
  for (const t of tags) {
    const m = block.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`, "i"));
    if (m) return decode(m[1]);
    const self = block.match(new RegExp(`<${t}[^>]*href=["']([^"']+)["']`, "i"));
    if (self) return decode(self[1]);
  }
  return "";
};

function parseFeed(xml, feed) {
  const blocks = xml.match(/<(item|entry)\b[\s\S]*?<\/\1>/gi) || [];
  return blocks.slice(0, 15).map(b => {
    const title = pick(b, "title");
    const link  = pick(b, "link", "id");
    const date  = pick(b, "pubDate", "published", "updated", "dc:date");
    const desc  = pick(b, "description", "summary", "content");
    if (!title) return null;
    const hay = title + " " + desc;
    const tags = TAGS.filter(t => t.re.test(hay)).map(t => ({ k:t.k, lbl:t.lbl }));
    const ts = Date.parse(date);
    return {
      title, link, source: feed.s, weight: feed.w, lang: feed.lang,
      date: isFinite(ts) ? new Date(ts).toISOString() : null,
      summary: desc.slice(0, 320) || null,
      tags
    };
  }).filter(Boolean);
}

const norm = s => s.toLowerCase().replace(/[^a-z0-9àâäéèêëîïôöùûüç ]/g, "").split(/\s+/).filter(w => w.length > 3).slice(0, 8).join(" ");

export default async function news() {
  const all = [];
  const health = [];
  for (const f of FEEDS) {
    try {
      const xml = await getText(f.u, { retries: 1, timeout: 15000 });
      const items = parseFeed(xml, f);
      all.push(...items);
      health.push({ source: f.s, ok: true, items: items.length });
    } catch (e) {
      health.push({ source: f.s, ok: false, error: e.message });
      console.error(`    · flux ${f.s} indisponible : ${e.message}`);
    }
    await sleep(120);
  }
  if (!all.length) throw new Error("aucun flux exploitable");

  // déduplication sur l'empreinte des mots significatifs du titre
  const seen = new Map();
  for (const it of all) {
    const k = norm(it.title);
    if (!k) continue;
    const prev = seen.get(k);
    if (!prev || it.weight > prev.weight) seen.set(k, it);
  }
  const items = [...seen.values()]
    .sort((a, b) => (b.weight - a.weight) || (Date.parse(b.date || 0) - Date.parse(a.date || 0)))
    .slice(0, 120);

  return { items, feeds: health, fetched: items.length, deduped: all.length - items.length };
}
