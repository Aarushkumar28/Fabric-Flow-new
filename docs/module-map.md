# Module Map — Fabric Flow Phase 0

> Generated: 2026-05-22 | Comparing OLD (Express/Vite) vs NEW (NestJS/Next.js monorepo)

---

## 1. Architecture Overview

| Dimension | OLD Repo | NEW Repo |
|-----------|----------|---------|
| Backend | Express.js + Prisma (Node.js) | NestJS + Prisma |
| Frontend | Vite + React (JSX) | Next.js 16 + React (TSX) |
| DB | PostgreSQL (Supabase) | PostgreSQL (Supabase) |
| Structure | `backend/` + `frontend/` | Monorepo: `apps/textile-flow-svc` + `apps/frontend` + `packages/shared` |
| Auth | JWT middleware on all routes | Not yet implemented in new |

---

## 2. Backend Module Map

### 2a. OLD Backend — Express Routes (`backend/src/routes/`)

| Module | Route File | Purpose | Upstream | Downstream |
|--------|-----------|---------|----------|------------|
| **Auth** | `auth.js` | Login / JWT token issue | — | All modules |
| **Master Data** | `master.js` | CRUD for mill-names, knitter-names, dyer-names, compacter-names, colours, wash-types, fabric-descriptions | — | All transaction modules |
| **Yarn** | `yarn.js` | Yarn purchase lots — create, list, update, delete; HF code lookup; available-weight tracking | Mill master | Knitting |
| **Knitting** | `knitting.js` | Knitter DC records; yarn usage; lot + colour entries; dyeing auto-creation; knitter balance; delivery notes; stock issue; grey fabric specs; KnitterProgram | Yarn | Dyeing (auto-create), Memo |
| **Dyeing** | `dyeing.js` | Dyeing records (auto-created from Knitting lots OR manual); process loss calculation; compacter pre-assignment | Knitting lots / Grey fabric lots | Compacting |
| **Compacting** | `compacting.js` | Final compacting step; process loss from grey weight; links back to Dyeing by lot_no | Dyeing | Finished Fabric |
| **Inhouse Fabric** | `inhouseFabric.js` | External fabric purchases (FabricPurchase page); can enter dyeing directly | — | Dyeing |
| **Analytics** | `analytics.js` | Dashboard metrics | All modules | — |
| **Search** | `search.js` | Cross-module search by HF code / lot no | All modules | — |

### 2b. NEW Backend — NestJS Modules (`apps/textile-flow-svc/src/`)

| Module | Directory | Purpose | Status vs Old |
|--------|-----------|---------|--------------|
| **Mills** | `mills/` | Mill master CRUD | ✅ Implemented |
| **Knitters** | `knitters/` | Knitter master CRUD | ✅ Implemented |
| **Dyers** | `dyers/` | Dyer master CRUD | ✅ Implemented |
| **Compacters** | `compacters/` | Compacter master CRUD | ✅ Implemented |
| **Colours** | `colours/` | Colour master CRUD | ✅ Implemented |
| **WashTypes** | `wash-types/` | Wash type master CRUD | ✅ Implemented |
| **YarnLots** | `yarn-lots/` | Yarn purchase lot management | ✅ Implemented (renamed from `Yarn`) |
| **YarnInward** | *(missing)* | Yarn receipt from mill | ❌ Route missing — 404 error |
| **YarnReceipts** | `yarn-receipts/` | Yarn receipt records per lot | ✅ Implemented |
| **KnitterStock** | `knitter-stock/` | Track yarn at each knitter | ✅ Implemented |
| **DeliveryNotes** | `delivery-notes/` | Yarn transfers between knitters | ✅ Implemented |
| **Knittings** | `knittings/` | Knitter DC records | ✅ Partial |
| **KnittingLots** | `knitting-lots/` | Knitting lot management | ✅ Partial |
| **Memos** | `memos/` | Memo = dyeing dispatch document | ✅ NEW (not in old) |
| **Dyeings** | `dyeings/` | Dyeing return records | ✅ Implemented (PATCH only) |
| **DyeingPrograms** | `dyeing-programs/` | Dyeing program management | ✅ NEW |
| **DyeingOrders** | `dyeing-orders/` | Dyeing orders | ✅ Partial |
| **Compactings** | `compactings/` | Compacting records | ✅ Partial |
| **InhouseKnittedFabrics** | `inhouse-knitted-fabrics/` | External fabric purchases | ✅ Partial |
| **PurchaseOrders** | `purchase-orders/` | PO generation for yarn | ✅ NEW |
| **GreyFabricLots** | `grey-fabric-lots/` | Grey fabric lot tracking | ✅ Partial |
| **AuditLogs** | `audit-logs/` | Record-level audit trail | ✅ NEW (not in old) |
| **Auth** | *(missing)* | JWT auth | ❌ NOT IMPLEMENTED |

