/* Pilote PEA — front-end. Lit docs/data/latest.json produit chaque matin
   par GitHub Actions. Aucune donnée personnelle ne quitte l'appareil. */
"use strict";

/* ═════════ 1. DOCTRINE (statique, versionnée avec le code) ═════════ */

const U = {
 WPEA:{n:"iShares MSCI World Swap PEA UCITS ETF EUR Acc",t:"WPEA",i:"IE0002XZSHO1",ter:.20,aum:1900,rep:"Synthétique (swap)",em:"BlackRock",
   idx:"MSCI World — 23 pays développés",us:73.9,top10:28,
   why:"Meilleur rapport frais / encours du segment World éligible PEA : 0,20 % pour environ 1,9 Md€ d'actifs, ce qui garantit une fourchette achat-vente serrée et la pérennité du fonds."},
 DCAM:{n:"Amundi PEA Monde (MSCI World) UCITS ETF",t:"DCAM",i:"FR001400U5Q4",ter:.20,aum:1110,rep:"Synthétique (swap)",em:"Amundi",
   idx:"MSCI World — 23 pays développés",us:73.9,top10:28,
   why:"Frais identiques au WPEA, encours plus faible mais suffisant. Sert de second émetteur pour ne pas concentrer tout le cœur sur une seule contrepartie de swap."},
 CW8:{n:"Amundi MSCI World Swap UCITS ETF EUR Acc",t:"CW8",i:"LU1681043599",ter:.38,aum:6253,rep:"Synthétique (swap)",em:"Amundi",
   idx:"MSCI World — 23 pays développés",us:73.9,top10:28,
   why:"La référence historique et la plus grosse du segment. Mais 0,38 % contre 0,20 % : 18 points de base par an offerts sans contrepartie."},
 GPEA:{n:"Amundi PEA Global (MSCI ACWI) UCITS ETF",t:"GPEA",i:"FR0014017NX3",ter:.30,aum:null,rep:"Synthétique (swap)",em:"Amundi",
   idx:"MSCI ACWI — développés + émergents",us:66,top10:25,
   why:"Coté le 15 juillet 2026, premier ETF PEA couvrant développés et émergents en une ligne. Séduisant pour simplifier, mais aucun historique, encours en constitution, et 0,30 % contre 0,22 % pour un couple World + émergents monté à la main."},
 PSP5:{n:"Amundi PEA S&P 500 UCITS ETF Acc",t:"PSP5",i:"FR0011871128",ter:.12,aum:1105,rep:"Synthétique (swap)",em:"Amundi",
   idx:"S&P 500 — 500 grandes capitalisations US",us:100,top10:36,
   why:"Les frais les plus bas du PEA, mais 100 % États-Unis. À n'utiliser qu'en surcouche assumée d'un cœur World, jamais comme cœur unique."},
 ESE:{n:"BNP Paribas Easy S&P 500 UCITS ETF EUR",t:"ESE",i:"FR0011550185",ter:.14,aum:3236,rep:"Synthétique (swap)",em:"BNP Paribas",
   idx:"S&P 500 — 500 grandes capitalisations US",us:100,top10:36,
   why:"2 points de base de plus que PSP5, mais trois fois l'encours et un troisième émetteur. Le surcoût achète de la liquidité et de la diversification de contrepartie."},
 PUST:{n:"Amundi PEA Nasdaq-100 UCITS ETF Acc",t:"PUST",i:"FR0011871110",ter:.30,aum:1112,rep:"Synthétique (swap)",em:"Amundi",
   idx:"Nasdaq-100 — 100 valeurs hors financières",us:96,top10:50,
   why:"Poche de conviction technologique. Environ la moitié de l'indice tient dans dix lignes : pari concentré, à dimensionner comme tel."},
 ETZ:{n:"BNP Paribas Easy STOXX Europe 600 UCITS ETF",t:"ETZ",i:"FR0011550193",ter:.19,aum:1107,rep:"Synthétique (swap)",em:"BNP Paribas",
   idx:"STOXX Europe 600 — 600 valeurs, 17 pays",us:0,top10:20,
   why:"La couverture européenne la plus large : Royaume-Uni et Suisse inclus, donc Nestlé, Novo Nordisk, ASML, Shell, AstraZeneca. C'est ce qui manque à un MSCI EMU limité à la zone euro."},
 EUAM:{n:"Amundi ETF PEA MSCI Europe UCITS ETF",t:"—",i:"FR0013412038",ter:.15,aum:334,rep:"Synthétique (swap)",em:"Amundi",
   idx:"MSCI Europe — 15 pays développés",us:0,top10:22,
   why:"4 points de base moins cher que le STOXX 600, mais un encours trois fois plus faible. Valable si la chasse aux frais prime."},
 EMU:{n:"iShares Core MSCI EMU UCITS ETF",t:"—",i:"IE00B53QG562",ter:.12,aum:6267,rep:"Physique",em:"BlackRock",
   idx:"MSCI EMU — zone euro uniquement",us:0,top10:24,
   why:"Le seul du lot en réplication physique, donc sans risque de contrepartie, et le moins cher. Contrepartie : ni Royaume-Uni, ni Suisse, ni pays nordiques hors zone euro."},
 PAEEM:{n:"Amundi PEA Emergent (MSCI EM) ESG Transition UCITS ETF Acc",t:"PAEEM",i:"FR0013412020",ter:.30,aum:860,rep:"Synthétique (swap)",em:"Amundi",
   idx:"MSCI Emerging Markets ESG",us:0,top10:25,
   why:"La seule exposition émergente large réellement disponible en PEA, avec un encours qui tient. Le filtre ESG écarte une partie de l'univers : contrainte subie, pas choisie."},
 PAASI:{n:"Amundi PEA Asie Emergente UCITS ETF Acc",t:"PAASI",i:"FR0013412012",ter:.30,aum:815,rep:"Synthétique (swap)",em:"Amundi",
   idx:"MSCI Emerging Asia ESG",us:0,top10:30,
   why:"Même coût, périmètre plus étroit : Taïwan, Corée, Inde, Chine ; ni Brésil, ni Afrique du Sud. Plus tranchant, moins diversifié."},
 RS2K:{n:"Amundi Russell 2000 UCITS ETF EUR (C)",t:"—",i:"LU1681038672",ter:.35,aum:771,rep:"Synthétique (swap)",em:"Amundi",
   idx:"Russell 2000 — petites capitalisations US",us:100,top10:4,
   why:"Le complément d'un World saturé de méga-capitalisations : 2 000 lignes dont aucune ne pèse plus de quelques dixièmes de pourcent. Plus volatil et plus sensible aux taux."},
 OBLI:{n:"Amundi PEA Euro Court Terme UCITS ETF Acc",t:"OBLI",i:"FR0013346681",ter:.25,aum:192,rep:"Synthétique (swap)",em:"Amundi",
   idx:"Solactive €STR Overnight — monétaire",us:0,top10:0,
   why:"Le seul instrument défensif du PEA. Depuis octobre 2024 il suit le taux €STR au jour le jour : c'est de la trésorerie, pas de l'obligataire."}
};

const BRICKS=[
 {id:"world",lbl:"Cœur mondial",etf:"WPEA",alt:["DCAM","CW8","GPEA"],col:"#4f9cf9",cls:"p-core",r:6.5,v:15,
  role:"Le socle. Il porte la performance et absorbe l'essentiel des versements."},
 {id:"eu",lbl:"Europe",etf:"ETZ",alt:["EUAM","EMU"],col:"#7c5cff",cls:"p-core",r:6.0,v:16,
  role:"Contrepoids au biais américain du World, et exposition à ta zone monétaire sans risque de change."},
 {id:"em",lbl:"Émergents",etf:"PAEEM",alt:["PAASI"],col:"#e08b4f",cls:"p-core",r:7.0,v:20,
  role:"La moitié de la population et du PIB mondiaux, presque absente d'un MSCI World."},
 {id:"sm",lbl:"Small caps US",etf:"RS2K",alt:[],col:"#3fb6a8",cls:"p-sat",r:7.0,v:21,
  role:"Ce que les méga-capitalisations écrasent dans les indices pondérés par la capitalisation."},
 {id:"nq",lbl:"Nasdaq-100",etf:"PUST",alt:[],col:"#c94f9c",cls:"p-sat",r:7.5,v:22,
  role:"Poche de conviction technologique, assumée comme un pari concentré."},
 {id:"def",lbl:"Poche défensive",etf:"OBLI",alt:[],col:"#2ecc8f",cls:"p-def",r:2.0,v:.6,
  role:"Amortisseur et réserve de munitions pour racheter après une baisse."}
];

