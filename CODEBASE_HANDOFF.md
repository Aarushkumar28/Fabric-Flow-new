# Fabric Flow — Codebase Handoff Document

> **Purpose:** Complete context for any AI assistant (Claude, Gemini, etc.) to pick up and continue development on this project without needing to ask basic questions about the architecture, stack, or conventions.

---

## 1. What Is This App?

**Fabric Flow** is an internal operations management system for a textile manufacturing business based in Tirupur, India. It tracks the end-to-end textile supply chain:

```
Yarn Purchase Order → Yarn Inward (Receipt) → Knitting → Dyeing → Compacting → Dispatch
```

The company:
- Sources **yarn** from Mills (e.g. SREE SIVA SELVI KNITTING)
- Delivers yarn to **Knitters** who knit it into grey fabric
- Sends grey fabric to **Dyers**
- Sends dyed fabric to **Compacters**
- Issues **Delivery Notes** and tracks **Inventory** throughout

The app handles: PO generation, inward tracking, lot management, inventory ledger, production planning, and memo/dispatch workflows.

---

## 2. Monorepo Structure

```text
Fabric-Flow-new-main/
├── apps/
│   ├── frontend/          ← Next.js 14 (App Router), deployed as static SPA on Render
│   └── textile-flow-svc/  ← NestJS REST API, deployed on Render (Node runtime)
├── packages/
│   ├── shared/            ← Shared DTOs and types (@textile-flow/shared)
│   ├── eslint-config/
│   └── typescript-config/
├── render.yaml            ← Render.com deployment config (both services)
├── turbo.json             ← Turborepo task orchestration
└── package.json           ← Root: npm workspaces + turbo
```

**Package Manager:** npm (v11.6.2). Uses npm workspaces. `bun.lock` exists but npm is canonical.
**Build System:** Turborepo (`npx turbo run dev/build`)
**Node Requirement:** >= 18

---

## 3. Backend — `apps/textile-flow-svc`

### Stack
| Layer | Tech |
|-------|------|
| Framework | **NestJS v11** |
| ORM | **Prisma v7.8** with `driverAdapters` preview feature |
| DB Driver | `@prisma/adapter-pg` (pg Pool) — **required**, raw PrismaClient won't work |
| Database | **Supabase PostgreSQL** (hosted, connection pooling via PgBouncer) |
| Auth | Supabase JWT verification (present in codebase, **not globally enforced** yet — JwtAuthGuard is built but commented out from APP_GUARD) |
| Validation | `class-validator` + `class-transformer` on all DTOs |
| Runtime port | `3001` |

### Key Gotcha — PrismaClient Initialization
**Critical:** This project uses `@prisma/adapter-pg`. You CANNOT use `new PrismaClient()` bare. Every instantiation — including scripts — must follow:
```typescript
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
```
The NestJS service does this in `apps/textile-flow-svc/src/prisma/prisma.service.ts`.

### Start Commands
```bash
# From repo root (recommended — starts both frontend + backend concurrently)
npm run dev

# Backend only
cd apps/textile-flow-svc && npm run dev   # or: nest start --watch
```

### Environment Variables (backend — `apps/textile-flow-svc/.env`)
```env
DATABASE_URL="postgresql://...@...pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://...@...supabase.com:5432/postgres"
SUPABASE_URL=https://nvtyytyykdjhgtinhftd.supabase.co
```

### NestJS Modules (all registered in AppModule)