---

## 3. Frontend Module Map

### 3a. OLD Frontend — Vite/React Pages (`frontend/src/pages/`)

| Page | Route | Purpose | Key Actions |
|------|-------|---------|-------------|
| **Login** | `/login` | User authentication | JWT login form |
| **Dashboard** | `/` | Summary overview | Metrics |
| **Yarn** | `/yarn` | Yarn purchase management | Create/edit yarn lots, issue to knitter, PO generation |
| **Knitting** | `/knitting` | Knitter DC management | Complex form: yarn usages, lots, colour entries, grey fabric specs |
| **Dyeing** | `/dyeing` | Dyeing records | View auto-created dyeing records, update DC numbers, compacter |
| **Compacting** | `/compacting` | Compacting records | Create compacting entry from dyeing lot_no |
| **FabricPurchase** | `/fabric-purchase` | Inhouse/external fabric | Create and manage purchased fabric records |
| **MasterData** | `/master` | Master data management | CRUD for all master entities |
| **Search** | `/search` | Cross-module search | Search by HF code or lot number |

### 3b. NEW Frontend — Next.js App Router (`apps/frontend/app/`)

| Page | Route | Purpose | Status vs Old |
|------|-------|---------|--------------|
| **Yarn Inward** | `/tracker/yarn-inward` | Yarn purchase records | ⚠️ Frontend exists, backend 404 |
| **Yarn Lots** | `/tracker/yarn-lots` | Yarn lot management | ✅ Implemented |
| **Knitter Stock** | `/tracker/knitter-stock` | Knitter yarn stock view | ✅ Implemented |
| **Knittings** | `/tracker/knittings` | Knitter DC records | ✅ Partial |
| **Memos** | `/tracker/memos` | Dyeing dispatch memos | ✅ NEW |
| **Dyeings** | `/tracker/dyeings` | Dyeing records | ✅ Partial |
| **Compactings** | `/tracker/compactings` | Compacting records | ✅ Partial |
| **Mills** | `/master/mills` | Mill master | ✅ Implemented |
| **Knitters** | `/master/knitters` | Knitter master | ✅ Implemented |
| **Dyers** | `/master/dyers` | Dyer master | ✅ Implemented |
| **Compacters** | `/master/compacters` | Compacter master | ✅ Implemented |
| **Colours** | `/master/colours` | Colour master | ✅ Implemented |
| **WashTypes** | `/master/wash-types` | Wash type master | ✅ Implemented |
| **Dashboard** | `/` | Landing page | ⚠️ Basic stub |
| **Login** | `/login` | Auth page | ❌ No backend auth |
| **Search** | *(missing)* | Cross-module search | ❌ NOT IMPLEMENTED |
| **FabricPurchase** | *(missing)* | Inhouse fabric page | ❌ NOT IMPLEMENTED |
| **Analytics** | *(missing)* | Dashboard metrics | ❌ NOT IMPLEMENTED |

---

## 4. Shared Package (`packages/shared/`)

| Item | Purpose |
|------|---------|
| `dto/yarn-lots/` | CreateYarnLotDto, UpdateYarnLotDto (Zod) |
| `dto/dyeings/` | UpdateDyeingDto (Zod) |
| `dto/memos/` | CreateMemoDto (Zod) |
| `dto/knitters/` | CreateKnitterDto (Zod) |
| `dto/mills/` | CreateMillDto (Zod) |
| `dto/compacters/` | CreateCompacterDto (Zod) |
| `dto/dyers/` | CreateDyerDto (Zod) |
| `dto/dyeing-programs/` | CreateDyeingProgramDto (Zod) |
| `dto/yarn-inward/` | CreateYarnInwardDto, UpdateYarnInwardDto (Zod) |
| `contracts/yarn.contracts.ts` | Type contracts for yarn-related APIs |

---

## 5. Master Data vs Operational Modules

| Type | Old Modules | New Modules |
|------|-------------|-------------|
| **Master / Reference** | mill-names, knitter-names, dyer-names, compacter-names, colours, wash-types, fabric-descriptions | Mills, Knitters, Dyers, Compacters, Colours, WashTypes |
| **Operational Transaction** | Yarn, Knitting, Dyeing, Compacting, InhouseFabric | YarnLots, YarnInward, Knittings, Memos, Dyeings, Compactings, InhouseKnittedFabrics |
| **Supporting** | KnitterStock, DeliveryNotes, KnittingLots | KnitterStock, DeliveryNotes, KnittingLots, YarnReceipts |
| **Analytics / Search** | Analytics, Search | ❌ Missing |
| **Auth** | Auth (JWT) | ❌ Missing |
| **New in New** | — | AuditLogs, PurchaseOrders, DyeingPrograms, Memos, GreyFabricInward |