const CRIT=[
 ["1. Éligibilité PEA confirmée","Sans ça, rien d'autre ne compte. Se vérifie sur le DIC et dans le moteur de recherche du courtier, pas sur un forum."],
 ["2. Encours supérieur à 300 M€","En dessous, le risque de fermeture ou de fusion augmente et la fourchette achat-vente s'élargit. Une fermeture force une vente au pire moment."],
 ["3. Frais de gestion","Le seul paramètre certain de l'équation. 0,18 point d'écart annuel sur 20 ans à 400 €/mois pèse plusieurs milliers d'euros. Tout le reste est une hypothèse."],
 ["4. Écart de suivi réel","Le TER ne dit pas tout : un ETF synthétique bien construit peut battre son indice net de frais grâce au traitement fiscal des dividendes américains. À comparer sur 3 et 5 ans."],
 ["5. Diversité des émetteurs","Ne pas confier tout le cœur à une seule société de gestion ni à une seule contrepartie de swap."]
];

const DUELS=[
 {ti:"Cœur mondial",w:"WPEA",l:["CW8","DCAM","GPEA"],
  k:"À indice identique on paye le moins cher chez l'émetteur le plus solide. CW8 coûte 0,38 % contre 0,20 % : sur 20 ans à 400 €/mois, plus de 4 000 € de capital final abandonnés pour exactement la même exposition. DCAM fait aussi bien avec un encours plus faible — il devient le second émetteur, pas le premier. GPEA ajoute les émergents mais coûte 0,30 % et n'a aucun historique."},
 {ti:"Europe",w:"ETZ",l:["EUAM","EMU"],
  k:"Le STOXX Europe 600 couvre 600 valeurs sur 17 pays, Royaume-Uni et Suisse compris — donc Nestlé, Novo Nordisk, AstraZeneca, Shell, absents d'un MSCI EMU. Il apporte aussi un troisième émetteur. L'iShares Core MSCI EMU est le seul argument sérieux contre : 0,12 %, 6,3 Md€ et surtout une réplication physique, donc zéro risque de contrepartie — mais il s'arrête à la zone euro. Si le risque de swap te gêne plus que le périmètre, prends EMU."},
 {ti:"Émergents",w:"PAEEM",l:["PAASI"],
  k:"Même coût, même émetteur, périmètre différent. PAEEM couvre l'ensemble des émergents ; PAASI se concentre sur l'Asie et ajoute de la performance potentielle en retirant de la diversification. Sur une poche déjà minoritaire, la version large est le choix par défaut."},
 {ti:"États-Unis en surcouche",w:"ESE",l:["PSP5"],
  k:"PSP5 est 2 points de base moins cher, ESE a trois fois l'encours et vient d'un troisième émetteur. Sur une ligne de surcouche, la diversification de contrepartie vaut plus que 0,02 % par an."}
];

const LIMITS=[
 ["Obligations d'État ou d'entreprise","Impossible en direct","Un seul ETF subsiste, devenu monétaire €STR en octobre 2024. Pour du vrai obligataire : assurance-vie, compte-titres ou fonds euro."],
 ["Or et matières premières","Impossible","Aucun ETC or n'est éligible. Passer par un compte-titres ou une unité de compte en assurance-vie."],
 ["Actions américaines en direct","Impossible","Uniquement via ETF synthétique."],
 ["Immobilier coté (SIIC / REIT)","Exclu depuis 2011","Les foncières cotées ne sont plus éligibles. SCPI en assurance-vie ou compte-titres."],
 ["Couverture de change","Quasi inexistante","Les ETF PEA World et S&P 500 ne sont pas couverts : tu portes le risque dollar. Sur dix ans et plus, c'est un facteur de diversification davantage qu'un défaut."]
];

const RULES=[
 ["Automatiser le versement","Un virement programmé le même jour chaque mois. La régularité fait plus pour le résultat final que le choix du jour d'achat."],
 ["Un seul rendez-vous par an","Vérifier la dérive une fois par an à date fixe. Regarder son portefeuille chaque semaine augmente le risque de vendre au mauvais moment, jamais le rendement."],
 ["Rééquilibrer par les versements","Diriger l'argent frais vers la ligne en retard plutôt que de vendre celle en avance. Zéro frais de courtage."],
 ["Seuil de dérive à 5 points","En dessous, on ne touche à rien. Un rééquilibrage trop fin coûte plus qu'il ne rapporte."],
 ["Aucun retrait avant 5 ans","Un retrait avant le cinquième anniversaire ferme le plan et déclenche l'imposition. Garder l'épargne de précaution ailleurs — au moins six mois de dépenses."],
 ["Plafonner les paris","Toutes poches de conviction confondues, ne pas dépasser 25 %. Une conviction fausse doit rester survivable."],
 ["Écrire avant d'agir","Avant tout arbitrage, écrire la raison en une phrase et la relire le lendemain. La plupart des mauvaises décisions ne survivent pas à une nuit."],
 ["Ne jamais interrompre les versements en baisse","Les versements faits pendant les krachs sont ceux qui rapportent le plus. C'est aussi le moment où l'on a le plus envie d'arrêter."],
 ["Lire les signaux, pas les exécuter","Cette app décrit ce qui a changé. Elle ne sait pas ce que fera le marché demain, et personne ne le sait."]
];

const PEAF=[
 ["Plafond de versement","150 000 €","225 000 € en cumulant avec un PEA-PME."],
 ["Prélèvements sociaux","18,6 %","Depuis le 01/01/2026 : la CSG est passée de 9,2 % à 10,6 % (LFSS 2026, loi 2025-1403). S'applique aussi aux gains accumulés avant 2026."],
 ["Impôt sur le revenu après 5 ans","0 %","Exonération totale sur les plus-values et revenus ; seuls les prélèvements sociaux restent dus."],
 ["Retrait avant 5 ans","31,4 %","12,8 % d'IR + 18,6 % de prélèvements sociaux, et clôture du plan."],
 ["Gain net pour 100 € de plus-value","81,40 €","Après 5 ans, contre 68,60 € sur un compte-titres : 12,80 € d'écart pour 100 € gagnés."],
 ["Retraits après 5 ans","Libres","Le plan reste ouvert et les versements restent possibles."],
 ["Dividendes et arbitrages internes","Non imposés","Aucune imposition tant que l'argent reste dans l'enveloppe : c'est là que se joue l'essentiel de l'avantage."]
];

const TAGLBL={def:"Taux & inflation",nq:"Technologie & IA",eu:"Europe",em:"Émergents",us:"États-Unis",commo:"Énergie & matières",risk:"Risque"};

/* ═════════ 2. ÉTAT ═════════ */
const DEF={hor:15,dd:36,cap:10000,mens:400,mode:"global",eu:18,em:12,sm:6,nq:6,
           saisie:"montant",holdings:{},conv:[]};
const KEY="pilote-pea:v1";
let S=load();
let D=null;                       // instantané de marché

function load(){ try{ return {...DEF,...JSON.parse(localStorage.getItem(KEY)||"{}")}; }catch{ return {...DEF}; } }
function save(){ try{ localStorage.setItem(KEY,JSON.stringify(S)); }catch{} }

