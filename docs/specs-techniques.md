# Specs Techniques — 1taff4me

## Stack Détaillée

### Runtime & Framework

```
Node.js >= 20 LTS
Next.js 14 (App Router, Server Components)
React 18
JavaScript ES2022+ (pas de TypeScript en v1)
```

### Base de Données

```
PostgreSQL 15+ (prod : Neon serverless)
Prisma ORM 5.x
```

Schéma Prisma :

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String        @id @default(cuid())
  email         String        @unique
  name          String?
  image         String?
  createdAt     DateTime      @default(now())
  applications  Application[]
  companies     WishlistCompany[]
  settings      UserSettings?
  accounts      Account[]
  sessions      Session[]
}

model Application {
  id               String    @id @default(cuid())
  userId           String
  user             User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  title            String
  companyName      String
  offerUrl         String?
  city             String?
  remote           Boolean   @default(false)
  contractType     String    // CDI, CDD, Alternance, Stage, Freelance
  salary           String?
  status           String    @default("wishlist") // wishlist|to_apply|applied|hr_interview|tech_interview|offer|rejected|abandoned
  contactName      String?
  contactEmail     String?
  contactLinkedin  String?
  notes            String?
  tags             String[]
  appliedAt        DateTime?
  reminderAt       DateTime?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
}

