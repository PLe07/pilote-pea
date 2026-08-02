/* Univers suivi. `y` = symbole Yahoo Finance, `sq` = symbole Stooq (secours). */

export const INDICES = [
  { id:"cac",    label:"CAC 40",            y:"^FCHI",     sq:"^cac",  zone:"eu" },
  { id:"sx5e",   label:"EuroStoxx 50",      y:"^STOXX50E", sq:null,    zone:"eu" },
  { id:"sxxp",   label:"STOXX Europe 600",  y:"^STOXX",    sq:null,    zone:"eu" },
  { id:"dax",    label:"DAX",               y:"^GDAXI",    sq:"^dax",  zone:"eu" },
  { id:"spx",    label:"S&P 500",           y:"^GSPC",     sq:"^spx",  zone:"us" },
  { id:"ndx",    label:"Nasdaq-100",        y:"^NDX",      sq:"^ndx",  zone:"us" },
  { id:"comp",   label:"Nasdaq Composite",  y:"^IXIC",     sq:null,    zone:"us" },
  { id:"rut",    label:"Russell 2000",      y:"^RUT",      sq:null,    zone:"us" },
  { id:"n225",   label:"Nikkei 225",        y:"^N225",     sq:"^nkx",  zone:"jp" },
  { id:"shcomp", label:"Shanghai Composite",y:"000001.SS", sq:null,    zone:"cn" },
  { id:"vix",    label:"VIX",               y:"^VIX",      sq:"^vix",  zone:"us", kind:"vol" }
];

export const RATES = [
  { id:"us10", label:"Treasury US 10 ans", y:"^TNX", scale:1, unit:"%" },
  { id:"us30", label:"Treasury US 30 ans", y:"^TYX", scale:1, unit:"%" },
  { id:"us02", label:"Treasury US 2 ans",  y:"^IRX", scale:1, unit:"%" }
];

export const FX_COMMO = [
  { id:"eurusd", label:"EUR/USD",       y:"EURUSD=X", unit:"" },
  { id:"gold",   label:"Or (once, $)",  y:"GC=F",     unit:"$" },
  { id:"brent",  label:"Brent ($)",     y:"BZ=F",     unit:"$" },
  { id:"btc",    label:"Bitcoin ($)",   y:"BTC-USD",  unit:"$" }
];

/* ETF du portefeuille — Yahoo suffixe .PA pour Euronext Paris.
   `pea:true` = éligible PEA à vérifier sur le DIC avant tout ordre. */
export const ETFS = [
  { id:"WPEA",  y:"WPEA.PA",  isin:"IE0002XZSHO1", name:"iShares MSCI World Swap PEA",        ter:0.20, brick:"world", pea:true },
  { id:"DCAM",  y:"DCAM.PA",  isin:"FR001400U5Q4", name:"Amundi PEA Monde (MSCI World)",      ter:0.20, brick:"world", pea:true },
  { id:"CW8",   y:"CW8.PA",   isin:"LU1681043599", name:"Amundi MSCI World Swap",             ter:0.38, brick:"world", pea:true },
  { id:"GPEA",  y:"GPEA.PA",  isin:"FR0014017NX3", name:"Amundi PEA Global (MSCI ACWI)",      ter:0.30, brick:"world", pea:true },
  { id:"ETZ",   y:"ETZ.PA",   isin:"FR0011550193", name:"BNP Easy STOXX Europe 600",          ter:0.19, brick:"eu",    pea:true },
  { id:"EUAM",  y:"CE9.PA",   isin:"FR0013412038", name:"Amundi PEA MSCI Europe",             ter:0.15, brick:"eu",    pea:true },
  { id:"PAEEM", y:"PAEEM.PA", isin:"FR0013412020", name:"Amundi PEA Emergent ESG",            ter:0.30, brick:"em",    pea:true },
  { id:"PAASI", y:"PAASI.PA", isin:"FR0013412012", name:"Amundi PEA Asie Emergente",          ter:0.30, brick:"em",    pea:true },
  { id:"PUST",  y:"PUST.PA",  isin:"FR0011871110", name:"Amundi PEA Nasdaq-100",              ter:0.30, brick:"nq",    pea:true },
  { id:"RS2K",  y:"RS2K.PA",  isin:"LU1681038672", name:"Amundi Russell 2000",                ter:0.35, brick:"sm",    pea:true },
  { id:"PSP5",  y:"PSP5.PA",  isin:"FR0011871128", name:"Amundi PEA S&P 500",                 ter:0.12, brick:"us",    pea:true },
  { id:"ESE",   y:"ESE.PA",   isin:"FR0011550185", name:"BNP Easy S&P 500",                   ter:0.14, brick:"us",    pea:true },
  { id:"OBLI",  y:"OBLI.PA",  isin:"FR0013346681", name:"Amundi PEA Euro Court Terme (€STR)", ter:0.25, brick:"def",   pea:true }
];

export const ALL_YAHOO = [
  ...INDICES.map(x => ({ ...x, group:"index" })),
  ...RATES.map(x => ({ ...x, group:"rate" })),
  ...FX_COMMO.map(x => ({ ...x, group:"fx" })),
  ...ETFS.map(x => ({ ...x, label:x.name, group:"etf" }))
];