/* ═════════ 3. OUTILS ═════════ */
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const eur=n=>(n==null||!isFinite(n))?"—":Math.round(n).toLocaleString("fr-FR")+" €";
const eurK=n=>n==null?"—":n>=1e6?(n/1e6).toFixed(2).replace(".",",")+" M€":n>=1000?Math.round(n/1000)+" k€":Math.round(n)+" €";
const pc=(n,d=1)=>(n==null||!isFinite(n))?"—":n.toFixed(d).replace(".",",")+" %";
const sig=(n,d=1)=>(n==null||!isFinite(n))?"—":(n>0?"+":"")+n.toFixed(d).replace(".",",")+" %";
const sigPt=(n,d=2)=>(n==null||!isFinite(n))?"—":(n>0?"+":"")+n.toFixed(d).replace(".",",")+" pt";
const nb=(n,d=2)=>(n==null||!isFinite(n))?"—":n.toLocaleString("fr-FR",{minimumFractionDigits:d,maximumFractionDigits:d});
const cls=n=>n==null?"mut":n>0.02?"up":n<-0.02?"down":"mut";
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const ago=iso=>{if(!iso)return"";const m=(Date.now()-Date.parse(iso))/6e4;
  if(!isFinite(m))return"";if(m<60)return`il y a ${Math.max(1,Math.round(m))} min`;
  if(m<1440)return`il y a ${Math.round(m/60)} h`;return`il y a ${Math.round(m/1440)} j`;};

function sparkSvg(arr,color){
  if(!arr||arr.length<3)return"";
  const mn=Math.min(...arr),mx=Math.max(...arr),r=(mx-mn)||1;
  const pts=arr.map((v,i)=>`${(i/(arr.length-1)*72+1).toFixed(1)},${(20-(v-mn)/r*18).toFixed(1)}`).join(" ");
  return `<svg class="spark" viewBox="0 0 74 22" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.4"/></svg>`;
}

/* ═════════ 4. MOTEUR D'ALLOCATION ═════════ */
function alloc(){
  const capH = S.hor<3?25 : S.hor<5?40 : S.hor<8?70 : S.hor<12?90 : 100;
  const byRisk = Math.round(S.dd/0.52);
  const eq = Math.max(10, Math.min(capH, byRisk, 100));
  let eu=S.eu, em=S.em, sm=S.sm, nq=S.nq;
  const sum=eu+em+sm+nq, MAX=60;
  if(sum>MAX){const k=MAX/sum; eu*=k; em*=k; sm*=k; nq*=k;}
  const world=100-(eu+em+sm+nq);
  return {eq,capH,byRisk,satPct:eu+em+sm+nq,
    w:{world:world*eq/100,eu:eu*eq/100,em:em*eq/100,sm:sm*eq/100,nq:nq*eq/100,def:100-eq}};
}
const lines=()=>{const a=alloc();
  return BRICKS.map(b=>({...b,w:a.w[b.id],e:U[b.etf]})).filter(x=>x.w>0.05);};

function stats(){
  const L=lines(),a=alloc();
  let r=0,v=0,ter=0,us=0,t10=0;
  L.forEach(l=>{const p=l.w/100;r+=l.r*p;v+=l.v*p;ter+=l.e.ter*p;us+=l.e.us*p;t10+=l.e.top10*p;});
  const eqW=a.eq/100;
  const vol=eqW>0?v*(0.90+0.10*(1-Math.min(a.satPct,60)/60)):v;
  return {ret:r-ter,retBrut:r,vol,ter,us,usEq:eqW>0?us/eqW:0,top10:t10,top10Eq:eqW>0?t10/eqW:0,
          eq:a.eq,dd:Math.round(a.eq*0.52)};
}
function proj(){
  const st=stats(),n=S.hor*12,m=S.mens,c=S.cap;
  const run=r=>{let v=c;const s=[c];for(let i=0;i<n;i++){v=v*(1+r/100/12)+m;s.push(v);}return s;};
  const sc=run(st.ret),sf=run(st.ret+3),sd=run(Math.max(-1,st.ret-4.5));
  const sv=[];{let v=c;for(let i=0;i<=n;i++){sv.push(v);v+=m;}}
  return {sc,sf,sd,sv,central:sc[n],fav:sf[n],def:sd[n],versed:sv[n],ret:st.ret};
}

/* ═════════ 5. CHARGEMENT DES DONNÉES ═════════ */
async function loadData(force){
  const url="data/latest.json?v="+(force?Date.now():new Date().toISOString().slice(0,13));
  try{
    const r=await fetch(url,{cache:force?"reload":"default"});
    if(!r.ok)throw new Error("HTTP "+r.status);
    D=await r.json();
    try{localStorage.setItem(KEY+":snap",JSON.stringify({at:Date.now(),d:D}));}catch{}
    return "live";
  }catch(e){
    try{
      const s=JSON.parse(localStorage.getItem(KEY+":snap")||"null");
      if(s?.d){D=s.d;return "cache";}
    }catch{}
    D=null;return "off";
  }
}

function setLive(mode){
  const el=$("#live"),dot=el.querySelector(".pulse"),txt=$("#liveTxt");
  if(!D){dot.className="pulse off";txt.textContent="hors ligne — aucune donnée";return;}
  const age=(Date.now()-Date.parse(D.generatedAt))/36e5;
  const stale=!isFinite(age)||age>30;
  dot.className="pulse"+(mode==="cache"||stale?" stale":"");
  txt.textContent=(mode==="cache"?"en cache · ":"")+(D.asOf||"")+" · "+(D.quality??"?")+" % des sources";
  $("#footMeta").textContent=`Dernière collecte ${ago(D.generatedAt)} — ${D.health?.filter(h=>h.ok).length||0}/${D.health?.length||0} sources disponibles.`;
}

/* ═════════ 6. ONGLET « AUJOURD'HUI » ═════════ */
function rJour(){
  if(!D){$("#briefBox").innerHTML=`<div class="card"><b>Pas de données</b>
    <p class="note">L'app n'a pas encore reçu de collecte. Lance <code>npm run daily</code> en local, ou attends le passage automatique de GitHub Actions.</p></div>`;return;}
  const b=D.brief||{},r=D.regime||{};
  const demo=D.demo?`<div class="disc"><b>Données d'amorçage, pas des cours réels.</b>
     Ce jeu de démonstration a été généré hors ligne pour que l'app soit utilisable immédiatement.
     Il sera remplacé par de vraies cotations dès le premier passage de la collecte automatique
     — onglet Actions du dépôt, workflow « Collecte quotidienne », bouton « Run workflow » pour
     la déclencher tout de suite.</div>`:"";
  const col={up:"var(--up)",acc:"var(--acc)",warn:"var(--warn)",down:"var(--down)"}[r.color]||"var(--acc)";
  $("#briefBox").innerHTML=demo+`
   <div class="card" style="border-left:3px solid ${col}">
     <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:baseline">
       <div style="font-size:17px;font-weight:640">${esc(b.headline||r.label||"")}</div>
       <div class="mut" style="font:11px var(--mono)">${esc(D.asOf||"")}</div>
     </div>
     ${(b.paragraphs||[]).map(p=>`<p style="font-size:13.5px;color:var(--txt2);margin-top:9px">${esc(p)}</p>`).join("")}
     <div style="margin-top:13px;padding-top:11px;border-top:1px dashed var(--line2);font-size:13px">
       <b style="color:var(--txt)">${esc(b.verdict||"")}</b>
       <div class="note" style="margin-top:6px">${esc(b.action||"")}</div>
     </div>
     ${r.drivers?.length?`<div class="note" style="margin-top:10px">Régime « ${esc(r.label)} » déduit de : ${r.drivers.map(esc).join(" · ")}.</div>`:""}
   </div>`;

  $("#signals").innerHTML=(D.signals||[]).length
    ? D.signals.map(s=>`<div class="adv ${s.level}">
        <div class="t">${esc(s.title)}<em>${s.level==="alert"?"vigilance":s.level==="caution"?"à surveiller":"contexte"}</em></div>
        <p>${esc(s.text)}</p>
        ${s.action?`<p style="color:var(--txt)"><b>→ ${esc(s.action)}</b></p>`:""}
        ${s.why?`<div class="why"><b>Pourquoi ça compte :</b> ${esc(s.why)}</div>`:""}
      </div>`).join("")
    : `<div class="adv ok"><div class="t">Rien à signaler<em>contexte</em></div>
       <p>Aucun seuil de vigilance n'est franchi dans les données du jour.</p></div>`;

  const tags=Object.keys(D.news?.byTag||{});
  $("#newsFilter").innerHTML=[["all","Tout"],...tags.map(t=>[t,TAGLBL[t]||t])]
    .map(([k,l],i)=>`<button class="${i===0?"on":""}" data-nf="${k}">${l}</button>`).join("");
  $$("#newsFilter button").forEach(btn=>btn.onclick=()=>{
    $$("#newsFilter button").forEach(x=>x.classList.remove("on"));
    btn.classList.add("on");renderNews(btn.dataset.nf);});
  renderNews("all");

  const cal=(D.calendar||[]).slice(0,10);
  $("#calBox").innerHTML=cal.length?`<h3>Prochains rendez-vous macro</h3>
   <div class="card" style="padding:0;overflow-x:auto"><table>
    <tr><th>Date</th><th>Zone</th><th>Publication</th><th class="num">Attendu</th><th class="num">Précédent</th></tr>
    ${cal.map(e=>`<tr><td class="mut" style="font:11.5px var(--mono)">${esc((e.date||"").slice(0,16))}</td>
      <td><span class="chip">${esc(e.country)}</span></td><td>${esc(e.event)}</td>
      <td class="num">${e.estimate??"—"}</td><td class="num mut">${e.previous??"—"}</td></tr>`).join("")}
   </table></div>`:"";
}

