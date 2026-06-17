# Cahier des Charges — 1taff4me

## 1. Contexte & Objectif

Application web d'aide à la recherche d'emploi et de suivi de candidatures, entièrement en JavaScript. Destinée à un usage personnel ou petit collectif. Permet de cibler des entreprises par localisation + domaine, et de piloter son pipeline de candidatures.

---

## 2. Utilisateurs Cibles

- Chercheurs d'emploi actifs
- Profils tech et non-tech
- Usage solo, pas de multi-tenant dans la v1

---

## 3. Fonctionnalités

### 3.1 Recherche Géo-Métier (Feature #1)

**Description :** L'utilisateur saisit une ville et sélectionne un domaine. L'appli retourne les entreprises ayant un siège ou une équipe présente dans cette ville, regroupées par type d'entreprise.

**Détail :**
- Champ de recherche ville avec autocomplétion (API Nominatim / Géo API gouvernementale)
- Sélecteur de domaine (ex : Tech, Finance, Santé, Marketing, RH…)
- Résultats groupés par type d'entreprise (Startup, ETI, Grand groupe, ESN, Cabinet…)
- Chaque résultat affiche : nom, logo, adresse du site local, lien LinkedIn/site officiel, secteur précis
- Source de données : France Travail API (offres publiées) + base Pappers API (données entreprises FR) + scraping optionnel
- Filtres additionnels : taille entreprise, type de contrat (CDI/CDD/Alternance/Stage), télétravail

**Critères d'acceptation :**
- Résultats en < 2s
- Regroupement par type visible
- Lien vers les offres actives quand disponible

---

### 3.2 Suivi de Candidatures (Feature #2)

**Description :** Tableau de bord Kanban pour piloter toutes ses candidatures.

**Colonnes Kanban :**
1. Wishlist (entreprises cibles sans offre trouvée)
2. À postuler
3. Postulé
4. Entretien RH
5. Entretien Technique
6. Offre reçue
7. Refus / Abandonné

**Champs par candidature :**
- Titre du poste
- Nom de l'entreprise
- Lien de l'offre (URL)
- Ville / Remote
- Date de candidature
- Salaire proposé / attendu
- Type de contrat
- Contact recruteur (nom, email, LinkedIn)
- Notes libres
- Statut (= colonne Kanban)
- Tags (ex: #python, #remote, #urgent)

**Actions :**
- Import d'offre par URL (parse automatique titre + entreprise + lieu)
- Glisser-déposer entre colonnes
- Archiver une candidature
- Rappel de relance configurable (ex: relancer si pas de réponse après 7j)

---

### 3.3 Import d'Offre par URL

**Description :** L'utilisateur colle un lien d'offre (LinkedIn, Welcome to the Jungle, Indeed, site entreprise). L'appli extrait automatiquement les champs disponibles (titre, entreprise, lieu, description).

**Fonctionnement :**
- Route API `/api/parse-offer` reçoit une URL
- Fetch HTML côté serveur (Next.js API route)
- Parsing avec Cheerio ou Puppeteer pour sites SPA
- Pré-remplissage du formulaire de candidature
- Fallback : formulaire manuel si parsing échoue

---

### 3.4 Rappels de Relance

**Description :** Notifications in-app (et optionnellement email) pour relancer une candidature sans réponse.

**Fonctionnement :**
- L'utilisateur configure un délai par défaut (ex: 7 jours)
- Si candidature en état "Postulé" depuis X jours → badge + notification
- Vue "À relancer aujourd'hui" dans le dashboard

---

### 3.5 Dashboard Statistiques

**Description :** Vue analytique du pipeline de candidatures.

**Métriques :**
- Nombre de candidatures par statut
- Taux de réponse (réponses / candidatures envoyées)
- Taux de passage entretien
- Durée moyenne par étape
- Candidatures par domaine / ville / type de contrat
- Graphique timeline des candidatures

---

### 3.6 Carte Géographique

**Description :** Visualisation des entreprises ciblées / candidatures sur une carte interactive.

**Fonctionnement :**
- Carte Leaflet.js (OpenStreetMap)
- Marqueurs colorés par statut de candidature
- Cluster de marqueurs si zoom out
- Clic sur marqueur → fiche entreprise / candidature

---

### 3.7 Wishlist Entreprises

**Description :** Sauvegarder des entreprises cibles avant même d'avoir une offre spécifique.

**Champs :**
- Nom entreprise
- Site web
- Domaine
- Ville(s) d'intérêt
- Notes
- Contact identifié (LinkedIn)

---

## 4. Stack Technique

| Couche | Choix |
|--------|-------|
| Framework | Next.js 14 (App Router) |
| UI | React + Tailwind CSS + shadcn/ui |
| Base de données | PostgreSQL via Prisma ORM |
| Auth | NextAuth.js (GitHub OAuth + email magic link) |
| Scraping/parsing | Cheerio + Puppeteer (headless) |
| Carte | Leaflet.js |
| Notifications | Web Notifications API + Resend (email) |
| API emploi | France Travail API (offres) |
| API entreprises | Pappers API (données légales FR) |
| Géocodage | API Adresse gouv.fr (adresse.data.gouv.fr) |
| Drag & drop Kanban | dnd-kit |
| Charts | Recharts |
| Déploiement | Vercel + Neon (PostgreSQL serverless) |

**Contrainte : JavaScript exclusivement** (pas de TypeScript en v1, évaluation en v2)

---

## 5. Architecture

```
1taff4me/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Pages auth
│   ├── dashboard/          # Kanban + stats
│   ├── search/             # Recherche géo-métier
│   ├── map/                # Carte
│   └── api/                # Routes API
│       ├── parse-offer/
│       ├── search-companies/
│       ├── applications/
│       └── reminders/
├── components/             # Composants React
├── lib/                    # Utilitaires, Prisma client
├── prisma/                 # Schema + migrations
└── docs/                   # Ce dossier
```

---

## 6. Modèle de Données (résumé)

**User** → possède plusieurs **Application** et **Company (wishlist)**

**Application** :
- id, userId, title, companyName, offerUrl, city, contractType, salary, status, contactName, contactEmail, contactLinkedin, notes, tags[], appliedAt, reminderAt, createdAt

**Company (wishlist)** :
- id, userId, name, website, domain, cities[], notes, contactLinkedin, createdAt

**SearchResult (cache)** :
- id, city, domain, results (JSON), cachedAt

---

## 7. Contraintes & Non-objectifs v1

**Contraintes :**
- Single-user ou petit groupe (pas de SaaS multi-tenant)
- Données FR en priorité (APIs françaises)
- Respect RGPD : données stockées chez l'utilisateur, pas de revente

**Hors scope v1 :**
- Application mobile native
- IA de matching CV/offre
- Génération de lettre de motivation
- Intégration ATS (Greenhouse, Lever…)

---

## 8. Livrables

| Version | Contenu |
|---------|---------|
| v0.1 | Setup Next.js + Prisma + Auth + layout de base |
| v0.2 | Kanban candidatures CRUD + drag & drop |
| v0.3 | Import offre par URL |
| v0.4 | Recherche géo-métier (France Travail API) |
| v0.5 | Rappels de relance |
| v0.6 | Dashboard stats + graphiques |
| v0.7 | Carte géographique |
| v1.0 | Polish UI + déploiement Vercel |
