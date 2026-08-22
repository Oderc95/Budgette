# Budgette

Un coach budgétaire ludique, en français : vous déclarez un objectif, l'application adapte la
stratégie, et une progression sans fin transforme la discipline budgétaire en habitude tenable.

> **Phase en cours : prototype d'interface.** Toutes les données affichées sont fictives et
> l'authentification est simulée. Le socle Supabase (authentification, base de données, RLS) arrive
> à la phase suivante.

## Ce que fait l'application

| Écran | Rôle |
| --- | --- |
| **Accueil** | Reste à vivre, reste en fin de mois, répartition du revenu, score de santé budgétaire, analyses commentées, trajectoire sur les mois saisis |
| **Mon mois** | Saisie par catégorie, étiquettes libres, dépenses ponctuelles, comparaison au mois de référence, clôture avec ressenti |
| **Quêtes** | Défis quotidiens, hebdomadaires, mensuels et annuels ; multiplicateur de série |
| **Objectifs** | Objectifs chiffrés et datés, poches d'épargne, simulateurs — et la dimension sociale : groupes autour d'un objectif commun avec un administrateur, amis cherchés par pseudo unique |
| **Jardin** | Niveaux, douze paliers de croissance, badges, saisons trimestrielles |
| **Profil** | Thème, stratégie, droits RGPD, périmètre de traitement |
| **Admin** | Indicateurs agrégés, comptes, activation de fonctionnalités, journal d'audit, registre des traitements |

### La segmentation budgétaire

Reprise du classeur de suivi de l'utilisateur, en cinq flux :

```
Revenus − Charges contraintes − Dettes            = Reste à vivre
Reste à vivre − Épargne − Dépenses plaisir        = Reste en fin de mois
```

C'est cette découpe qui rend les arbitrages lisibles : les charges contraintes ne se négocient pas
dans le mois, l'épargne se décide avant les plaisirs, et le reste en fin de mois est le seul chiffre
qui dit si le mois a tenu.

## Ce que l'application ne fait pas, volontairement

- **Aucune connexion bancaire.** Pas d'agrégation, pas de scraping, aucun identifiant bancaire
  demandé ou stocké. Le service reste donc hors du champ de la DSP2 et ne requiert aucun agrément
  de prestataire de services d'information sur les comptes.
- **Aucun conseil en investissement.** Les simulateurs calculent un effort d'épargne à taux zéro.
  Aucune recommandation de produit financier n'est formulée, ce qui écarte le statut de conseiller
  en investissements financiers.
- **Aucune revente de données, aucun profilage publicitaire.**

Le détail figure dans [`docs/securite-et-conformite.md`](docs/securite-et-conformite.md).

## Démarrer

```bash
npm install
npm run dev          # serveur de développement
npm run typecheck    # vérification des types
npm run build        # SPA prêt à héberger, dans dist/
npm run build:artifact  # fichier HTML autonome, dans dist-artifact/
node scripts/smoke.mjs  # parcours des écrans, captures, contrôle du responsive
node scripts/verifier-donnees.mjs  # cohérence du jeu de démonstration
```

## Hébergement

Le site est publié sur <https://oderc95.github.io/Budgette/> par
`.github/workflows/pages.yml`, à chaque push sur `main`. Les propositions de modification passent
par le même workflow, qui s'arrête après les vérifications sans rien publier.

Le routage passe par `HashRouter` et les assets par `base: './'`, donc aucune réécriture d'URL n'est
demandée à l'hébergeur : les fichiers de `dist/` suffisent tels quels.

Pour activer la publication une première fois : **Settings → Pages → Source : GitHub Actions**.

## Architecture

```
src/
  domain/        Modèle métier, sans dépendance à React
    types.ts         Types du domaine
    categories.ts    Catalogue de catégories, dérivé du classeur Excel
    budget.ts        Calculs : totaux, reste à vivre, score de santé, projections
    strategy.ts      Objectifs et stratégies de répartition associées
    challenges.ts    Catalogue de défis et de badges
    gamification.ts  Courbe de niveaux, paliers, saisons, multiplicateurs
    insights.ts      Analyses commentées affichées à l'utilisateur
  store/         État applicatif (Zustand), persisté localement
  components/    Design system et composants partagés
  screens/       Un fichier par écran
  data/mock.ts   Jeu de démonstration
```