function renderNews(filter){
  const n=D?.news;if(!n)return;
  const items=filter==="all"?(n.top||[]):(n.byTag?.[filter]||[]);
  $("#newsBox").innerHTML=items.length
    ? items.slice(0,20).map(i=>`<a class="news" href="${esc(i.link)}" target="_blank" rel="noopener" style="border-bottom:1px solid var(--line)">
        <div class="h">${esc(i.title)}</div>
        <div class="m"><span>${esc(i.source)}</span>${i.date?`<span>${ago(i.date)}</span>`:""}
        ${(i.tags||[]).map(t=>`<span class="chip">${esc(t.lbl)}</span>`).join("")}</div></a>`).join("")
    : `<div class="mut" style="font-size:13px">Aucune actualité sur ce thème dans la dernière collecte.</div>`;
}

/* ═════════ 7. ONGLET MARCHÉ ═════════ */
function rMarche(){
  if(!D){$("#tblIdx").innerHTML="";return;}
  const q=D.quotes||{},m=D.macro||{};
  const K=[];
  if(q.spx)K.push({l:"S&P 500",v:nb(q.spx.last,0),n:`${sig(q.spx.chg1d)} sur la séance · ${sig(q.spx.chgYtd)} depuis janvier`});
  if(q.cac)K.push({l:"CAC 40",v:nb(q.cac.last,0),n:`${sig(q.cac.chg1d)} sur la séance · ${sig(q.cac.chgYtd)} depuis janvier`});
  if(q.us10)K.push({l:"Treasury 10 ans",v:nb(q.us10.last,2)+" %",n:`${sigPt(q.us10.ytdPts)} depuis janvier`});
  if(q.vix)K.push({l:"VIX",v:nb(q.vix.last,1),n:q.vix.last>25?"tension marquée":q.vix.last>20?"nervosité":"régime calme"});
  $("#mktKpis").innerHTML=K.map(k=>`<div class="kpi"><div class="lbl">${k.l}</div><div class="val">${k.v}</div><div class="note">${k.n}</div></div>`).join("");

  const row=id=>{const x=q[id];if(!x)return"";
    const c1=x.isRate?sigPt(x.d1Pts):sig(x.chg1d), cy=x.isRate?sigPt(x.ytdPts):sig(x.chgYtd);
    const k1=x.isRate?x.d1Pts:x.chg1d, ky=x.isRate?x.ytdPts:x.chgYtd;
    return `<tr><td>${esc(x.label)}${x.stale?' <span class="chip warn">veille</span>':""}
        <span class="isin">${esc(x.date||"")}</span></td>
      <td class="num">${nb(x.last, x.last>500?0:x.last>5?2:4)}</td>
      <td class="num ${cls(k1)}">${c1}</td>
      <td class="num ${cls(x.chg1m)} hide-s">${sig(x.chg1m)}</td>
      <td class="num ${cls(ky)}">${cy}</td>
      <td class="num ${cls(x.ddFromHigh)} hide-s">${sig(x.ddFromHigh)}</td>
      <td class="hide-s">${sparkSvg(x.spark, x.chgYtd>0?"#2ecc8f":"#ff5d6c")}</td></tr>`;};
  const head=`<tr><th>Indice</th><th class="num">Cours</th><th class="num">Jour</th>
    <th class="num hide-s">1 mois</th><th class="num">Depuis janv.</th>
    <th class="num hide-s">Sous plus haut</th><th class="hide-s">1 an</th></tr>`;
  $("#tblIdx").innerHTML=head+["cac","sx5e","sxxp","dax","spx","ndx","comp","rut","n225","shcomp","vix"].map(row).join("");
  $("#tblRates").innerHTML=head.replace("Indice","Instrument")+["us02","us10","us30","eurusd","gold","brent","btc"].map(row).join("");

  const cell=(o,unit="%")=>o?`<tr><td>${esc(o.l)}</td><td class="num">${nb(o.v,2)} ${unit}</td>
    <td class="num mut" style="font-size:11px">${esc(o.d||"")}</td></tr>`:"";
  $("#macroBox").innerHTML=`
   <div class="card"><h3 style="margin-top:0">Zone euro — BCE</h3><table>
     ${cell(m.bce?.depo)}${cell(m.bce?.refi)}${cell(m.bce?.estr)}
     ${cell(m.bce?.hicp)}${cell(m.bce?.hicpCore)}${cell(m.bce?.unemp)}
   </table>${!m.bce?.depo?'<div class="note">Série BCE indisponible lors de la dernière collecte.</div>':""}</div>
   <div class="card"><h3 style="margin-top:0">États-Unis — Fed</h3><table>
     ${cell(m.fed?.upper)}${cell(m.fed?.lower)}${cell(m.fed?.cpi)}${cell(m.fed?.cpiCore)}
     ${cell(m.fed?.real10)}${cell(m.fed?.breakeven)}${cell(m.fed?.slope,"pt")}${cell(m.fed?.unrate)}${cell(m.fed?.hy,"pt")}
   </table>${!m.fed?.cpi?'<div class="note">Série FRED indisponible — vérifie que le secret FRED_API_KEY est renseigné dans le dépôt.</div>':""}</div>`;
}

/* ═════════ 8. PORTEFEUILLE VALORISÉ ═════════ */
function holdingsValue(){
  const q=D?.quotes||{},L=lines(),out=[];
  let total=0;
  for(const l of L){
    const h=S.holdings[l.id]||{};
    const px=q[l.etf]?.last??null;
    const val=S.saisie==="parts" ? (h.parts&&px? h.parts*px : 0) : (h.montant||0);
    total+=val;
    out.push({...l,px,parts:h.parts||0,val,quote:q[l.etf]||null});
  }
  return {rows:out,total};
}

