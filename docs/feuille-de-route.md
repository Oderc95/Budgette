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
- [x] Application web installable, utilisable hors ligne

## Phase 6 — Mobile

Le dossier `domain/` étant indépendant de React, la logique métier se transporte telle quelle.

L'application installable a été livrée par avance, en même temps que la passe de confort tactile :
elle ne coûtait presque rien à ce stade, et elle permet de juger l'ergonomie sur un vrai téléphone
sans attendre le reste. Elle ne préempte aucune décision — manifeste, service worker et cibles
d'appui servent autant un portage Capacitor qu'un portage React Native.

Le portage Capacitor a été mis en place pour rendre l'application essayable sur un vrai téléphone,
sous forme d'APK construit par GitHub Actions. C'est un emballage du build web : il n'ajoute aucune
logique et ne ferme pas la porte à un portage React Native ultérieur.

Reste à faire après la phase 5 :

- [x] Emballage Capacitor du build web, APK construit en intégration continue
- [ ] Écran de démarrage et icônes affinés pour Android
- [ ] Clé de signature de release, conservée hors du dépôt
- [ ] Publication sur le Play Store — compte Google Developer déjà ouvert
- [ ] Persistance native, en remplacement du stockage du navigateur, pour que le système ne
      puisse pas purger les données sous pression mémoire

La publication attend délibérément la phase 5 : le Play Store exige une politique de
confidentialité, un formulaire « sécurité des données » et une suppression de compte
fonctionnelle, qui en font partie. Publier avant reviendrait à livrer un prototype à données
fictives, et à s'imposer le rythme des revues du store pendant que le produit bouge encore.

## Écarté pour l'instant

- **Import de relevés PDF.** La saisie manuelle a été retenue : elle évite tout traitement de
  document bancaire et garde le produit hors du champ de la DSP2. Le drapeau de fonctionnalité
  existe dans la console d'administration, désactivé.
- **Classement public.** Incompatible avec la minimisation des données et avec le parti pris de ne
  jamais comparer les utilisateurs entre eux.