| Module | Route Prefix | Description |
|--------|-------------|-------------|
| `MillsModule` | `/mills` | Mill CRUD (yarn suppliers) |
| `KnittersModule` | `/knitters` | Knitter CRUD |
| `DyersModule` | `/dyers` | Dyer CRUD |
| `CompactersModule` | `/compacters` | Compacter CRUD |
| `ColoursModule` | `/colours` | Colour master data |
| `PurchaseOrdersModule` | `/purchase-orders` | Yarn & Fabric PO creation + listing |
| `YarnInwardModule` | `/yarn-inward` | Yarn receipt tracking (PENDING → RECEIVED) |
| `YarnLotsModule` | `/yarn-lots` | Yarn lot inventory |
| `YarnReceiptsModule` | `/yarn-receipts` | Individual receipts per lot |
| `KnitterStockModule` | `/knitter-stock` | Per-knitter yarn stock ledger |
| `KnitterProgramsModule` | `/knitter-programs` | Knitting programme records |
| `KnittingsModule` | `/knittings` | Knitting job tracking |
| `KnittingLotsModule` | `/knitting-lots` | Knitting lot management |
| `DeliveryNotesModule` | `/delivery-notes` | DC (Delivery Challan) records |
| `MemosModule` | `/memos` | Dyeing dispatch memos |
| `DyeingsModule` | `/dyeings` | Dyeing job records |
| `DyeingOrdersModule` | `/dyeing-orders` | Dyeing order management |
| `DyeingProgramsModule` | `/dyeing-programs` | Dyeing programme records |
| `DyeingDispatchModule` | `/dyeing-dispatch` | Dispatch tracking |
| `CompactingsModule` | `/compactings` | Compacting records |
| `InhouseKnittedFabricsModule` | `/inhouse-knitted-fabrics` | In-house fabric lots |
| `GreyFabricLotsModule` | `/grey-fabric-lots` | Grey fabric lot management |
| `GreyFabricInwardModule` | `/grey-fabric-inward` | External grey fabric purchases |
| `InventoryModule` | `/inventory` | Ledger + movement posting |
| `LotTrackerModule` | `/lot-tracker` | Cross-stage lot status tracking |
| `WorkflowModule` | `/workflow` | Status transition events |
| `ProductionPlanningModule` | `/production-planning` | Production plans + events |
| `AuditLogsModule` | `/audit-logs` | DB change audit trail |
| `AuthModule` | `/auth` | Supabase JWT auth (not enforced globally yet) |

### Cross-Cutting Concerns
- **`AllExceptionsFilter`** — global exception filter at `src/common/filters/all-exceptions.filter.ts`
- **`LoggerMiddleware`** — logs every request at `src/common/middleware/logger.middleware.ts`
- **`InventoryService.postInventoryMovement()`** — used by YarnInward and PurchaseOrders to write to `InventoryLedger`
- **`/health`** endpoint — returns `{ status: 'ok', timestamp }`, used by Render for health checks
- **CORS** — allows `http://localhost:3000`, `https://fabric-flow-frontend.onrender.com`, and `FRONTEND_URL` env var

---

## 4. Frontend — `apps/frontend`

### Stack
| Layer | Tech |
|-------|------|
| Framework | **Next.js 14** (App Router) |
| Styling | **Tailwind CSS** |
| Component Library | **shadcn/ui** (Radix primitives) |
| HTTP Client | **axios** (configured in `lib/api.ts`) |
| Server State | **@tanstack/react-query v5** |
| Forms | **react-hook-form** + `useFieldArray` |
| Toasts | **sonner** |
| PDF Generation | **html2pdf.js** (client-side capture of hidden HTML templates) |
| Auth | **Supabase JS client** (`@supabase/supabase-js`) |
| Deployment | Static SPA export (`next export` → `out/`) on Render |

### Environment Variables (frontend — `apps/frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001      # points to backend; in prod: https://textile-flow-svc.onrender.com
NEXT_PUBLIC_SUPABASE_URL=https://nvtyytyykdjhgtinhftd.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key-from-supabase-dashboard
```

### API Client (`apps/frontend/lib/api.ts`)
```typescript
// All API calls go through this axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  timeout: 30000, // 30s — tolerates Render cold starts
});
// Interceptor auto-attaches Supabase JWT Bearer token on every request
// Response interceptor logs errors with method + URL + status
```

### App Router Structure
```text
apps/frontend/app/
├── (app)/                          ← Authenticated shell layout
│   ├── layout.tsx
│   ├── page.tsx                    ← Dashboard (home)
│   ├── master-data/                ← Master data management page
│   │   └── page.tsx
│   ├── production-planning/        ← Production planning view
│   ├── audit/                      ← Audit log viewer
│   └── tracker/                    ← Main operational section
│       ├── purchase-orders/        ← PO creation + print + history
│       ├── yarn-inward/            ← Yarn inward tracking
│       ├── yarn/                   ← Yarn inventory (lots, by-knitter view)
│       ├── grey-fabric-inward/     ← External grey fabric purchases
│       ├── knitter-programs/       ← Knitting programme records
│       ├── dyeing/                 ← Dyeing records
│       ├── compactor/              ← Compacting records
│       ├── memos/                  ← Dyeing dispatch memos
│       ├── delivery-notes/         ← Delivery challan records
│       └── master-data/            ← (redundant route, maps to master-data page)
├── auth/                           ← Login page (Supabase email/password)
└── layout.tsx                      ← Root layout with providers
```

### Auth Flow
- Protected by `<ProtectedRoute>` component which checks `supabase.auth.getUser()`
- Auth is **partially implemented** — login UI exists, JWT is attached to requests, but the backend's `JwtAuthGuard` is not registered globally (intentionally, to avoid breaking flows during development)
- Login page: `app/auth/`

### Key Components
| Component | Location | Purpose |
|-----------|----------|---------|
| `PurchaseOrderForm` | `components/purchase-orders/PurchaseOrderForm.tsx` | Create YARN or GREY_FABRIC POs; includes supplier dropdown (mills + knitters), PDF preview |
| `PurchaseOrderPrintTemplate` | `components/purchase-orders/PurchaseOrderPrintTemplate.tsx` | Hidden A4 HTML template captured by html2pdf |
| `YarnPOPrint` | `components/po/YarnPOPrint.tsx` | Yarn-specific PO print layout |
| `YarnPOPreviewModal` | `components/po/YarnPOPreviewModal.tsx` | Preview before printing |
| `ProtectedRoute` | `components/auth/protected-route.tsx` | Auth gate HOC |

---

## 5. Database Schema Summary

**Database:** Supabase PostgreSQL. Prisma schema at `apps/textile-flow-svc/prisma/schema.prisma`.

### Core Entity Relationships

```text
Mill ──────────────────┐
                       ↓
