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
| **Mon mois** | Saisie manuelle par catégorie, reprise en un clic du mois précédent, clôture avec ressenti |
| **Quêtes** | Défis quotidiens, hebdomadaires, mensuels et annuels ; multiplicateur de série |
| **Objectifs** | Objectifs chiffrés et datés, poches d'épargne, simulateurs de fonds d'urgence et de projection |
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
node scripts/smoke.mjs  # parcours automatisé des écrans + captures
```

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

## Design

Palette et vocabulaire visuel dérivés d'une infographie d'épargne fournie par l'utilisateur : papier
crème, vert sauge, or doux, terracotta. La mascotte est un dessin SVG paramétré par le palier
atteint : elle passe du grain à la canopée en douze étapes, sans aucune image bitmap.

## Feuille de route

Voir [`docs/feuille-de-route.md`](docs/feuille-de-route.md).