function rPortef(){
  const {rows,total}=holdingsValue();
  const st=stats();
  let dayPnl=0,ytdPnl=0,px=0;
  rows.forEach(r=>{const c=r.quote;if(!c||!r.val)return;
    if(c.chg1d!=null)dayPnl+=r.val*c.chg1d/100;
    if(c.chgYtd!=null)ytdPnl+=r.val-r.val/(1+c.chgYtd/100);px++;});

  $("#pfKpis").innerHTML=[
   {l:"Valeur du portefeuille",v:total?eurK(total):"—",n:total?`${rows.filter(r=>r.val>0).length} lignes valorisées`:"Saisis tes montants dans Rééquilibrage"},
   {l:"Variation du jour",v:total?sig(total?dayPnl/total*100:null):"—",n:total?`soit ${eur(dayPnl)}`:"—",c:dayPnl},
   {l:"Depuis le 1ᵉʳ janvier",v:total?sig(total?ytdPnl/(total-ytdPnl)*100:null):"—",n:total?`soit ${eur(ytdPnl)}`:"—",c:ytdPnl},
   {l:"Frais annuels",v:pc(st.ter,2),n:total?`soit ${eur(total*st.ter/100)} par an`:"sur l'allocation cible"}
  ].map(k=>`<div class="kpi"><div class="lbl">${k.l}</div>
    <div class="val ${k.c!=null?cls(k.c):""}">${k.v}</div><div class="note">${k.n}</div></div>`).join("");

  $("#tblPf").innerHTML=`<tr><th>Ligne</th><th class="num">Cible</th><th class="num">Réel</th>
     <th class="num">Valeur</th><th class="num">Cours</th><th class="num">Jour</th><th class="num hide-s">Depuis janv.</th></tr>`+
   rows.map(r=>{const w=total?r.val/total*100:0,d=total?w-r.w:0;
     return `<tr><td><span class="pill ${r.cls}">${r.lbl}</span>
        <div style="font-size:12.5px;margin-top:4px">${esc(r.e.n)}</div>
        <span class="isin">${r.e.i}${r.parts?` · ${nb(r.parts,0)} parts`:""}</span></td>
      <td class="num">${pc(r.w)}</td>
      <td class="num ${total?(Math.abs(d)<5?"":d>0?"warn":"down"):"mut"}">${total?pc(w):"—"}</td>
      <td class="num">${r.val?eur(r.val):"—"}</td>
      <td class="num">${r.px!=null?nb(r.px,2):"—"}</td>
      <td class="num ${cls(r.quote?.chg1d)}">${r.quote?sig(r.quote.chg1d):"—"}</td>
      <td class="num hide-s ${cls(r.quote?.chgYtd)}">${r.quote?sig(r.quote.chgYtd):"—"}</td></tr>`;}).join("");

  $("#pfNote").innerHTML=total
    ? `Exposition américaine réelle de la poche actions : <b style="color:var(--txt)">${pc(st.usEq)}</b> — contre 73,9 % pour un ETF World détenu seul.`
    : `Aucun montant saisi. Va dans <b style="color:var(--txt)">Rééquilibrage</b> pour renseigner tes lignes : les valeurs restent sur cet appareil.`;

  const q=D?.quotes||{};
  $("#tblEtf").innerHTML=`<tr><th>ETF</th><th class="num">Frais</th><th class="num">Cours</th>
     <th class="num">Jour</th><th class="num hide-s">1 mois</th><th class="num">Depuis janv.</th><th class="num hide-s">Sous plus haut</th></tr>`+
   Object.entries(U).map(([k,e])=>{const c=q[k];
     return `<tr><td>${esc(e.n)}<span class="isin">${e.i} · ${esc(e.rep)} · ${esc(e.em)}</span></td>
      <td class="num">${pc(e.ter,2)}</td>
      <td class="num">${c?nb(c.last,2):'<span class="mut">n.c.</span>'}</td>
      <td class="num ${cls(c?.chg1d)}">${c?sig(c.chg1d):"—"}</td>
      <td class="num hide-s ${cls(c?.chg1m)}">${c?sig(c.chg1m):"—"}</td>
      <td class="num ${cls(c?.chgYtd)}">${c?sig(c.chgYtd):"—"}</td>
      <td class="num hide-s ${cls(c?.ddFromHigh)}">${c?sig(c.ddFromHigh):"—"}</td></tr>`;}).join("");
}

/* ═════════ 9. ONGLET ALLOCATION ═════════ */
function rAlloc(){
  const a=alloc(),st=stats(),L=lines();
  $("#vHor").textContent=S.hor;$("#vDd").textContent=S.dd;
  $("#vCap").textContent=eur(S.cap);$("#vMens").textContent=eur(S.mens);
  $("#vEu").textContent=S.eu;$("#vEm").textContent=S.em;$("#vSm").textContent=S.sm;$("#vNq").textContent=S.nq;

  const sat=S.eu+S.em+S.sm+S.nq;
  $("#satWarn").innerHTML=sat>60
    ?`<span class="warn">Total satellites ${sat} % : plafonné à 60 % pour garder un cœur majoritaire. Les poids sont réduits proportionnellement.</span>`
    :`Cœur mondial : ${(100-sat).toFixed(0)} % de la poche actions.`;

  $("#modeExpl").innerHTML=S.mode==="global"
    ?`Le PEA reste intégralement en actions ; le défensif (fonds euro, obligataire, or) vit en assurance-vie ou compte-titres.
      <b style="color:var(--txt)">C'est le bon arbitrage :</b> l'exonération d'impôt sur le revenu après 5 ans s'applique aux gains les plus élevés,
      donc autant y loger ce qui rapporte le plus. En prime tu récupères l'accès aux obligations et à l'or, impossibles en PEA.`
    :`Tout est dans le PEA. Seul instrument défensif disponible : l'Amundi PEA Euro Court Terme, monétaire €STR depuis octobre 2024.
      <b class="warn">À comparer</b> au rendement des obligations souveraines et à l'inflation — regarde l'onglet Aujourd'hui.`;

  $("#allocKpis").innerHTML=[
   {l:"Part actions",v:pc(a.eq,0),n:`Plafond horizon ${a.capH} % · plafond risque ${Math.min(a.byRisk,100)} %`},
   {l:"Expo US de la poche actions",v:pc(st.usEq,0),n:"Contre 73,9 % pour un World seul"},
   {l:"Volatilité attendue",v:pc(st.vol,0),n:"Écart-type annuel estimé"},
   {l:"Baisse à encaisser",v:"−"+st.dd+" %",n:"Ordre de grandeur en crise majeure"},
   {l:"Frais annuels",v:pc(st.ter,2),n:`≈ ${eur((S.cap+S.mens*12*S.hor/2)*st.ter/100)} par an`}
  ].map(k=>`<div class="kpi"><div class="lbl">${k.l}</div><div class="val">${k.v}</div><div class="note">${k.n}</div></div>`).join("");

  $("#stack").innerHTML=L.map(l=>`<i style="width:${l.w}%;background:${l.col}">${l.w>7?Math.round(l.w)+"%":""}</i>`).join("");
  $("#legend").innerHTML=L.map(l=>`<span><i class="dot" style="background:${l.col}"></i>${l.lbl} — ${pc(l.w)}</span>`).join("");

  const zones=[
   {z:"États-Unis",w:st.us,n:"Cœur World + small caps + Nasdaq"},
   {z:"Europe",w:L.reduce((s,l)=>s+(l.id==="eu"?l.w:l.id==="world"?l.w*0.16:0),0),n:"Poche dédiée + part européenne du World"},
   {z:"Japon et Pacifique",w:L.reduce((s,l)=>s+(l.id==="world"?l.w*0.10:0),0),n:"Uniquement via le World"},
   {z:"Émergents",w:L.reduce((s,l)=>s+(l.id==="em"?l.w:0),0),n:"Absents d'un MSCI World"},
   {z:S.mode==="global"?"Défensif hors PEA":"Monétaire €STR",w:L.reduce((s,l)=>s+(l.id==="def"?l.w:0),0),n:S.mode==="global"?"Assurance-vie ou compte-titres":"Dans le PEA"}
  ];
  const tot=zones.reduce((s,z)=>s+z.w,0)||1;
  $("#tblLook").innerHTML=`<tr><th>Zone</th><th class="num">Poids réel</th><th class="hide-s"></th><th>D'où ça vient</th></tr>`+
   zones.map(z=>`<tr><td>${z.z}</td><td class="num">${pc(z.w)}</td>
     <td class="hide-s" style="width:30%"><div class="bar"><i style="width:${Math.min(100,z.w/tot*100)}%;background:var(--acc)"></i></div></td>
     <td class="mut" style="font-size:12.5px">${z.n}</td></tr>`).join("")+
   `<tr><td colspan="4" class="mut" style="font-size:12px;padding-top:12px">Ramenée à la seule poche actions, l'exposition américaine ressort à
     <b style="color:var(--txt)">${pc(st.usEq)}</b> et les dix premières lignes à environ <b style="color:var(--txt)">${pc(st.top10Eq,0)}</b>
     — contre 73,9 % et 28 % pour un ETF World détenu seul.</td></tr>`;

  rProj();
}

