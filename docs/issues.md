# Issues GitHub — 1taff4me

> Format : titre | labels | milestone | description courte

---

## Epic 0 — Setup

### #1 — Setup projet Next.js + Prisma + Auth
**Labels :** `setup` `backend`  
**Milestone :** v0.1

- `npx create-next-app` avec config JS + Tailwind + App Router
- Installer Prisma, NextAuth, shadcn/ui
- Schema Prisma initial (User, Account, Session, VerificationToken)
- `.env.example` documenté
- Layout racine (header, sidebar, footer)
- Config `next.config.js` (headers sécurité, domaines images)

**AC :** `npm run dev` fonctionne, auth GitHub opérationnelle, Prisma connecté à PostgreSQL local

---

### #2 — Mise en place CI/CD Vercel + Neon
**Labels :** `devops` `setup`  
**Milestone :** v0.1

- Créer projet Vercel lié au repo GitHub
- Provisionner base Neon PostgreSQL
- Variables d'env configurées dans Vercel
- Deploy automatique sur push `main`

**AC :** `main` branch deployée, migrations Prisma jouées en prod

---

## Epic 1 — Kanban Candidatures

### #3 — Modèle Application + CRUD API
**Labels :** `backend` `feature`  
**Milestone :** v0.2

- Modèle `Application` dans Prisma schema
- Routes API :
  - `GET /api/applications`
  - `POST /api/applications`
  - `PATCH /api/applications/[id]`
  - `DELETE /api/applications/[id]`
- Toutes routes vérifiées par session (getServerSession)
- Validation Zod côté serveur

**AC :** CRUD testé via curl/Postman, données persistées en base

---

### #4 — Vue Kanban (colonnes + cartes)
**Labels :** `frontend` `feature`  
**Milestone :** v0.2

- Composant `KanbanBoard` avec 7 colonnes
- Composant `ApplicationCard` (titre, entreprise, date, tags, badge statut)
- Fetch données via `GET /api/applications`
- Skeleton loading state
- Vue responsive (scroll horizontal mobile)

**AC :** Kanban affiche toutes les candidatures groupées par statut

---

### #5 — Drag & Drop Kanban
**Labels :** `frontend` `feature`  
**Milestone :** v0.2

- Intégration `@dnd-kit/core` + `@dnd-kit/sortable`
- Drag carte entre colonnes → `PATCH /api/applications/[id]/status`
- Optimistic update (UI avant réponse serveur)
- Animation fluide

**AC :** Glisser une carte change son statut en base sans rechargement

---

### #6 — Formulaire ajout/édition candidature
**Labels :** `frontend` `feature`  
**Milestone :** v0.2

- Drawer/modal avec formulaire complet
- Champs : titre, entreprise, URL offre, ville, remote, contrat, salaire, contact, notes, tags
- Validation client-side
- Mode ajout et mode édition

**AC :** Formulaire crée/édite une candidature, données sauvegardées

---

### #7 — Gestion des tags
**Labels :** `frontend` `feature`  
**Milestone :** v0.2

- Input tags avec autocomplétion sur tags existants de l'user
- Affichage pills colorées
- Filtre Kanban par tag

**AC :** Tags ajoutés, affichés, filtrables

---

## Epic 2 — Import d'Offre

### #8 — Route API parse-offer
**Labels :** `backend` `feature`  
**Milestone :** v0.3

- `POST /api/parse-offer` reçoit `{ url }`
- Validation URL via `new URL()` (SSRF protection)
- Rate limit 10 req/min/user
- Fetch HTML via `node-fetch`
- Parse avec Cheerio : OpenGraph + sélecteurs Welcome to the Jungle + Indeed
- Return `{ title, companyName, city, contractType, description }` ou `{ error }`

**AC :** URL WTTJ parsée retourne les bons champs, URL invalide retourne 400

---

### #9 — Fallback Puppeteer pour sites SPA
**Labels :** `backend` `feature`  
**Milestone :** v0.3

- Puppeteer headless si Cheerio retourne champs vides
- Timeout 10s max
- Sélecteurs dédiés LinkedIn
- Lambda-compatible (chromium-aws-lambda ou `@sparticuz/chromium`)

**AC :** URL LinkedIn parsée retourne titre + entreprise

