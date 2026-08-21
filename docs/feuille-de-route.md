# Feuille de route

## Phase 1 — Prototype d'interface *(livrée)*

Application navigable, jeu de démonstration entièrement fictif, authentification simulée.
Objectif : valider l'ergonomie et le ton avant d'écrire la moindre migration de base de données.

- [x] Design system botanique, thèmes clair et sombre
- [x] Modèle de domaine et moteur de calcul budgétaire
- [x] Moteur de stratégie piloté par l'objectif déclaré
- [x] Moteur de gamification : niveaux, paliers, saisons, défis, badges
- [x] Sept écrans, dont la console d'administration
- [x] Parcours automatisé en navigateur, sans erreur console

## Phase 2 — Socle Supabase

- [ ] Schéma relationnel et migrations versionnées
- [ ] Row Level Security sur chaque table, politique par défaut en refus
- [ ] Supabase Auth : vérification d'adresse, double authentification, sessions révocables
- [ ] Rôle administrateur porté par une table dédiée
- [ ] Tests automatisés d'isolation entre comptes
- [ ] Remplacement du magasin local par les données réelles

## Phase 3 — Moteur de gamification côté serveur

- [ ] Validation des défis et attribution d'expérience côté serveur, non falsifiables
- [ ] Calcul des séries et des saisons par tâche planifiée
- [ ] Déblocage des badges sur événements de base de données

## Phase 4 — Rituel de fin de mois

- [ ] Rappel de clôture, avec consentement explicite pour la notification
- [ ] Bilan mensuel : ce qui a changé, ce qui a été débloqué, ce qui attend
- [ ] Report automatique des charges fixes vers le mois suivant

## Phase 5 — Ouverture

- [ ] Politique de confidentialité, conditions générales, mentions légales
- [ ] Export et suppression de compte réellement branchés
- [ ] Revue de sécurité complète
- [ ] Application web installable, utilisable hors ligne

## Phase 6 — Mobile

Le dossier `domain/` étant indépendant de React, la logique métier se transporte telle quelle.
Décision à prendre entre une application installable enrichie et un portage React Native.

## Écarté pour l'instant

- **Import de relevés PDF.** La saisie manuelle a été retenue : elle évite tout traitement de
  document bancaire et garde le produit hors du champ de la DSP2. Le drapeau de fonctionnalité
  existe dans la console d'administration, désactivé.
- **Classement public.** Incompatible avec la minimisation des données et avec le parti pris de ne
  jamais comparer les utilisateurs entre eux.
