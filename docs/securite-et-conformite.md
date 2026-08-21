# Sécurité et conformité

Ce document fixe le cadre que Budgette s'impose. Il vaut engagement de conception : chaque décision
technique des phases suivantes doit pouvoir s'y rattacher.

L'application traite des données financières personnelles pour un public français et européen. Ce
sont des données sensibles au sens commun — elles révèlent le train de vie, la santé financière,
parfois les difficultés — même si elles ne relèvent pas des catégories particulières de l'article 9
du RGPD.

## 1. Périmètre réglementaire

### DSP2 — pourquoi Budgette en reste dehors

La directive sur les services de paiement encadre l'accès aux comptes bancaires par un tiers. Un
service qui agrège des comptes doit être agréé prestataire de services d'information sur les comptes
et immatriculé auprès de l'ACPR.

Budgette ne se connecte à aucune banque. L'utilisateur saisit lui-même des montants agrégés par
catégorie. Aucun identifiant bancaire, aucun IBAN, aucun numéro de carte n'est demandé ni stocké.
Le service reste donc un outil de suivi personnel, hors du champ de la DSP2.

**Conséquence contraignante :** toute évolution vers l'import automatique ou la connexion bancaire
change la nature juridique du produit et impose une analyse préalable. Un import de relevés fournis
manuellement par l'utilisateur ne relève pas de la DSP2, mais impose un traitement local ou
éphémère et le masquage immédiat des identifiants bancaires.

### Conseil en investissement — la ligne à ne pas franchir