function rProj(){
  const p=proj(),st=stats(),verse=S.cap+S.mens*12*S.hor;
  const netPS=v=>v-Math.max(0,v-verse)*0.186;
  const W=880,H=290,PL=62,PR=12,PT=12,PB=26;
  const n=p.sc.length,max=Math.max(Math.max(...p.sf),1)*1.02;
  const X=i=>PL+(W-PL-PR)*i/(n-1),Y=v=>PT+(H-PT-PB)*(1-v/max);
  const path=s=>s.map((v,i)=>(i?"L":"M")+X(i).toFixed(1)+" "+Y(v).toFixed(1)).join(" ");
  let gl="";for(let i=0;i<=4;i++){const v=max*i/4,y=Y(v);
    gl+=`<line x1="${PL}" x2="${W-PR}" y1="${y}" y2="${y}" stroke="var(--line)" stroke-width="1"/>
         <text x="${PL-8}" y="${y+4}" fill="var(--txt3)" font-size="10.5" text-anchor="end" font-family="ui-monospace,monospace">${eurK(v)}</text>`;}
  let xl="";const step=Math.max(1,Math.round(S.hor/6));
  for(let y=0;y<=S.hor;y+=step){xl+=`<text x="${X(y*12)}" y="${H-7}" fill="var(--txt3)" font-size="10.5" text-anchor="middle" font-family="ui-monospace,monospace">${y===0?"auj.":"+"+y+" a"}</text>`;}
  const band=path(p.sf)+" "+p.sd.map((v,i)=>"L"+X(p.sd.length-1-i).toFixed(1)+" "+Y(p.sd[p.sd.length-1-i]).toFixed(1)).join(" ")+" Z";
  $("#chart").innerHTML=`<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block">${gl}${xl}
    <path d="${band}" fill="rgba(79,156,249,.08)"/>
    <path d="${path(p.sv)}" fill="none" stroke="var(--txt3)" stroke-width="1.5" stroke-dasharray="4 4"/>
    <path d="${path(p.sd)}" fill="none" stroke="var(--down)" stroke-width="1.6"/>
    <path d="${path(p.sf)}" fill="none" stroke="var(--up)" stroke-width="1.6"/>
    <path d="${path(p.sc)}" fill="none" stroke="var(--acc)" stroke-width="2.4"/></svg>`;

  $("#tblHyp").innerHTML=`<tr><th>Brique</th><th class="num">Rendement</th><th class="num">Volatilité</th><th class="num">Poids</th></tr>`+
   lines().map(l=>`<tr><td>${l.lbl}<span class="isin">${l.e.i}</span></td><td class="num">${pc(l.r,1)}</td>
     <td class="num mut">${pc(l.v,0)}</td><td class="num">${pc(l.w)}</td></tr>`).join("")+
   `<tr><td><b>Portefeuille</b></td><td class="num"><b>${pc(st.retBrut,1)}</b>
     <div class="mut" style="font-size:10px">${pc(st.ret,1)} net de frais</div></td>
     <td class="num">${pc(st.vol,0)}</td><td class="num">100,0 %</td></tr>`;

  const gain=Math.max(0,p.central-verse);
  $("#fisc").innerHTML=`<table>
    <tr><td>Total versé sur ${S.hor} ans</td><td class="num">${eur(verse)}</td></tr>
    <tr><td>Plus-value en trajectoire centrale</td><td class="num">${eur(gain)}</td></tr>
    <tr><td>Prélèvements sociaux 18,6 %</td><td class="num down">−${eur(gain*0.186)}</td></tr>
    <tr><td>Impôt sur le revenu après 5 ans</td><td class="num up">0 €</td></tr>
    <tr><td><b>Net en poche</b></td><td class="num"><b>${eur(netPS(p.central))}</b></td></tr>
    <tr><td class="mut">Le même gain sur un compte-titres (31,4 %)</td><td class="num mut">${eur(verse+gain*0.686)}</td></tr>
    <tr><td class="up"><b>Ce que le PEA t'a fait gagner</b></td><td class="num up"><b>+${eur(gain*0.128)}</b></td></tr>
   </table>
   <div class="note">Les prélèvements sociaux du PEA sont passés de 17,2 % à 18,6 % le 1ᵉʳ janvier 2026 : la CSG a été portée de 9,2 % à 10,6 % par la LFSS 2026. Le nouveau taux s'applique à l'ensemble des gains, y compris ceux accumulés avant 2026.</div>`;

  const crash=Math.round(p.central*(1-st.dd/100));
  $("#stress").innerHTML=`<p style="font-size:13.5px;color:var(--txt2)">Un portefeuille se juge sur ce qu'on en fait le pire jour, pas le meilleur.</p>
   <table style="margin-top:10px">
    <tr><td>Capital en trajectoire centrale à ${S.hor} ans</td><td class="num">${eur(p.central)}</td></tr>
    <tr><td>Si une crise majeure survient à ce moment-là (−${st.dd} %)</td><td class="num down">${eur(crash)}</td></tr>
    <tr><td>Perte à encaisser sans vendre</td><td class="num down">−${eur(p.central-crash)}</td></tr>
    <tr><td>Trajectoire défavorable sur toute la période</td><td class="num warn">${eur(p.def)}</td></tr>
   </table>
   <div class="note"><b style="color:var(--txt)">La vraie question :</b> est-ce que tu continues de verser ${eur(S.mens)} le mois où ton portefeuille affiche ${eur(crash)} ?
   Si la réponse est non, la part actions de ${pc(st.eq,0)} est trop élevée — baisse le curseur de tolérance jusqu'à ce que la réponse devienne oui.
   Un portefeuille qu'on abandonne au pire moment est pire qu'un portefeuille trop prudent.</div>`;
}

/* ═════════ 10. POURQUOI CES ETF ═════════ */
function rPourquoi(){
  $("#tblCrit").innerHTML=CRIT.map(c=>`<tr><td style="width:225px"><b>${c[0]}</b></td><td style="color:var(--txt2)">${c[1]}</td></tr>`).join("");
  const q=D?.quotes||{};
  $("#duels").innerHTML=DUELS.map(d=>{const W=U[d.w],c=q[d.w];
    return `<h3>${d.ti}</h3><div class="vs">
     <div class="side win"><div class="tag-win">retenu</div>
       <div style="font-weight:600;margin:5px 0 4px">${esc(W.n)}</div>
       <span class="isin">${W.i} · ${esc(W.rep)} · ${esc(W.em)}</span>
       <div style="display:flex;gap:16px;margin-top:10px;font:12.5px var(--mono);flex-wrap:wrap">
         <span>${pc(W.ter,2)}<div class="mut" style="font:10px inherit">frais</div></span>
         <span>${W.aum?W.aum.toLocaleString("fr-FR")+" M€":"n.c."}<div class="mut" style="font:10px inherit">encours</div></span>
         ${c?`<span class="${cls(c.chgYtd)}">${sig(c.chgYtd)}<div class="mut" style="font:10px inherit">depuis janv.</div></span>`:""}
       </div></div>
     <div class="mid">contre</div>
     <div class="side"><div class="tag-win mut">écartés</div>
       ${d.l.map(x=>{const cc=q[x];return `<div style="margin-top:7px"><b style="font-size:13px">${esc(U[x].n)}</b>
         <span class="isin">${U[x].i} · ${pc(U[x].ter,2)} · ${U[x].aum?U[x].aum.toLocaleString("fr-FR")+" M€":"encours en constitution"}${cc?" · "+sig(cc.chgYtd)+" depuis janv.":""}</span></div>`;}).join("")}
     </div></div>
    <div class="card tight" style="margin-top:-4px;border-radius:0 0 11px 11px">
      <div style="font-size:13px;color:var(--txt2)"><b style="color:var(--txt)">Ce qui tranche :</b> ${d.k}</div></div>`;}).join("");

  $("#tblLimits").innerHTML=`<tr><th>Ce que tu ne peux pas loger</th><th>Statut</th><th>Où le mettre à la place</th></tr>`+
   LIMITS.map(l=>`<tr><td><b>${l[0]}</b></td><td class="down" style="font-size:12.5px">${l[1]}</td>
     <td style="color:var(--txt2);font-size:13px">${l[2]}</td></tr>`).join("");

  $("#swapBox").innerHTML=`<p style="font-size:13.5px;color:var(--txt2)">Presque tous les ETF PEA exposés hors zone euro sont synthétiques.
   Le fonds détient un panier d'actions européennes et échange sa performance contre celle de l'indice cible, via un swap avec une banque.
   C'est ce qui rend le S&amp;P 500 ou le MSCI World éligibles au PEA.</p>
   <ul>
    <li><b>Ce que ça t'apporte</b> : accès au monde entier dans une enveloppe à 12,8 points d'impôt sur le revenu en moins, et un suivi d'indice souvent plus serré, sans frottement fiscal sur les dividendes américains.</li>
    <li><b>Ce que ça te coûte</b> : un risque de contrepartie. Encadré par la réglementation UCITS — exposition nette plafonnée à 10 % de l'actif par contrepartie, collatéral déposé, swaps souvent remis à zéro quotidiennement.</li>
    <li><b>Comment on le limite</b> : trois émetteurs différents sur les principales lignes — BlackRock sur le cœur mondial, BNP Paribas sur l'Europe, Amundi sur les émergents. Ça ne supprime pas le risque, ça évite de le concentrer.</li>
    <li><b>La seule échappatoire</b> : l'iShares Core MSCI EMU (IE00B53QG562) réplique physiquement, sans swap, pour 0,12 %. Au prix d'un périmètre réduit à la zone euro — une exposition mondiale physique est impossible en PEA.</li>
   </ul>`;
}

