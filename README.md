# Papyrus

Search research papers by topic (or upload one directly) and get a step-by-step,
runnable implementation notebook generated from it. Every generation is saved
as a revisitable session tied to your account.

## Stack

- **Next.js 15** (App Router, TypeScript, Tailwind) — frontend + API routes
- **Clerk** — authentication
- **Convex** — realtime database (sessions, notebook cells, users)
- **Semantic Scholar + arXiv** — free paper search APIs
- **Gemini 3.5 Flash** (free tier) — notebook generation

## Project structure

```
src/
  app/
    (auth)/sign-in, sign-up        Clerk auth pages
    (app)/dashboard, search,       Authenticated routes (shared Navbar layout)
          upload, sessions/[id]
    api/                           Server routes: search, generate, download
  components/
    ui/                            Reusable primitives (Button, Card, Input)
    layout/                        Navbar
    papers/                        PaperCard (search results)
    notebook/                      NotebookCell, NotebookViewer, SessionListItem
    providers/                     ConvexClientProvider
  lib/
    api/                           arxiv.ts, semanticScholar.ts, paperSearch.ts (unified)
    llm/                           gemini.ts, notebookPrompt.ts
    notebook/                      generate.ts (orchestrator), ipynb.ts (export)
    pdf/                           extractText.ts
    types.ts                       Shared domain types
convex/
  schema.ts                        users, sessions, notebookBlocks, searchCache
  users.ts, sessions.ts,
  notebooks.ts                     Convex functions
  lib/auth.ts                      requireUserId() helper
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Convex project

```bash
npx convex dev
```

This will open a browser to log in / create a Convex project, then generate
`convex/_generated/` and print your deployment URL. Copy that URL into
`NEXT_PUBLIC_CONVEX_URL` in `.env.local`. Leave this command running in a
terminal during development — it syncs your `convex/` functions live.

### 3. Set up Clerk

1. Create an app at https://dashboard.clerk.com
2. Copy the Publishable Key and Secret Key into `.env.local`
3. Go to **JWT Templates** in the Clerk dashboard → New template → choose
   **Convex** from the list of presets → save. Copy the "Issuer" URL shown
   there into `CLERK_JWT_ISSUER_DOMAIN`.
4. In the Convex dashboard, go to your project's settings and add the Clerk
   issuer domain there too (Convex needs it to verify Clerk's JWTs) — or just
   run `npx convex dev` again after setting `CLERK_JWT_ISSUER_DOMAIN`, since
   `convex/auth.config.ts` reads it from the env automatically.

### 4. Get a free Gemini API key

1. Go to https://aistudio.google.com/app/apikey
2. Create a key, paste it into `GEMINI_API_KEY` in `.env.local`

### 5. Copy the env file and fill it in

```bash
cp .env.local.example .env.local
```

### 6. Run the app

In one terminal:
```bash
npx convex dev
```

In another:
```bash
npm run dev
```

Visit http://localhost:3000.

## How it works

1. **Search flow**: `/search` calls `GET /api/papers/search` → `searchPapers()`
   merges results from Semantic Scholar + arXiv. Picking a paper creates a
   Convex `session` (status `pending`), then `POST /api/notebooks/generate-from-url`
   fetches the PDF, extracts text, prompts Gemini for structured JSON cells,
   and saves them via `notebooks.saveGenerated` (status → `ready`).

2. **Upload flow**: `/upload` does the same thing but starts from an uploaded
   PDF file instead of a fetched URL (`generate-from-upload` route).

3. **Sessions**: `/sessions/[id]` subscribes to the session + its cells via
   Convex's realtime queries, so the page updates live as generation status
   changes from `pending` → `generating` → `ready`/`failed` — no polling needed.

4. **Download**: `/api/notebooks/[sessionId]/download` converts the saved
   cells into a real `.ipynb` file (nbformat v4) on the fly.

## Notes / things you may want to extend

- `searchCache` table exists in the schema but isn't wired up yet — a nice
  next step to avoid re-hitting the free APIs for repeat queries.
- PDF text is truncated to ~40k characters before prompting Gemini
  (`src/lib/pdf/extractText.ts`) to stay within free-tier context limits;
  very long papers will lose some detail from later sections.
- Notebook generation currently happens in a fire-and-forget `fetch()` call
  from the client after creating the session — fine for a personal project,
  but for production you'd want a proper background job queue so generation
  survives the user closing the tab mid-request.