Le statut de conseiller en investissements financiers est réglementé. Budgette produit des repères
budgétaires (taux d'épargne, poids des charges, effort mensuel nécessaire) et des simulations à taux
zéro. Il ne recommande aucun produit, ne cite aucun placement, ne promet aucun rendement.

Chaque écran comportant une simulation porte une mention explicite en ce sens.

### RGPD

| Traitement | Finalité | Base légale | Conservation |
| --- | --- | --- | --- |
| Gestion des comptes | Créer et sécuriser l'accès | Exécution du contrat (art. 6.1.b) | Durée du compte, puis 30 jours |
| Suivi budgétaire | Enregistrer les saisies, produire les analyses | Exécution du contrat (art. 6.1.b) | Durée du compte |
| Gamification | Attribuer expérience, badges et séries | Exécution du contrat (art. 6.1.b) | Durée du compte |
| Mesure d'audience | Améliorer le produit | Consentement (art. 6.1.a), désactivé par défaut | 13 mois |
| Journal d'audit | Sécurité et traçabilité des actions d'administration | Intérêt légitime (art. 6.1.f) | 12 mois |

Principes retenus :

- **Minimisation.** Aucune donnée qui ne serve directement une fonctionnalité. Pas de date de
  naissance, pas d'adresse postale, pas de numéro de téléphone.
- **Localisation.** Hébergement dans l'Union européenne (région `eu-west-1`), pas de transfert hors UE.
- **Portabilité et effacement.** Export intégral au format ouvert et suppression définitive, tous
  deux déclenchables par l'utilisateur, traités sous un mois au maximum.
- **Transparence.** Le registre des traitements est visible dans l'application elle-même, pas
  seulement dans une politique de confidentialité que personne ne lit.
- **Sécurité dès la conception** (art. 25) et par défaut : la mesure d'audience est désactivée tant
  que l'utilisateur ne l'active pas.

Une analyse d'impact au sens de l'article 35 n'est pas obligatoire à ce stade : le traitement n'est
ni systématique à grande échelle sur des données de l'article 9, ni fondé sur un profilage produisant
des effets juridiques. Elle devra être conduite si le produit ajoute un jour du scoring, de la
décision automatisée, ou un import bancaire.

## 2. Architecture de sécurité prévue

### Authentification

- Supabase Auth, mots de passe hachés avec bcrypt côté service, jamais manipulés par l'application.
- Vérification de l'adresse e-mail obligatoire avant tout accès aux données.
- Double authentification par application d'authentification (TOTP), proposée à l'inscription et
  imposée aux comptes disposant du rôle administrateur.
- Sessions à durée limitée, jetons de rafraîchissement rotatifs, révocation de toutes les sessions
  depuis le profil.
- Limitation du nombre de tentatives de connexion par adresse et par compte.
- Refus des mots de passe figurant dans les listes de compromission connues.

### Autorisation

- **Row Level Security activée sur chaque table, sans exception**, avec une politique par défaut qui
  refuse tout. Une table sans politique explicite est inaccessible, pas ouverte.
- Le rôle administrateur est porté par une table dédiée, jamais par un champ modifiable depuis le
  client, et vérifié côté serveur à chaque requête sensible.
- **La console d'administration ne donne jamais accès aux données budgétaires d'un utilisateur.**
  Elle expose des agrégats, jamais des montants nominatifs. C'est une règle produit autant qu'une
  règle de sécurité.
- La clé `service_role` ne quitte jamais le serveur : elle n'apparaît dans aucun paquet livré au
  navigateur.

### Surface d'attaque applicative

| Risque | Réponse |
| --- | --- |
| Injection SQL | Requêtes paramétrées via le client Supabase ; aucune construction de requête par concaténation |
| XSS | React échappe par défaut ; `dangerouslySetInnerHTML` proscrit ; politique de sécurité de contenu stricte |
| CSRF | Jetons portés par en-tête `Authorization`, pas par cookie de session ambiant |
| Élévation de privilège | Rôle vérifié côté serveur ; RLS indépendante de l'interface |
| Énumération de comptes | Réponses indifférenciées sur les formulaires de connexion et de récupération |
| Déni de service | Limitation de débit par adresse IP et par compte sur les points d'entrée coûteux |
| Fuite par les journaux | Aucun montant ni identifiant dans les journaux applicatifs |
| Dépendances vulnérables | `npm audit` en intégration continue ; mises à jour de sécurité traitées en priorité |

### En-têtes et transport

- HTTPS strict, HSTS avec préchargement.
- `Content-Security-Policy` restrictive, sans `unsafe-inline` sur les scripts.
- `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy` fermant les capteurs, la caméra et la géolocalisation.

### Chiffrement

- Chiffrement au repos assuré par la plateforme sur l'ensemble de la base.
- Sauvegardes chiffrées, restauration testée.
- Aucun secret dans le dépôt : variables d'environnement, et rotation documentée.

## 3. Éthique du produit

Une application de budget touche à un sujet chargé de honte et d'anxiété. Trois règles en découlent.

**Ne jamais punir.** Rater un défi ne retire pas d'expérience. Un mois à découvert ne fait pas
régresser le jardin. La progression enregistre les efforts, pas les échecs.

**Ne jamais comparer aux autres.** Pas de classement public, pas de moyenne du voisin. La seule
comparaison proposée est celle de l'utilisateur avec son propre passé. Un classement public est
d'ailleurs incompatible avec la minimisation des données : le drapeau existe dans la console
d'administration, désactivé et documenté comme tel.

**Ne jamais inciter à la dépense.** Aucun partenariat commercial, aucun placement de produit,
aucune notification qui pousse à consommer. Les mécaniques de jeu servent l'habitude de suivi, pas
l'engagement pour lui-même : pas de série qu'on perd pour une journée d'absence au point de créer de
l'anxiété, pas de récompense conditionnée à une dépense.

## 4. Ce qui reste à faire

- [ ] Politique de confidentialité et conditions générales d'utilisation rédigées
- [ ] Registre des traitements formalisé hors application
- [ ] Mise en place effective de la RLS avec tests automatisés de non-régression
- [ ] Double authentification imposée aux comptes administrateurs
- [ ] Procédure documentée de réponse à une violation de données (notification sous 72 heures)
- [ ] Revue de sécurité complète avant toute ouverture au public
