# Gap Analysis — Fabric Flow Phase 0

> Generated: 2026-05-22 | Comparing OLD operational behaviour vs NEW codebase

---

## Severity Legend
- 🔴 **CRITICAL** — Workflow completely blocked or data integrity compromised
- 🟠 **HIGH** — Core operational feature missing, users cannot complete key tasks
- 🟡 **MEDIUM** — Feature missing but workflow can proceed with workarounds
- 🟢 **LOW** — Minor cosmetic or convenience feature missing

---

## 1. Missing Workflows

| # | Gap | Severity | Impact | What Needs Doing |
|---|-----|----------|--------|-----------------|
| G1 | **Authentication system missing** | 🔴 CRITICAL | Anyone can access all APIs | Implement JWT auth (NestJS Guards) |
| G2 | **Knitting → Dyeing auto-creation missing** | 🔴 CRITICAL | Dyeing records never appear unless manually created | Port `syncDyeingFromLots()` logic to new knittings service |
| G3 | **FabricPurchase / Inhouse Fabric workflow missing** | 🟠 HIGH | Cannot bypass knitting for purchased fabric | Implement InhouseKnittedFabric CRUD + link to Dyeing |
| G4 | **Cross-module search missing** | 🟡 MEDIUM | Users cannot track an HF code across workflow | Implement `/search?q=&type=` endpoint |

---

## 2. Missing Frontend Actions

| # | Gap | Old Location | Severity | Impact |
|---|-----|-------------|----------|--------|
| F1 | **Purchase Order print (3-dialog flow)** | Yarn page | 🟠 HIGH | Cannot generate printable PO documents |
| F2 | **Yarn issue dialog** (issue yarn to knitter) | Yarn page | 🟠 HIGH | Knitter stock cannot be updated from UI |
| F3 | **Knitter delivery note dialog** | Knitting page | 🟡 MEDIUM | Inter-knitter yarn transfers not possible |
| F4 | **Grey fabric specs sub-form in Knitting** | Knitting page | 🟡 MEDIUM | Grey fabric specs not recorded |
| F5 | **Knitter balance display** | Knitting page | 🟡 MEDIUM | `yarn_balance` field removed from schema |
| F6 | **Yarn remaining balance in HF code autocomplete** | Knitting form | 🟡 MEDIUM | Users cannot see available stock |
| F7 | **Dyeing delete with grey lot revert** | Dyeing page | 🟡 MEDIUM | Delete must revert GreyFabricLot status |
| F8 | **Status chip display on Yarn list** | Yarn list | 🟡 MEDIUM | New status values differ from old |
| F9 | **Analytics/dashboard** | Dashboard | 🟡 MEDIUM | No operational metrics |

---

## 3. Missing APIs

| # | Gap | Old API | Severity |
|---|-----|---------|----------|
| A1 | **Yarn inward list** | `GET /api/yarn` | 🔴 CRITICAL |
| A2 | **Yarn issue to knitter** | `POST /api/knitting/issue` | 🟠 HIGH (exists as `/yarn-lots/:id/issue`) |
| A3 | **HF code list with remaining stock** | `GET /api/yarn/list/hf-codes` | 🟠 HIGH |
| A4 | **Yarn lookup by PO number** | `GET /api/yarn/po/:po_no` | 🟠 HIGH |
| A5 | **Yarn lookup by HF code** | `GET /api/yarn/hf/:hf_code` | 🟡 MEDIUM |
| A6 | **Manual Dyeing create** | `POST /api/dyeing` | 🟠 HIGH |
| A7 | **Dyeing from grey fabric lot** | `POST /api/dyeing/program` | 🟡 MEDIUM |
| A8 | **Lot number dropdown** | `GET /api/dyeing/list/lot-nos` | 🟡 MEDIUM |
| A9 | **Compacting update** | `PUT /api/compacting/:id` | 🟠 HIGH |
| A10 | **Knitting program CRUD** | `GET/POST /api/knitting/program` | 🟡 MEDIUM |
| A11 | **Analytics** | `GET /api/analytics` | 🟡 MEDIUM |
| A12 | **Cross-module search** | `GET /api/search` | 🟡 MEDIUM |
| A13 | **Auth login** | `POST /api/auth/login` | 🔴 CRITICAL |

