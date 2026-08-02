import { get } from "../lib/http.mjs";

export default async function crypto() {
  const j = await get("https://api.coingecko.com/api/v3/simple/price" +
    "?ids=bitcoin,ethereum&vs_currencies=eur,usd&include_24hr_change=true", { retries: 1 });
  if (!j?.bitcoin) throw new Error("réponse inattendue");
  return j;
}
