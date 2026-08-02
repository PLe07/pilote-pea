import { get } from "../lib/http.mjs";

const HOSTS = ["https://api.frankfurter.dev/v1", "https://api.frankfurter.app"];

export default async function fx() {
  let last;
  for (const h of HOSTS) {
    try {
      const cur = await get(`${h}/latest?base=EUR&symbols=USD,GBP,CHF,JPY,CNY`, { retries: 1 })
        .catch(() => get(`${h}/latest?from=EUR&to=USD,GBP,CHF,JPY,CNY`, { retries: 1 }));
      const start = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
      const ytd = await get(`${h}/${start}..?base=EUR&symbols=USD`, { retries: 1 }).catch(() => null);
      const firstOfYear = ytd?.rates ? Object.values(ytd.rates)[0]?.USD ?? null : null;
      return { date: cur.date, base: "EUR", rates: cur.rates, usdStartOfYear: firstOfYear };
    } catch (e) { last = e; }
  }
  throw last;
}