/* ═════════ 11. RÉÉQUILIBRAGE ═════════ */
function rRebal(){
  const L=lines(),q=D?.quotes||{};
  $$("#segSaisie button").forEach(b=>b.classList.toggle("on",b.dataset.s===S.saisie));
  const parts=S.saisie==="parts";
  $("#tblRebal").innerHTML=`<tr><th>Ligne</th><th class="num">Cible</th>
      <th class="num" style="width:118px">${parts?"Parts":"Montant (€)"}</th>
      <th class="num hide-s">Cours</th><th class="num">Valeur</th><th class="num">Dérive</th><th>Action</th></tr>`+
   L.map(l=>{const h=S.holdings[l.id]||{},px=q[l.etf]?.last;
     return `<tr><td><span class="pill ${l.cls}">${l.lbl}</span><span class="isin">${l.e.t!=="—"?l.e.t+" · ":""}${l.e.i}</span></td>
      <td class="num">${pc(l.w)}</td>
      <td><input type="number" inputmode="decimal" data-rb="${l.id}" min="0" step="${parts?1:50}"
          value="${parts?(h.parts||""):(h.montant||"")}" placeholder="0"></td>
      <td class="num hide-s mut">${px!=null?nb(px,2):"—"}</td>
      <td class="num" id="rv-${l.id}">—</td><td class="num" id="rd-${l.id}">—</td>
      <td id="ra-${l.id}" style="font-size:12.5px">—</td></tr>`;}).join("");
  $$("[data-rb]").forEach(inp=>{inp.oninput=()=>{
    const id=inp.dataset.rb,v=parseFloat(inp.value)||0;
    S.holdings[id]={...(S.holdings[id]||{}),[parts?"parts":"montant"]:v};
    save();calcRebal();rPortef();};});
  calcRebal();
}

function calcRebal(){
  const {rows,total}=holdingsValue();
  if(!total){
    rows.forEach(r=>["rv","rd","ra"].forEach(p=>{const e=$("#"+p+"-"+r.id);if(e)e.innerHTML="—";}));
    $("#rebalOut").innerHTML=`<div class="card"><div class="mut" style="font-size:13px">
      Saisis la valeur de tes lignes pour obtenir le plan de rééquilibrage. Rien n'est envoyé : tout reste dans le navigateur.</div></div>`;
    return;
  }
  const gaps=rows.map(r=>{const w=r.val/total*100;
    return {...r,w2:w,d:w-r.w,manque:Math.max(0,r.w/100*total-r.val)};});
  gaps.forEach(g=>{
    $("#rv-"+g.id).textContent=eur(g.val);
    const de=$("#rd-"+g.id);
    de.textContent=(g.d>0?"+":"")+g.d.toFixed(1).replace(".",",")+" pt";
    de.className="num "+(Math.abs(g.d)<5?"mut":g.d>0?"warn":"down");
    $("#ra-"+g.id).innerHTML=Math.abs(g.d)<5?`<span class="mut">Dans la zone, ne rien faire</span>`
      :g.d<0?`<span class="up">Renforcer de ${eur(g.manque)}</span>`
            :`<span class="warn">Suspendre les versements ici</span>`;
  });
  const besoin=gaps.reduce((s,g)=>s+g.manque,0);
  const mois=S.mens>0?Math.ceil(besoin/S.mens):null;
  const rep=gaps.filter(g=>g.manque>0).sort((a,b)=>b.manque-a.manque);
  const derive=Math.max(...gaps.map(g=>Math.abs(g.d)));

  $("#rebalOut").innerHTML=`<div class="grid g3" style="margin-bottom:15px">
    <div class="kpi"><div class="lbl">Portefeuille</div><div class="val">${eurK(total)}</div><div class="note">${rows.filter(r=>r.val>0).length} lignes</div></div>
    <div class="kpi"><div class="lbl">Dérive maximale</div><div class="val ${derive<5?"up":derive<10?"warn":"down"}">${derive.toFixed(1).replace(".",",")} pt</div>
      <div class="note">${derive<5?"Sous le seuil, rien à faire":"Au-dessus du seuil de 5 points"}</div></div>
    <div class="kpi"><div class="lbl">À réinjecter</div><div class="val">${eurK(besoin)}</div>
      <div class="note">${mois?`≈ ${mois} mois de versement`:"Définir un versement mensuel"}</div></div>
   </div>
   ${derive<5?`<div class="adv ok"><div class="t">Portefeuille aligné<em>rien à faire</em></div>
     <p>Aucune ligne ne s'écarte de plus de 5 points de sa cible. Continue les versements selon la répartition cible et reviens dans un an.</p>
     <div class="why"><b>Pourquoi ne rien faire :</b> un rééquilibrage sous 5 points de dérive coûte des frais de courtage pour un gain statistiquement nul.</div></div>`
   :`<div class="adv"><div class="t">Plan de rééquilibrage sans vendre<em>versements orientés</em></div>
     <p>Plutôt que de vendre les lignes en avance, oriente tes ${eur(S.mens)} mensuels vers celles en retard. Zéro frais de courtage, zéro plus-value réalisée, retour à la cible en ${mois||"quelques"} mois.</p>
     <table style="margin-top:10px"><tr><th>Ligne à renforcer</th><th class="num">Manquant</th><th class="num">Part des versements</th><th class="num">Par mois</th></tr>
      ${rep.map(g=>`<tr><td>${g.lbl}<span class="isin">${g.e.i}</span></td><td class="num">${eur(g.manque)}</td>
        <td class="num">${pc(g.manque/besoin*100,0)}</td><td class="num up">${eur(S.mens*g.manque/besoin)}</td></tr>`).join("")}
     </table>
     <div class="why"><b>Quand vendre quand même :</b> uniquement si une ligne dépasse sa cible de plus de 15 points, ou si ton horizon se raccourcit.
     Dans un PEA un arbitrage n'est pas imposé, mais il coûte des frais de courtage à chaque aller-retour.</div></div>`}`;
}

