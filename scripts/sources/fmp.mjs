import { get } from "../lib/http.mjs";

const d = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

export default async function fmp() {
  const key = process.env.FMP_API_KEY;
  if (!key) throw new Error("FMP_API_KEY absente — source ignorée");
  const urls = [
    `https://financialmodelingprep.com/stable/economic-calendar?from=${d(0)}&to=${d(21)}&apikey=${key}`,
    `https://financialmodelingprep.com/api/v3/economic_calendar?from=${d(0)}&to=${d(21)}&apikey=${key}`
  ];
  let arr, last;
  for (const u of urls) {
    try { const j = await get(u, { retries: 1, timeout: 20000 });
          if (Array.isArray(j) && j.length) { arr = j; break; }
          if (j?.["Error Message"]) throw new Error(j["Error Message"]); }
    catch (e) { last = e; }
  }
  if (!arr) throw new Error(last?.message || "calendrier vide");
  const keep = /^(US|EU|FR|DE|GB|CN|JP)$/i;
  const events = arr
    .filter(e => (e.impact || "").toLowerCase() === "high" && keep.test(e.country || ""))
    .slice(0, 40)
    .map(e => ({ date: e.date, country: e.country, event: e.event,
                 previous: e.previous ?? null, estimate: e.estimate ?? null, actual: e.actual ?? null }));
  return { events, n: events.length };
}