Le dossier `domain/` ne connaît ni React ni Supabase : la même logique servira côté serveur pour
revalider les calculs sensibles, et pourra être réutilisée telle quelle par une application mobile.

### Choix techniques

- **Vite + React + TypeScript** plutôt qu'un cadre serveur : l'application vit entièrement derrière
  authentification, donc le rendu serveur n'apporte rien, et la compilation en fichier unique permet
  de partager un prototype cliquable à chaque itération.
- **Tailwind v4** avec des jetons de design en variables CSS : un seul endroit définit la palette,
  et le thème sombre se limite à une redéfinition de ces variables.
- **Zustand** avec persistance tolérante aux pannes : en navigation privée, l'accès au stockage
  local peut lever une exception ; l'application continue alors de fonctionner sans persistance.

## Le jeu de démonstration

Le profil est celui de Camille Roussel, 31 ans, graphiste salariée à Nantes. Rien n'est repris d'un
relevé réel : les montants sont construits pour raconter une trajectoire que l'interface doit savoir
montrer — janvier dans le rouge, découvert éteint en mars, 430 € de soins dentaires en mai,
augmentation en juin, crédit soldé en juillet, et un mois d'août sans aucune dette.

Ces données sont lues par des écrans qui en dérivent chacun leurs propres chiffres. Une incohérence
entre eux ne casse rien : elle affiche deux montants différents pour la même chose, ce qui ne se voit
qu'à la lecture attentive. `scripts/verifier-donnees.mjs` recharge donc le jeu avec les vraies
fonctions du domaine et vérifie les liens qu'aucun type n'exprime — versements des poches contre
lignes d'épargne, avancement des objectifs contre solde des poches, XP contre niveau annoncé,
comptes du journal d'audit contre liste des comptes.

## Design

Palette « Verger au couchant » : un fond chaud — crème abricotée en clair, aubergine profond en
sombre — et six accents saturés répartis sur la roue chromatique, calés sur une luminosité et une
saturation voisines pour cohabiter sans se battre. La mandarine porte l'identité et tous les états
d'interface (sélection, onglet actif, action principale) ; les cinq autres teintes sont
sémantiques et ne servent qu'à ça : menthe pour les revenus et le positif, indigo pour les charges
contraintes, framboise pour les dettes, ambre pour l'épargne, orchidée pour les dépenses plaisir.

La mascotte est un dessin SVG paramétré par le palier atteint : elle passe du grain à la canopée en
douze étapes, sans aucune image bitmap.

La marque reprend la même image : une pousse qui sort d'une pièce. Elle vit dans
`src/components/Logo.tsx`, et le même dessin est repris en dur dans `public/favicon.svg` — une
favicon est chargée hors du document, où les variables de thème n'existent pas.

Les halos colorés du fond sont ancrés loin hors du cadre et recouverts d'un voile qui ramène le
centre de la page à la couleur de fond : la couleur ne subsiste qu'aux bords, et aucun texte ne se
lit par-dessus une tache.

### Le fond est peint sur `#root`, pas seulement sur `body`

Certains hôtes injectent leur propre réinitialisation CSS *après* la feuille de style de la page et
écrasent le fond du document. La page affiche alors le texte d'un thème sur le fond de l'autre —
illisible. Le fond est donc peint sur le conteneur de l'application, que rien d'extérieur ne cible.

### Animation

L'animation est portée par les composants de base plutôt que répétée écran par écran : les cartes,
les barres de progression et les jauges se révèlent à l'entrée dans le champ de vision, les chiffres
importants défilent jusqu'à leur valeur, et les halos de fond dérivent lentement. Tout se coupe
automatiquement si le système demande de réduire les mouvements.

## Feuille de route

Voir [`docs/feuille-de-route.md`](docs/feuille-de-route.md).