---

### #10 — UI import offre par URL
**Labels :** `frontend` `feature`  
**Milestone :** v0.3

- Champ "Coller un lien d'offre" dans le formulaire candidature
- Bouton "Importer" → appel `/api/parse-offer`
- Loading spinner pendant fetch
- Pré-remplissage automatique des champs
- Toast succès/erreur

**AC :** Coller une URL WTTJ → formulaire pré-rempli en < 5s

---

## Epic 3 — Recherche Géo-Métier

### #11 — Intégration API Adresse + géocodage
**Labels :** `backend` `feature`  
**Milestone :** v0.4

- Fonction `geocodeCity(cityName)` → `{ lat, lng, inseeCode }`
- Appel `api-adresse.data.gouv.fr`
- Fallback Nominatim si pas de résultat
- Cache résultat en mémoire (Map JS, TTL 1h)

**AC :** "Paris" retourne `{ lat: 48.8566, lng: 2.3522, inseeCode: "75056" }`

---

### #12 — Intégration France Travail API
**Labels :** `backend` `feature`  
**Milestone :** v0.4

- OAuth2 client_credentials pour token France Travail
- Fonction `searchOffres({ inseeCode, domain, contractType })`
- Mapping domaine UI → code ROME / secteur NAF
- Pagination (20 résultats/appel)
- Gestion token expiry (refresh auto)

**AC :** Recherche "Paris + Tech" retourne liste d'offres avec entreprises

---

### #13 — Enrichissement Pappers API
**Labels :** `backend` `feature`  
**Milestone :** v0.4

- Fonction `enrichCompany(siret)` → données légales (effectif, statut juridique, adresse)
- Mapping France Travail `siret` → Pappers
- Cache en base `SearchCache` (TTL 7 jours pour données Pappers)
- Groupement par type entreprise : Startup (< 50 sal.), PME, ETI, Grand groupe, ESN, Cabinet

**AC :** Résultats enrichis avec taille et type d'entreprise

---

### #14 — Route API search + cache 24h
**Labels :** `backend` `feature`  
**Milestone :** v0.4

- `GET /api/search?city=Paris&domain=Tech`
- Check `SearchCache` (ville + domaine, < 24h)
- Si miss : géocode → France Travail → enrichissement Pappers → groupe → cache
- Return structure : `{ groups: [{ type, companies: [...] }] }`

**AC :** Même requête < 24h retourne cache, pas d'appel API externe

---

### #15 — UI Recherche Géo-Métier
**Labels :** `frontend` `feature`  
**Milestone :** v0.4

- Page `/search`
- Input ville avec autocomplétion (debounce 300ms, API Adresse)
- Select domaine (liste : Tech, Finance, Santé, RH, Marketing, Commerce, Industrie, Conseil)
- Filtres : type contrat, taille entreprise, remote
- Résultats groupés par type d'entreprise (accordéon ou sections)
- Chaque résultat : nom, adresse locale, lien offre, bouton "Ajouter candidature" / "Wishlist"
- Skeleton loading + état vide

**AC :** Recherche "Lyon + Tech" affiche résultats groupés en < 3s

---

## Epic 4 — Rappels de Relance

### #16 — Champ reminderAt + logique due
**Labels :** `backend` `feature`  
**Milestone :** v0.5

- Champ `reminderAt` dans Application (date calculée = appliedAt + reminderDays)
- Route `GET /api/reminders/due` → candidatures dues (reminderAt <= now, statut "applied")
- Paramètre user settings : `reminderDays` (défaut 7)

**AC :** Candidature postulée depuis 8j apparaît dans `/api/reminders/due`

---

### #17 — Badge + vue "À relancer"
**Labels :** `frontend` `feature`  
**Milestone :** v0.5

- Badge rouge sur icône sidebar si rappels dus
- Section "À relancer aujourd'hui" en haut du dashboard
- Carte cliquable → ouvre la candidature
- Bouton "Relancé" → réinitialise reminderAt + X jours

**AC :** Badge visible, clic "Relancé" reporte le rappel

---

### #18 — Envoi email de rappel (optionnel user)
**Labels :** `backend` `feature`  
**Milestone :** v0.5