---

## 4. Broken Status Logic

| # | Gap | Old Behaviour | New Behaviour | Severity |
|---|-----|--------------|--------------|----------|
| S1 | **Yarn status on invoice** | `status = 'Received'` when invoice_no added | `status = 'ACTIVE'` (never auto-changes) | 🟠 HIGH |
| S2 | **Dyeing auto-status from Knitting** | Dyeing auto-created from Knitting | Dyeing requires Memo in new flow | 🔴 CRITICAL |
| S3 | **GreyFabricLot DISPATCHED status** | Only AVAILABLE/CONSUMED in old | New has DISPATCHED too — not set in old flow | 🟡 MEDIUM |
| S4 | **No workflow stage gating** | Neither system enforces sequential stage | Compacting can be created without Dyeing completion | 🟡 MEDIUM |

---

## 5. Missing Auto-Fetch Logic

| # | Gap | Severity | Impact |
|---|-----|----------|--------|
| AF1 | **Knitting lots → Dyeing auto-creation** (`syncDyeingFromLots`) | 🔴 CRITICAL | Dyeing stage never populated |
| AF2 | **Yarn PO → knitter master lookup** (for PO print) | 🟠 HIGH | PO print cannot auto-fill knitter details |
| AF3 | **lot_no → Compacting initial weight fetch** | 🟠 HIGH | Compacting now uses dyeingId but old UI used lot_no text |
| AF4 | **Dyeing lot_no → delete cascade + grey lot revert** | 🟡 MEDIUM | DELETE dyeing should revert GreyFabricLot |
| AF5 | **Remaining yarn stock calculation for autocomplete** | 🟡 MEDIUM | Users cannot see available balance when issuing yarn |

---

## 6. Missing Calculations

| # | Gap | Severity |
|---|-----|----------|
| C1 | **Knitter balance recalculation** (`recalculateKnitterBalance`) — field removed | 🟡 MEDIUM |
| C2 | **Yarn stock validation on Knitting create** (`validateYarnStock`) | 🟠 HIGH |
| C3 | **Amount in words** for PO print | 🟡 LOW |
| C4 | **Total cost includes GST** (new) vs weight×rate (old) — different semantics | 🟡 MEDIUM |

---

## 7. Missing DB Relations

| # | Gap | Severity | Impact |
|---|-----|----------|--------|
| DB1 | **FabricDescription table removed** | 🟠 HIGH | Knitting form fabric type field orphaned |
| DB2 | **GreyFabric table removed** | 🟡 MEDIUM | Knitting grey fabric specs cannot be stored |
| DB3 | **KnitterName.yarn_balance removed** | 🟡 MEDIUM | Balance tracking per knitter lost |
| DB4 | **KnittingLotEntry.dyeing_id soft link removed** | 🟡 MEDIUM | Cannot trace entry → dyeing directly |
| DB5 | **User table removed** | 🔴 CRITICAL | No authentication data storage |
| DB6 | **Compacting.initial_weight removed** | 🟡 MEDIUM | Grey weight not stored on compacting record |
| DB7 | **Dyeing.gg, initial_dia, final_dia removed** | 🟡 MEDIUM | Textile specs not tracked |

---

## 8. Summary by Priority

### 🔴 CRITICAL (Must Fix Before Go-Live)
1. G1 — Authentication system
2. G2 — Knitting → Dyeing auto-creation
3. A1 — Yarn inward endpoint (404)
4. A13 — Auth login endpoint
5. S2 — Dyeing status broken in new flow
6. DB5 — User table / auth storage

### 🟠 HIGH (Must Fix Before Production Use)
7. F1 — PO print flow
8. F2 — Yarn issue dialog
9. A3 — HF code dropdown with remaining stock
10. A6 — Manual dyeing create
11. A9 — Compacting update
12. C2 — Yarn stock validation

### 🟡 MEDIUM (Should Fix Before Final Launch)
13. F3 to F9 — Various UI features
14. A7-A12 — Supporting APIs
15. DB1-DB7 — Schema restoration items