/* ═════════ 12. CONVICTIONS ═════════ */
function rConvict(){
  $("#cvB").innerHTML=Object.entries(U).filter(([,v])=>v.i!=="FR0013346681")
    .map(([k,v])=>`<option value="${k}">${esc(v.n)} — ${pc(v.ter,2)}</option>`).join("");
  $("#cvV").textContent=$("#cvS").value;
  renderConv();
  const nq=D?.quotes?.ndx;
  $("#cvGuard").innerHTML=`<table>
    <tr><td style="width:42%"><b>Plafond global</b></td><td>25 % du portefeuille, toutes poches satellites confondues. Au-delà, ce n'est plus un portefeuille diversifié avec des paris, c'est un portefeuille de paris.</td></tr>
    <tr><td><b>Plafond par conviction</b></td><td>10 %. Aucune idée ne mérite le dixième de ton patrimoine si elle peut perdre la moitié de sa valeur.</td></tr>
    <tr><td><b>Frais maximum</b></td><td>0,60 %. Au-delà, il faut plus de 0,4 point de surperformance annuelle sur le cœur juste pour rentrer dans ses frais.</td></tr>
    <tr><td><b>Encours minimum</b></td><td>100 M€. En dessous, le risque de fermeture t'expose à une vente forcée au mauvais moment.</td></tr>
    <tr><td><b>Durée minimale</b></td><td>3 ans. Une conviction testée sur six mois n'est pas testée, elle est devinée.</td></tr>
    <tr><td><b>Règle d'invalidation</b></td><td>Écrite <i>avant</i> l'achat. Si elle se réalise, on sort — sans renégocier avec soi-même.</td></tr>
   </table>
   ${nq?`<div class="note">Contexte du jour : le Nasdaq-100 est à ${sig(nq.ddFromHigh)} de son plus haut des douze derniers mois et affiche ${sig(nq.chgYtd)} depuis janvier. Les convictions technologiques se paient différemment selon le moment — dans les deux sens.</div>`:""}`;
}
function renderConv(){
  if(!S.conv.length){$("#cvList").innerHTML=`<div class="card"><div class="mut" style="font-size:13px">
    Aucune conviction enregistrée. Une poche satellite sans thèse écrite finit toujours par être vendue au pire moment, faute de savoir pourquoi on l'avait achetée.</div></div>`;return;}
  const tot=S.conv.reduce((s,c)=>s+c.s,0);
  const {total}=holdingsValue();
  $("#cvList").innerHTML=(tot>25?`<div class="adv alert"><div class="t">Total des convictions : ${tot} %<em>plafond dépassé</em></div>
      <p>Au-delà de 25 %, tes paris pilotent le portefeuille au lieu de l'assaisonner. Réduis les tailles.</p></div>`:"")+
   S.conv.map((c,i)=>{const e=U[c.b],q=D?.quotes?.[c.b],base=total||S.cap;
    return `<div class="adv ${c.s>10?"caution":""}">
      <div class="t">${esc(c.t)}<em>${c.s} %</em></div>
      <p><b style="color:var(--txt)">Instrument :</b> ${esc(e.n)} <span class="isin" style="display:inline">${e.i} · ${pc(e.ter,2)}${q?` · ${sig(q.chgYtd)} depuis janvier`:""}</span></p>
      <p><b style="color:var(--txt)">Coût annuel du pari :</b> ${eur(base*c.s/100*e.ter/100)}${e.ter>0.5?` — soit ${(e.ter/0.20).toFixed(1).replace(".",",")}× le coût du cœur`:""}.</p>
      <div class="why"><b>Je me serai trompé si :</b> ${c.i?esc(c.i):`<span class="down">non renseigné — cette conviction n'est pas testable, donc pas exploitable</span>`}
       <span style="float:right;cursor:pointer;color:var(--down)" data-del="${i}">supprimer</span></div></div>`;}).join("");
  $$("[data-del]").forEach(b=>b.onclick=()=>{S.conv.splice(+b.dataset.del,1);save();renderConv();});
}

/* ═════════ 13. SYSTÈME ═════════ */
function rSysteme(){
  $("#tblRules").innerHTML=RULES.map((r,i)=>`<tr><td style="width:34px;font-family:var(--mono);color:var(--acc)">${String(i+1).padStart(2,"0")}</td>
    <td style="width:215px"><b>${r[0]}</b></td><td style="color:var(--txt2)">${r[1]}</td></tr>`).join("");
  $("#tblPea").innerHTML=PEAF.map(p=>`<tr><td style="width:215px"><b>${p[0]}</b></td>
    <td class="num" style="width:100px;color:var(--acc)">${p[1]}</td><td style="color:var(--txt2);font-size:13px">${p[2]}</td></tr>`).join("");

  if(!D){$("#tblHealth").innerHTML="";$("#sysKpis").innerHTML="";return;}
  const h=D.health||[],ok=h.filter(x=>x.ok).length;
  $("#sysKpis").innerHTML=[
   {l:"Dernière collecte",v:D.asOf||"—",n:ago(D.generatedAt)},
   {l:"Sources disponibles",v:`${ok}/${h.length}`,n:`${D.quality??"?"} % de couverture`},
   {l:"Instruments cotés",v:String(Object.keys(D.quotes||{}).length),n:D.carriedOver?`${D.carriedOver} repris de la veille`:"tous frais du jour"},
   {l:"Actualités retenues",v:String(D.news?.top?.length||0),n:`${D.news?.feeds?.filter(f=>f.ok).length||0} flux interrogés`}
  ].map(k=>`<div class="kpi"><div class="lbl">${k.l}</div><div class="val">${k.v}</div><div class="note">${k.n}</div></div>`).join("");

  $("#tblHealth").innerHTML=`<tr><th>Source</th><th>Ce qu'elle apporte</th><th class="num">Points</th><th class="num hide-s">Temps</th><th>État</th></tr>`+
   h.map(x=>`<tr><td><b>${esc(x.name)}</b></td><td class="mut" style="font-size:12.5px">${esc(x.label||"")}</td>
     <td class="num">${x.points||0}</td><td class="num mut hide-s">${x.ms||0} ms</td>
     <td>${x.ok?'<span class="up">disponible</span>':`<span class="down">indisponible</span><span class="isin">${esc((x.error||"").slice(0,70))}</span>`}</td></tr>`).join("");

  const f=D.news?.feeds||[];
  $("#tblFeeds").innerHTML=f.length
    ?`<tr><th>Flux</th><th class="num">Articles</th><th>État</th></tr>`+
     f.map(x=>`<tr><td>${esc(x.source)}</td><td class="num">${x.items||0}</td>
       <td>${x.ok?'<span class="up">ok</span>':`<span class="down">${esc((x.error||"erreur").slice(0,60))}</span>`}</td></tr>`).join("")
    :`<tr><td class="mut">Aucun flux dans la dernière collecte.</td></tr>`;
}

/* ═════════ 14. CÂBLAGE ═════════ */
function renderAll(){rJour();rMarche();rPortef();rAlloc();rPourquoi();rRebal();rConvict();rSysteme();}

function goto(t){
  $$("#nav button, .tabbar button").forEach(b=>b.classList.toggle("on",b.dataset.t===t));
  $$("section").forEach(s=>s.classList.toggle("on",s.id===t));
  window.scrollTo({top:0,behavior:"smooth"});
}
$$("#nav button, .tabbar button").forEach(b=>b.onclick=()=>goto(b.dataset.t));
$$("#segMode button").forEach(b=>b.onclick=()=>{S.mode=b.dataset.m;save();
  $$("#segMode button").forEach(x=>x.classList.toggle("on",x===b));rAlloc();rPortef();rRebal();});
$$("#segSaisie button").forEach(b=>b.onclick=()=>{S.saisie=b.dataset.s;save();rRebal();rPortef();});

[["hor","hor"],["dd","dd"],["cap","cap"],["mens","mens"],["sEu","eu"],["sEm","em"],["sSm","sm"],["sNq","nq"]]
 .forEach(([id,k])=>{const el=$("#"+id);el.value=S[k];
   el.oninput=e=>{S[k]=+e.target.value;save();rAlloc();rPortef();rRebal();};});

$("#cvS").oninput=e=>$("#cvV").textContent=e.target.value;
$("#cvAdd").onclick=()=>{const t=$("#cvT").value.trim();if(!t){$("#cvT").focus();return;}
  S.conv.push({t,i:$("#cvI").value.trim(),b:$("#cvB").value,s:+$("#cvS").value});
  save();$("#cvT").value="";$("#cvI").value="";renderConv();};

$("#btnExport").onclick=()=>{
  const blob=new Blob([JSON.stringify({exporte:new Date().toISOString(),etat:S},null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);
  a.download=`pilote-pea-${new Date().toISOString().slice(0,10)}.json`;a.click();};
$("#btnReset").onclick=()=>{if(confirm("Effacer profil, montants et convictions de cet appareil ?")){
  localStorage.removeItem(KEY);S={...DEF};save();location.reload();}};
$("#btnReload").onclick=async()=>{const m=await loadData(true);setLive(m);renderAll();};

/* ═════════ 15. DÉMARRAGE ═════════ */
(async()=>{
  const mode=await loadData(false);
  setLive(mode);
  renderAll();
  if("serviceWorker" in navigator){
    try{await navigator.serviceWorker.register("sw.js");}catch{}
  }
  // rafraîchit à la remise au premier plan si la collecte a plus de 6 h
  document.addEventListener("visibilitychange",async()=>{
    if(document.visibilityState!=="visible"||!D)return;
    if((Date.now()-Date.parse(D.generatedAt))/36e5>6){
      const m=await loadData(true);setLive(m);renderAll();}
  });
})();