PurchaseOrder ──→ YarnInward ──→ YarnLot ──→ KnitterStock
                       ↑               ↓
Knitter ───────────────┘         KnitterProgram ──→ GreyFabricLot
                                                         ↓
                                              Memo ──→ MemoLine ──→ Dyeing
                                                                      ↓
                                                               Compacting
```

### Key Models

| Model | PK Type | Key Fields | Notes |
|-------|---------|------------|-------|
| `Mill` | `Int` autoincrement | name, gstin, address fields | Yarn suppliers |
| `Knitter` | `Int` autoincrement | name, gstin, address fields | Knitting contractors |
| `Dyer` | `Int` autoincrement | name, gstin | Dyeing contractors |
| `Compacter` | `Int` autoincrement | name, gstin | Compacting contractors |
| `Colour` | `Int` autoincrement | name, code (unique), hexCode | Colour master |
| `PurchaseOrder` | **`String` cuid()** | poNumber, hfCode, supplierName, supplierAddress, supplierGST, date, deliveryDate, poType (YARN/GREY_FABRIC), deliveryName/Address/GST, fabric fields | Has `yarnInwards[]` and `items[]` |
| `PurchaseOrderItem` | `String` cuid() | Belongs to PO via cascading delete; bags, bagWeight, totalWeight, rate, cgst, sgst, count, quality |  |
| `YarnInward` | `Int` autoincrement | status (PENDING/RECEIVED), millId, deliveryKnitterId, hfBatch, numBags, bagWeight, totalWeight, ratePerKg, cgstRate, sgstRate, purchaseOrderId? | Auto-created when PO saved; transitions PENDING→RECEIVED when yarn physically arrives |
| `YarnLot` | `Int` autoincrement | hfCode, millId, totalWeight, availableWeight, ratePerKg, status (ACTIVE/etc) | Created when YarnInward is RECEIVED |
| `KnitterStock` | `Int` autoincrement | knitterId, yarnLotId (composite unique), receivedWeight, remainingWeight | Updated via upsert when yarn delivered |
| `KnitterProgram` | `Int` autoincrement | knitterId, yarnLotId, quantityUsed, greyWeight, numRolls, programDate | Knitting production records |
| `GreyFabricLot` | `Int` autoincrement | lotNumber (unique), source (KNITTED/PURCHASED), status (AVAILABLE/DISPATCHED/CONSUMED/DELETED) | Source of truth for grey fabric |
| `Memo` | `Int` autoincrement | memoNo (sequential unique), dyerId, lines[] | Dispatch memo to dyer |
| `MemoLine` | `Int` autoincrement | memoId, greyFabricLotId?, sentWeight | One line per fabric lot sent |
| `Dyeing` | `Int` autoincrement | lotNo (unique), memoLineId (unique), dyerId, colourId, initialWeight, finalWeight, status | Return from dyer |
| `Compacting` | `Int` autoincrement | lotNo (unique), dyeingId, compacterId, finalWeight | Final stage |
| `InventoryLedger` | `Int` autoincrement | entityType, entityId, itemType, inwardWeight, outwardWeight, balanceWeight, stage | Running ledger; append-only |
| `LotTracker` | `Int` autoincrement | lotNo (unique), currentStatus, activeStage, completionPercent | Cross-stage tracker |
| `ProductionPlan` | `Int` autoincrement | planNo (unique), lotNo, stage, priority (LOW/NORMAL/HIGH/URGENT), status (PENDING/IN_PROGRESS/COMPLETED/CANCELLED) | |
| `AuditLog` | `Int` autoincrement | tableName, recordId, action (CREATE/UPDATE/DELETE), oldData, newData, performedBy | |

---

## 6. Critical Business Logic

### Purchase Order → Auto-Inward Flow

When a **YARN PO** is saved (`POST /purchase-orders`), the service:
1. Creates the `PurchaseOrder` record with all `PurchaseOrderItem` rows in a single `$transaction`
2. Resolves the `Mill`:
   - **First:** tries `millId` if provided in DTO (sent by the frontend dropdown)
   - **Fallback:** fuzzy `ILIKE` on `supplierName`
3. Resolves the `Knitter`:
   - **First:** tries `knitterId` if provided in DTO
   - **Fallback:** fuzzy `ILIKE` on `deliveryName`
4. If both resolve → creates a `YarnInward` row with `status: 'PENDING'`
5. If either fails → attaches `inwardLinkWarning: string` to the response (non-fatal; PO still saves)
6. Returns `{ ...po, inwardLinkWarning }` — the frontend checks for this and shows a yellow toast

### YarnInward Status Lifecycle

```
PENDING → RECEIVED
```
- Starts at `PENDING` (created automatically from PO, or manually created)
- Transitions to `RECEIVED` when the Yarn Inward edit dialog is opened and `receivedWeight` is submitted
- On transition to RECEIVED: creates `YarnLot`, upserts `KnitterStock`, posts `InventoryLedger` movement

### PDF Generation — Known Quirk

The frontend generates PO PDFs by:
1. Rendering hidden `<div id="po-pdf-overlay-{id}">` HTML templates in the DOM (below the PO list)
2. After save + `refetchQueries`, doing a **double `requestAnimationFrame`** wait for React to paint
3. Then calling `generatePOPDF(elementId, poNumber)` from `lib/generatePdf.ts`

**Do not remove the double-rAF.** Single rAF causes a race condition where `html2pdf` can't find the element.

---

## 7. Deployment (Render.com)

### `render.yaml` — Current Config

**Backend service** (`textile-flow-svc`):
```yaml
buildCommand: npm install && npx prisma generate --schema=apps/textile-flow-svc/prisma/schema.prisma && npx turbo run build --filter=textile-flow-svc
startCommand: node apps/textile-flow-svc/dist/main.js
healthCheckPath: /health
region: singapore
plan: free
```

**Frontend service** (`fabric-flow-frontend`):
```yaml
buildCommand: npm install && npx turbo run build --filter=@textile-flow/frontend
staticPublishPath: apps/frontend/out
# SPA fallback: all routes → /index.html
```

### Shared Environment Variable Group (`fabric-flow-secrets`)
```
DATABASE_URL         - Supabase connection string (pooled, PgBouncer)
DIRECT_URL           - Supabase direct connection (for migrations)
SUPABASE_URL         - https://nvtyytyykdjhgtinhftd.supabase.co
SUPABASE_JWT_SECRET  - For verifying Supabase JWTs in backend
NEXT_PUBLIC_API_URL  - https://textile-flow-svc.onrender.com (backend public URL)
NEXT_PUBLIC_SUPABASE_URL - (same as SUPABASE_URL)
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY - Supabase anon key
```

### Cold Start Behaviour
Render free tier goes to sleep after 15 min. First request on cold start takes 20-30s. Frontend axios has `timeout: 30000` to handle this. Do not reduce below 30s.

---

## 8. Known Bugs & Active TODOs

### Fixed (in this session, not yet deployed)
- ✅ **Auto-inward broken after render.yaml update**: Fixed by adding `millId`/`knitterId` to DTO and PO form; now uses ID-first resolution
- ✅ **False "Save Failed" error toast**: Fixed by double-rAF before PDF generation
- ✅ **Axios timeout missing**: Added 30s timeout
- ✅ **render.yaml missing explicit `prisma generate`**: Fixed

### Outstanding / Known Issues
- ⚠️ **18 orphaned historical POs** (created before the fix): their `deliveryName` is `"CHHAVI NEETU TEXTILES LLP"` — this name does not exist as a Knitter in the DB, so the backfill script skipped them. To fix: either add that Knitter to the DB or update the POs' `deliveryName`.
- ⚠️ **Auth is not globally enforced**: `JwtAuthGuard` is coded but not applied as `APP_GUARD`. The `ProtectedRoute` on the frontend protects UI but the API is technically unauthenticated.
- ⚠️ **`selectedKnitterId` tracking**: The frontend tracks `selectedMillId` from supplier dropdown, but `selectedKnitterId` is tracked via state and reset, but the delivery dropdown does not yet emit knitter IDs directly (the delivery address field is a text input, not a knitter dropdown on the PO form). This means `knitterId` will always be `null` from the PO form — the fuzzy fallback on `deliveryName` applies. For the auto-inward to work reliably, either: (a) add a knitter dropdown to the delivery section of PO form, or (b) ensure the default `deliveryName` exactly matches a `Knitter.name` in DB.

---

## 9. Running Locally

```bash
# Clone and install
cd Fabric-Flow-new-main
npm install