model WishlistCompany {
  id             String   @id @default(cuid())
  userId         String
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name           String
  website        String?
  domain         String?
  cities         String[]
  notes          String?
  contactLinkedin String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

model SearchCache {
  id        String   @id @default(cuid())
  city      String
  domain    String
  results   Json
  cachedAt  DateTime @default(now())

  @@unique([city, domain])
}

model UserSettings {
  id              String  @id @default(cuid())
  userId          String  @unique
  user            User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  reminderDays    Int     @default(7)
  emailReminders  Boolean @default(false)
}

// NextAuth models
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

---

## Routes API

### Candidatures

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/applications` | Liste toutes les candidatures de l'user |
| POST | `/api/applications` | Crée une candidature |
| PATCH | `/api/applications/[id]` | Met à jour (statut, champs…) |
| DELETE | `/api/applications/[id]` | Supprime |
| PATCH | `/api/applications/[id]/status` | Change statut (drag & drop Kanban) |

### Import d'offre

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/parse-offer` | Body: `{ url }` → retourne champs parsés |

**Logique parse-offer :**
```
1. Fetch HTML via node-fetch (server-side)
2. Si échec CORS/JS-render → Puppeteer headless
3. Cheerio parse : title, company, location, description
4. Normalisation des champs
5. Return { title, companyName, city, contractType, description }
```

Priorité parsers (par hostname) :
- `welcometothejungle.com` → sélecteurs dédiés
- `linkedin.com` → Puppeteer (SPA)
- `indeed.fr` → sélecteurs dédiés
- fallback → extraction OpenGraph tags (`og:title`, `og:description`)

### Recherche Géo-Métier

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/search?city=Paris&domain=Tech` | Recherche entreprises |

**Logique search :**
```
1. Check cache SearchCache (fraîcheur < 24h)
2. Si cache miss :
   a. Géocode la ville → lat/lng via api.adresse.data.gouv.fr
   b. Appel France Travail API /offres/search (filtres : commune, secteur)
   c. Appel Pappers API pour enrichir données entreprise
   d. Groupe les résultats par typeEntreprise
   e. Stocke en cache
3. Return résultats groupés
```

### Rappels

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/reminders/due` | Candidatures dont reminderAt <= now() |
| POST | `/api/reminders/send` | Déclenche envoi email (cron ou manuel) |

### Entreprises Wishlist

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/companies` | Liste wishlist |
| POST | `/api/companies` | Ajoute entreprise |
| PATCH | `/api/companies/[id]` | Met à jour |
| DELETE | `/api/companies/[id]` | Supprime |

---

## APIs Externes

### France Travail API (offres d'emploi)
- Endpoint : `https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search`
- Auth : OAuth2 client_credentials
- Paramètres clés : `commune` (code INSEE), `secteurActivite`, `typeContrat`
- Rate limit : 3 req/s, 1000 req/jour (plan gratuit)
- Env vars : `FRANCE_TRAVAIL_CLIENT_ID`, `FRANCE_TRAVAIL_CLIENT_SECRET`

### Pappers API (données entreprises FR)
- Endpoint : `https://api.pappers.fr/v2/entreprise`
- Auth : API key
- Données : SIREN, effectif, adresse, secteur NAF, statut juridique
- Plan gratuit : 100 req/mois → mettre en cache agressivement
- Env var : `PAPPERS_API_KEY`

### API Adresse (géocodage)
- Endpoint : `https://api-adresse.data.gouv.fr/search/`
- Pas d'auth requise
- Retourne : lat, lng, code INSEE commune

### Nominatim (fallback géocodage)
- Endpoint : `https://nominatim.openstreetmap.org/search`
- Pas d'auth, User-Agent requis
- Rate limit : 1 req/s

---

## Variables d'Environnement

```env
# Database
DATABASE_URL=postgresql://...

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...

# OAuth providers
GITHUB_ID=...
GITHUB_SECRET=...

# Email (magic link + rappels)
RESEND_API_KEY=...
EMAIL_FROM=noreply@1taff4me.com

# APIs emploi
FRANCE_TRAVAIL_CLIENT_ID=...
FRANCE_TRAVAIL_CLIENT_SECRET=...
PAPPERS_API_KEY=...
```

---

## Composants UI Clés

### KanbanBoard
```
- 7 colonnes (statuts)
- dnd-kit pour drag & drop
- Chaque carte : titre, entreprise, date, tags, badge rappel
- Clic sur carte → drawer/modal détail
```

### ApplicationCard
```
- Titre poste + entreprise
- Badge statut (couleur)
- Date candidature
- Tags pills
- Icône relance si reminderAt proche
- Actions rapides : éditer, archiver, voir offre
```

### SearchPanel
```
- Input ville avec autocomplétion (debounce 300ms)
- Select domaine (liste fixe v1)
- Résultats groupés par type entreprise
- Skeleton loading
- Bouton "Ajouter en wishlist" par résultat
```

### StatsPage
```
- KPIs cards : total, taux réponse, en cours, offres
- Recharts : BarChart par statut, LineChart timeline, PieChart par domaine
```

---

## Sécurité

- Toutes routes API protégées par session NextAuth (`getServerSession`)
- Validation inputs : zod côté serveur
- Pas d'exec user-input côté serveur
- URLs parsées via `new URL()` avant fetch (évite SSRF)
- Rate limiting `/api/parse-offer` : 10 req/min/user (upstash/ratelimit ou simple in-memory)
- Headers sécurité : `next.config.js` avec Content-Security-Policy

---

## Performances

- SearchCache : TTL 24h en base (évite quotas API)
- Server Components pour pages statiques/read-only
- `use client` uniquement Kanban, formulaires, carte
- Images entreprises : `next/image` avec `unoptimized` pour logos externes
- Pagination API : 20 résultats/page

---

## Déploiement

```
Vercel (Next.js natif)
  └── Neon PostgreSQL (serverless, plan free : 512MB)
  └── Resend (emails, plan free : 100 mails/jour)
  └── Domaine custom optionnel
```

CI/CD : push `main` → deploy Vercel automatique

---

## Dev Setup

```bash
# Installation
npm create next-app@latest 1taff4me --js --tailwind --app --no-src-dir
cd 1taff4me
npm install prisma @prisma/client next-auth @auth/prisma-adapter
npm install dnd-kit/core dnd-kit/sortable recharts leaflet react-leaflet
npm install cheerio node-fetch zod
npm install -D prisma

# Init DB
npx prisma init
npx prisma db push
npx prisma generate

# Dev
npm run dev
```