- Intégration Resend API
- Template email minimal : entreprise, poste, lien offre, lien app
- Cron Vercel (`vercel.json`) → `POST /api/reminders/send` chaque matin 8h
- Opt-in dans settings user

**AC :** Email reçu le lendemain si rappel dû et opt-in activé

---

## Epic 5 — Dashboard Stats

### #19 — Calcul métriques
**Labels :** `backend` `feature`  
**Milestone :** v0.6

- Route `GET /api/stats` → agrégats Prisma
- Métriques : count par statut, taux réponse, durée moyenne par étape, count par domaine/ville/contrat
- Prisma `groupBy` + `count` + `_avg`

**AC :** `/api/stats` retourne toutes les métriques en < 500ms

---

### #20 — UI Dashboard Stats
**Labels :** `frontend` `feature`  
**Milestone :** v0.6

- Page `/dashboard/stats`
- 4 KPI cards (total, taux réponse, en cours, offres reçues)
- BarChart candidatures par statut (Recharts)
- LineChart timeline candidatures/mois
- PieChart par domaine
- Responsive

**AC :** Graphiques s'affichent correctement avec données réelles

---

## Epic 6 — Carte Géographique

### #21 — Intégration Leaflet + marqueurs candidatures
**Labels :** `frontend` `feature`  
**Milestone :** v0.7

- Page `/map`
- Carte Leaflet.js (OpenStreetMap tiles)
- Géocodage des villes des candidatures (lazy, au survol ou chargement)
- Marqueurs colorés par statut
- MarkerCluster si zoom out
- Popup au clic : titre, entreprise, statut, lien

**AC :** Carte affiche toutes les candidatures avec villes renseignées

---

### #22 — Overlay résultats recherche sur carte
**Labels :** `frontend` `feature`  
**Milestone :** v0.7

- Depuis page `/search`, bouton "Voir sur la carte"
- Marqueurs entreprises résultats en couleur différente
- Zoom automatique sur la zone de recherche

**AC :** Résultats de recherche visibles sur carte après navigation

---

## Epic 7 — Polish & Prod

### #23 — Wishlist entreprises UI
**Labels :** `frontend` `feature`  
**Milestone :** v1.0

- Page `/companies`
- Liste + formulaire ajout/édition entreprise cible
- Depuis résultats recherche : bouton "Ajouter à la wishlist"
- Depuis Kanban : colonne "Wishlist" utilise ce modèle

**AC :** CRUD wishlist fonctionnel, lien avec résultats recherche

---

### #24 — Settings utilisateur
**Labels :** `frontend` `backend` `feature`  
**Milestone :** v1.0

- Page `/settings`
- Modifier : reminderDays, opt-in email, domaines favoris, villes favorites
- Danger zone : supprimer compte + toutes données

**AC :** Settings sauvegardés, suppression compte efface toutes les données (cascade)

---

### #25 — Optimisations performance
**Labels :** `performance`  
**Milestone :** v1.0

- Audit Core Web Vitals (Lighthouse)
- Lazy load composants carte et charts
- Pagination Kanban si > 50 candidatures
- Vérifier index Prisma (`@@index` sur userId, status, reminderAt)

**AC :** LCP < 2.5s, pas de layout shift sur Kanban

---

### #26 — Audit sécurité
**Labels :** `security`  
**Milestone :** v1.0

- Review SSRF protection sur parse-offer
- Headers CSP dans `next.config.js`
- Vérifier toutes routes API protégées par session
- Pas de données user exposées dans les Server Components d'autres users
- Test : user A ne peut pas accéder aux candidatures de user B

**AC :** Aucune route accessible sans auth, pas de fuite inter-users

---

## Backlog (post v1.0)

| # | Titre | Notes |
|---|-------|-------|
| #27 | Export CSV candidatures | Simple `json2csv` |
| #28 | Mode sombre | Tailwind dark mode |
| #29 | Import CSV candidatures | Bootstrap depuis export LinkedIn/Indeed |
| #30 | Scoring CV vs offre (IA) | Claude API, analyse matching |
| #31 | Extension navigateur | Bouton "Ajouter" sur pages d'offres |
| #32 | Notifications push Web | Service Worker |
| #33 | TypeScript migration | v2.0 |
| #34 | Multi-utilisateurs / partage | Candidatures partagées en équipe |
