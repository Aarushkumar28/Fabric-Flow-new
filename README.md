# Textile Flow

A consolidated Turborepo monorepo for **Chhavineetu Textiles LLP**. 

Textile Flow handles the complete yarn-to-fabric lifecycle tracking, including:
- Master Data (Mills, Knitters, Dyers, Colours, Yarn Qualities, etc.)
- Transactional workflows (Yarn Lots, Delivery Notes, Knitting Programs, Dyeing Programs)
- Audit Logging for all system operations

## Architecture

This repository consists of:
- `apps/frontend`: A Next.js static export frontend.
- `apps/textile-flow-svc`: A unified NestJS backend service.
- `packages/shared`: A shared DTO/interface library.

## Development

```bash
npm install
npx turbo dev
```

---

## Deployment

The app deploys to [Render](https://render.com) using `render.yaml` in the repo root. Render will create two services automatically:

- **`textile-flow-svc`** — NestJS backend (Web Service)
- **`fabric-flow-frontend`** — Next.js static export (Static Site)

### BEFORE FIRST DEPLOY (do this locally once)

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get the following from **Supabase dashboard → Settings → Database**:
   - **Transaction pooler** connection string → `DATABASE_URL`  
     *(append `?pgbouncer=true` if not already present)*
   - **Direct connection** string → `DIRECT_URL`
3. Get the following from **Supabase dashboard → Settings → API**:
   - Project URL → `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL`
   - JWT Secret → `SUPABASE_JWT_SECRET`
   - Anon / public key → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Run migrations locally against Supabase (requires direct connection):
   ```bash
   cd apps/textile-flow-svc
   DATABASE_URL=<your-direct-url> npx prisma migrate deploy
   ```
5. Push code to GitHub

### ON RENDER

1. Go to **Render dashboard → Environment Groups**
2. Create a group named **exactly**: `fabric-flow-secrets`
3. Add all 7 environment variables from steps 2–3 above:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `SUPABASE_URL`
   - `SUPABASE_JWT_SECRET`
   - `NEXT_PUBLIC_API_URL` *(set after backend is live — see step 7)*
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Connect your GitHub repository to Render
5. Render will detect `render.yaml` and create both services automatically
6. **Deploy the backend first** (`textile-flow-svc`), then the frontend
7. Once the backend is live, copy its Render URL and set it as `NEXT_PUBLIC_API_URL` in the `fabric-flow-secrets` environment group
8. Trigger a **manual redeploy** of `fabric-flow-frontend` so it picks up the updated `NEXT_PUBLIC_API_URL`

> **Note:** On the free Render plan, the backend spins down after inactivity. The first request after a cold start may take ~30 seconds.

### Environment Variable Reference

See [`apps/textile-flow-svc/.env.example`](apps/textile-flow-svc/.env.example) and [`apps/frontend/.env.example`](apps/frontend/.env.example) for the full list of required variables.
