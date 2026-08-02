# Pilote PEA

Application web installable (PWA) pour piloter un PEA diversifié en ETF.
Les données de marché, la macro et les actualités sont recollectées **chaque matin**
par GitHub Actions, sans serveur et sans coût.

Le parti pris est simple : l'app dit **ce qui a changé**, pas ce qu'il faut acheter.
Son biais par défaut est l'inaction, parce que c'est la bonne réponse dans la
très grande majorité des journées d'un portefeuille long terme.

---

## Mise en ligne — double-clic

Double-clique **`Installer.command`**. Il fait tout : il vérifie le dossier, installe
le projet dans `~/JarvisProject/pilote-pea`, crée le dépôt, active GitHub Pages,
déclenche la première collecte réelle et vérifie que chaque fichier répond.

Si quelque chose cloche ensuite, double-clique **`Diagnostic.command`** : il teste
le site en ligne fichier par fichier et dit précisément ce qui manque.

<details>
<summary>Le faire à la main</summary>

Crée d'abord un dépôt **public** vide nommé `pilote-pea`, sans README ni .gitignore.
Puis, **depuis ce dossier-ci** (`cd` dedans d'abord — c'est l'erreur classique) :

```bash
git init -b main
git add -A && git commit -m "Pilote PEA"
git remote add origin https://github.com/TON-PSEUDO/pilote-pea.git
git push -u origin main
```

Remplace `TON-PSEUDO` par ton vrai pseudo GitHub.
Puis **Settings → Pages → Source : GitHub Actions**.

</details>

L'app sort sur `https://ton-pseudo.github.io/pilote-pea/`.

### L'installer comme une application

- **iPhone / iPad** : ouvrir l'URL dans Safari → Partager → *Sur l'écran d'accueil*.
- **Android** : Chrome propose *Installer l'application*, ou menu → *Ajouter à l'écran d'accueil*.
- **Mac / Windows** : Chrome ou Edge → icône d'installation dans la barre d'adresse.

Une fois installée, elle fonctionne hors ligne avec la dernière collecte reçue.

---

## Clés d'API — trois secrets à ajouter

L'app tourne **sans aucune clé** : Yahoo Finance, Stooq, la BCE, Frankfurter,
CoinGecko et les flux RSS suffisent à couvrir cours, taux, change et actualités.
Trois clés gratuites débloquent la profondeur macro.

| Secret | À créer sur | Ce que ça débloque | Quota gratuit |
|---|---|---|---|
| `FRED_API_KEY` | [fred.stlouisfed.org/docs/api/api_key.html](https://fred.stlouisfed.org/docs/api/api_key.html) | Inflation US et sous-jacente, Fed funds, taux réel, point mort d'inflation, pente de la courbe, chômage, spread high yield | illimité |
| `ALPHAVANTAGE_API_KEY` | [alphavantage.co/support/#api-key](https://www.alphavantage.co/support/#api-key) | Actualités financières notées en sentiment | 25 appels/jour — l'app en fait 1 |
| `FMP_API_KEY` | [site.financialmodelingprep.com/developer/docs](https://site.financialmodelingprep.com/developer/docs) | Calendrier des publications macro à fort impact | 250 appels/jour — l'app en fait 1 |

À ajouter dans **Settings → Secrets and variables → Actions → New repository secret**.
Une clé absente n'est pas une erreur : la source est simplement signalée comme
indisponible dans l'onglet *Système*.

---

## Ce que fait la collecte

`.github/workflows/daily.yml` s'exécute du lundi au samedi à 05:40 UTC
(07:40 heure de Paris en été). Trois étapes :

1. **`scripts/fetch.mjs`** interroge les neuf sources **en parallèle**. Chacune est
   isolée : une source qui tombe n'empêche pas les autres. Résultat dans `docs/data/raw.json`.
2. **`scripts/analyze.mjs`** calcule les performances (jour, semaine, mois, année, un an),
   la volatilité 60 séances, les moyennes mobiles, l'écart au plus haut annuel ; en déduit
   un régime de marché, une liste de signaux et le brief du jour. Un instrument qui n'a pas
   coté aujourd'hui garde la valeur de la veille plutôt que de disparaître.
3. **`scripts/verify.mjs`** refuse la publication si le résultat est manifestement cassé —
   moins de cinq instruments, cours négatif, brief vide. Dans ce cas les données précédentes
   restent en place.

Les résultats sont commités dans `docs/data/`, ce qui déclenche le redéploiement de Pages.
Un instantané quotidien est archivé dans `docs/data/history/`.

### Sources interrogées

| Source | Ce qu'elle apporte | Clé |
|---|---|---|
| Yahoo Finance | Cours des 13 ETF PEA suivis, 11 indices, taux souverains, EUR/USD, or, Brent, Bitcoin — deux ans d'historique quotidien | non |
| Stooq | Indices, en secours de Yahoo | non |
| BCE (SDMX) | Taux de dépôt, refinancement, €STR, inflation zone euro et sous-jacente, chômage | non |
| Frankfurter | Taux de change de référence BCE | non |
| CoinGecko | Bitcoin, Ethereum | non |
| FRED | Macro États-Unis | oui |
| Alpha Vantage | Actualités notées en sentiment | oui |
| FMP | Calendrier économique | oui |
| RSS (18 flux) | BCE, Fed, Insee, Les Échos, La Tribune, Boursorama, CNBC, MarketWatch, Yahoo Finance, Investing, et quatre recherches Google News ciblées | non |

---

## Faire tourner en local

```bash
node scripts/mock.mjs      # jeu de démonstration, sans réseau
node scripts/analyze.mjs   # produit docs/data/latest.json
npx serve docs             # puis ouvrir http://localhost:3000
```

Avec le réseau et les clés dans l'environnement :

```bash
FRED_API_KEY=xxx npm run daily
```

## Structure

```
scripts/
  fetch.mjs          orchestrateur de collecte
  analyze.mjs        performances, régime, signaux, brief
  verify.mjs         garde-fou avant publication
  mock.mjs           jeu de démonstration hors ligne
  lib/http.mjs       client HTTP avec réessais et isolation des pannes
  lib/universe.mjs   univers suivi : ETF, indices, taux, symboles
  sources/*.mjs      un module par source
docs/                racine publiée par GitHub Pages
  index.html app.js styles.css
  manifest.webmanifest sw.js icons/
  data/latest.json   tableau de bord du jour
  data/history/      archive quotidienne
```

Zéro dépendance npm. Node 20+ suffit, `fetch` est natif.

## Confidentialité

Montants, profil et convictions vivent dans le `localStorage` du navigateur.
Ils ne sont jamais envoyés, jamais commités, jamais présents dans le dépôt —
un dépôt public reste donc sans risque. Le bouton *Exporter mes données*
de l'onglet Système produit une sauvegarde locale.

## Avertissement

Ce dépôt n'est pas un conseil en investissement et son auteur n'est pas conseiller
financier. Les données proviennent de sources publiques automatisées et peuvent être
erronées, retardées ou manquantes. Vérifie le DIC de chaque ETF, son éligibilité PEA
et les informations de ton courtier avant tout ordre. Les projections reposent sur des
hypothèses de rendement moyen long terme et ne garantissent rien : un portefeuille
actions peut perdre plus de la moitié de sa valeur et mettre dix ans à s'en remettre.
