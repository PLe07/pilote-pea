/* Client HTTP unique : délai maximal, réessais, en-têtes navigateur.
   Aucune source ne doit pouvoir faire tomber la collecte. */

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
           "(KHTML, like Gecko) Chrome/126.0 Safari/537.36";

const ENV_RETRIES = Number(process.env.HTTP_RETRIES);
const ENV_TIMEOUT = Number(process.env.HTTP_TIMEOUT);

export async function get(url, { timeout, retries, json = true, headers = {} } = {}) {
  timeout = Number.isFinite(ENV_TIMEOUT) ? ENV_TIMEOUT : (timeout ?? 20000);
  retries = Number.isFinite(ENV_RETRIES) ? ENV_RETRIES : (retries ?? 2);
  let last;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeout);
    try {
      const res = await fetch(url, {
        signal: ac.signal,
        headers: { "User-Agent": UA, "Accept": json ? "application/json,text/plain,*/*" : "*/*", ...headers }
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = json ? await res.json() : await res.text();
      return body;
    } catch (e) {
      clearTimeout(timer);
      last = e;
      if (attempt < retries) await sleep(700 * (attempt + 1));
    }
  }
  throw last;
}

export const getText = (url, opts = {}) => get(url, { ...opts, json: false });
export const sleep = ms => new Promise(r => setTimeout(r, Number(process.env.HTTP_PACE) === 0 ? 0 : ms));

/* Enveloppe chaque source : ne lève jamais, renvoie un rapport de santé. */
export async function runSource(name, fn) {
  const t0 = Date.now();
  try {
    const data = await fn();
    const n = countPoints(data);
    return { name, ok: true, ms: Date.now() - t0, points: n, data };
  } catch (e) {
    console.error(`  ✗ ${name} : ${e.message}`);
    return { name, ok: false, ms: Date.now() - t0, points: 0, error: String(e.message || e), data: null };
  }
}

function countPoints(d) {
  if (!d) return 0;
  if (Array.isArray(d)) return d.length;
  if (typeof d === "object") return Object.keys(d).length;
  return 1;
}

export const num = v => (typeof v === "number" && isFinite(v) ? v : null);
export const pct = (a, b) => (num(a) !== null && num(b) !== null && b !== 0 ? (a / b - 1) * 100 : null);