# Set up backend env
cp apps/textile-flow-svc/.env.example apps/textile-flow-svc/.env
# Fill in DATABASE_URL, DIRECT_URL, SUPABASE_URL

# Set up frontend env
cp apps/frontend/.env.example apps/frontend/.env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:3001
# Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

# Generate Prisma client
cd apps/textile-flow-svc && npx prisma generate && cd ../..

# Start both services (from repo root)
npm run dev
# Backend → http://localhost:3001
# Frontend → http://localhost:3000
```

---

## 10. Running the Backfill Script

For any historical Yarn POs missing a linked `YarnInward`:

```bash
cd apps/textile-flow-svc
../../node_modules/.bin/ts-node \
  -P tsconfig.json \
  -r tsconfig-paths/register \
  scripts/backfill-yarn-inward.ts
```

Safe to re-run (idempotent). Skips POs already having an inward row.

---

## 11. Conventions & Patterns

### Backend
- Every module follows NestJS standard: `module.ts`, `controller.ts`, `service.ts`, optional `dto/` folder
- DTOs use `class-validator` decorators; always use `@IsOptional()` for optional fields
- All DB-mutating operations that touch multiple tables **must** use `prisma.$transaction(async (tx) => {...})`
- Inventory movements always go through `InventoryService.postInventoryMovement()` within the same transaction
- Audit log entries are written inline within transactions where needed

### Frontend
- All API calls via the shared `api` axios instance from `lib/api.ts`
- Server state via React Query; key pattern: `['resource-name']` or `['resource-name', id]`
- Toast notifications via `sonner`: `toast.success()`, `toast.error()`, `toast.warning()` (8s duration for warnings)
- Forms: `react-hook-form` with `useFieldArray` for dynamic rows
- Protected pages always wrap content in `<ProtectedRoute>`
- Shadcn components are in `components/ui/`

### TypeScript
- `strict: true` equivalent (strictNullChecks, noImplicitAny, etc.) on backend
- Frontend uses Next.js default tsconfig
- Shared types/DTOs live in `packages/shared/src/`

---

## 12. File Quick Reference

| What you're looking for | File |
|------------------------|------|
| Database schema | `apps/textile-flow-svc/prisma/schema.prisma` |
| Backend entry point | `apps/textile-flow-svc/src/main.ts` |
| NestJS module registry | `apps/textile-flow-svc/src/app.module.ts` |
| PO creation logic (auto-inward) | `apps/textile-flow-svc/src/purchase-orders/purchase-orders.service.ts` |
| PO DTO | `apps/textile-flow-svc/src/purchase-orders/dto/create-purchase-order.dto.ts` |
| Yarn Inward service | `apps/textile-flow-svc/src/yarn-inward/yarn-inward.service.ts` |
| Inventory service | `apps/textile-flow-svc/src/inventory/inventory.service.ts` |
| Prisma service (DB client) | `apps/textile-flow-svc/src/prisma/prisma.service.ts` |
| Frontend axios client | `apps/frontend/lib/api.ts` |
| PO form component | `apps/frontend/components/purchase-orders/PurchaseOrderForm.tsx` |
| Yarn Inward page | `apps/frontend/app/(app)/tracker/yarn-inward/page.tsx` |
| PO types | `apps/frontend/types/purchase-order.ts` |
| Entity types | `apps/frontend/types/entities.ts` |
| Deployment config | `render.yaml` |
| Backfill script | `apps/textile-flow-svc/scripts/backfill-yarn-inward.ts` |
