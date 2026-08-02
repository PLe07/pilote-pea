import { get } from "../lib/http.mjs";

export default async function alphavantage() {
  const key = process.env.ALPHAVANTAGE_API_KEY;
  if (!key) throw new Error("ALPHAVANTAGE_API_KEY absente — source ignorée");
  const j = await get("https://www.alphavantage.co/query?function=NEWS_SENTIMENT" +
    `&topics=financial_markets,economy_macro,economy_monetary,technology&limit=50&apikey=${key}`,
    { retries: 1, timeout: 25000 });
  if (j?.Note || j?.Information) throw new Error(String(j.Note || j.Information).slice(0, 120));
  const feed = j?.feed;
  if (!Array.isArray(feed) || !feed.length) throw new Error("flux vide");
  const items = feed.slice(0, 40).map(a => ({
    title: a.title, link: a.url, source: a.source || "Alpha Vantage",
    date: a.time_published ? a.time_published.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/, "$1-$2-$3T$4:$5:$6Z") : null,
    sentiment: parseFloat(a.overall_sentiment_score) || 0,
    label: a.overall_sentiment_label || null,
    topics: (a.topics || []).map(t => t.topic)
  }));
  const avg = items.reduce((s, i) => s + i.sentiment, 0) / items.length;
  return { items, sentimentAvg: +avg.toFixed(4), n: items.length };
}
