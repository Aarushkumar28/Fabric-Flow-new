# Risk Analysis — Fabric Flow Phase 0

> Generated: 2026-05-22 | Production risks identified from source code comparison

---

## Risk Rating
- **Probability**: High (H) / Medium (M) / Low (L)
- **Impact**: Critical (C) / High (H) / Medium (M) / Low (L)
- **Severity**: P × I combined score

---

## RISK 1 — No Authentication System

| Field | Detail |
|-------|--------|
| **Risk** | The new backend has no auth middleware. All API endpoints are publicly accessible. |
| **Probability** | H |
| **Impact** | C |
| **Severity** | 🔴 CRITICAL |
| **Evidence** | Old `backend/src/middleware/auth.js` used on every route. New NestJS has no Guards configured. User table removed from schema. |
| **Effect** | Any user on the network can read/modify/delete all production data without credentials. |
| **Mitigation** | Implement NestJS Auth Guard with JWT before any deployment. Restore User model or integrate with external auth provider. |

---

## RISK 2 — Dyeing Records Never Populated (Broken Auto-Creation)

| Field | Detail |
|-------|--------|
| **Risk** | The core `syncDyeingFromLots()` function that automatically creates Dyeing records when Knitting lots are saved is NOT ported to the new system. |
| **Probability** | H |
| **Impact** | C |
| **Severity** | 🔴 CRITICAL |
| **Evidence** | Old `knitting.js` L72-200 contains `syncDyeingFromLots()`. New `knittings` module has no equivalent. New `Dyeing` model requires `memoLineId` FK which cannot be set from the Knitting flow. |
| **Effect** | The entire Dyeing module will remain empty. Users will have no dyeing records to update with DC numbers or compacter assignments. The workflow breaks at stage 3. |
| **Mitigation** | Either: (a) port `syncDyeingFromLots` to new system and make `memoLineId` optional, OR (b) create a Memo-based UI for dispatching knitting lots to dyeing. |

---

## RISK 3 — Incorrect Compacting Loss (Potential)

| Field | Detail |
|-------|--------|
| **Risk** | Compacting process loss must use Grey Weight (not Dyed Weight). Both systems use `dyeing.initialWeight` which is the grey weight — but this assumes `initialWeight` is always set correctly as the grey weight. |
| **Probability** | M |
| **Impact** | H |
| **Severity** | 🟠 HIGH |
| **Evidence** | Old: `const grey_fabric_weight = dyeing.initial_weight` (compacting.js L74). New: `(dyeing.initialWeight - dto.finalWeight) / dyeing.initialWeight × 100` (compactings.service.ts L16). Both use `initialWeight`. |
| **Condition** | If anyone updates `Dyeing.initialWeight` to the dyed weight instead of the grey weight (e.g. confusing field purpose), the formula will calculate loss vs dyed weight, not grey weight. |
| **Mitigation** | Add a `greyWeight` field to Dyeing explicitly (renamed from `initialWeight`) to prevent confusion. Add field-level documentation. |

---

## RISK 4 — Broken Dyeing Transitions (Status Not Set)

| Field | Detail |
|-------|--------|
| **Risk** | In the new system, Dyeing status only changes to `'In Dyeing'` when `companyDcNo` AND `dateGiven` are both present. If Dyeing records are created without these, they will never transition. |
| **Probability** | M |
| **Impact** | H |
| **Severity** | 🟠 HIGH |
| **Evidence** | `dyeings.service.ts` L50-52: `if (dto.companyDcNo && (dto.dateGiven || existing.dateGiven)) { data.status = 'In Dyeing'; }` |
| **Effect** | If the frontend sends `companyDcNo` without `dateGiven`, status stays null. Records stuck with no status — cannot proceed to Compacting if status gates are added. |
| **Mitigation** | Validate that both companyDcNo AND dateGiven are present together. Add clear UI labels. Alternatively, set dateGiven to now() automatically when companyDcNo is added. |

---

## RISK 5 — Yarn Stock Over-Issuance (Missing Validation)

| Field | Detail |
|-------|--------|
| **Risk** | Old system validated yarn stock in `validateYarnStock()` before allowing Knitting creation. New system has no equivalent check. |
| **Probability** | M |
| **Impact** | H |
| **Severity** | 🟠 HIGH |
| **Evidence** | Old `knitting.js` L207-238 validates remaining stock per yarn HF code. New `knittings` module has no such validation. |
| **Effect** | Users can issue more yarn than is physically available, creating negative inventory. Yarn balance will become inaccurate. |
| **Mitigation** | Port `validateYarnStock()` to `knittings.service.ts`. Check `yarnLot.availableWeight` before confirming usage. |

---

## RISK 6 — Missing Status Movements Blocking Workflow

| Field | Detail |
|-------|--------|
| **Risk** | The old Yarn status (`Pending`→`Received`) had clear UI representation (green/orange chips). New system uses `ACTIVE` — no transition logic exists. |
| **Probability** | H |
| **Impact** | M |
| **Severity** | 🟠 HIGH |
| **Evidence** | Old `yarn.js` L115: `status: hasInvoice ? 'Received' : 'Pending'`. New `yarn-lots.service.ts` defaults to `'ACTIVE'` with no conditional logic. |
| **Effect** | Operations team loses visual indicator of which yarn lots have been invoiced (received from mill) vs. pending. Incorrect issued-yarn tracking. |
| **Mitigation** | Restore `Pending`/`Received` status or map to new values with same business meaning. Add conditional status logic on YarnLot create/update. |

---

## RISK 7 — Broken Auto-Population for Compacting

| Field | Detail |
|-------|--------|
| **Risk** | Old compacting used `lot_no` text match to fetch dyeing data. New uses `dyeingId` FK. Frontend expects lot_no lookup — structure has changed. |
| **Probability** | H |
| **Impact** | M |
| **Severity** | 🟠 HIGH |
| **Evidence** | Old `compacting.js` L66: `prisma.dyeing.findUnique({ where: { lot_no } })`. New schema: `Compacting.dyeingId`. |
| **Effect** | If frontend sends `lot_no` to new API, it will fail. Compacting data entry flow is broken. Initial weight and process loss will not auto-calculate. |
| **Mitigation** | New POST /compactings should accept `lotNo` and internally resolve to `dyeingId`. |

---

## RISK 8 — Balance Inconsistencies

| Field | Detail |
|-------|--------|
| **Risk** | Old system maintained `KnitterName.yarn_balance` as a denormalised computed field. New system removed this field. |
| **Probability** | H |
| **Impact** | M |
| **Severity** | 🟡 MEDIUM |
| **Evidence** | Old schema: `KnitterName.yarn_balance Float @default(0)`. New schema: field not present on `Knitter` model. |
| **Effect** | Operations team cannot see current yarn balance per knitter at a glance. Must query KnitterStock to aggregate manually. |
| **Mitigation** | Either restore `yarnBalance` as stored field (maintained by service), or add a computed endpoint `GET /knitters/:id/balance`. |

---

## RISK 9 — Data Integrity — FabricDescription Orphaned

| Field | Detail |
|-------|--------|
| **Risk** | Knitting records in the old system required `fabric_description_id` FK to FabricDescription. This table was removed in the new schema, but the Knitting form still needs a fabric type field. |
| **Probability** | H |
| **Impact** | M |
| **Severity** | 🟡 MEDIUM |
| **Evidence** | Old `knitting.js` body: `fabric_description_id`. New `schema.prisma` Knitting model: no such FK. |
| **Effect** | Knitting form cannot record fabric type. Historical data loses fabric description classification. |
| **Mitigation** | Add `fabricName String?` directly to `Knitting` model (denormalised), or restore `FabricDescription` master table. |

---

## RISK 10 — Workflow Corruption Risk (Out-of-Order Creation)

| Field | Detail |
|-------|--------|
| **Risk** | Neither old nor new system enforces full sequential workflow. Compacting records can be created without a completed Dyeing. |
| **Probability** | L |
| **Impact** | M |
| **Severity** | 🟡 MEDIUM |
| **Evidence** | Old validates `lot_no` exists in Dyeing but does not check if dyeing is complete (has final_weight). New validates `dyeingId` exists but same. |
| **Effect** | A compacting record can be created with `finalWeight` against a dyeing that still shows `finalWeight = 0`. Process loss calculated against 0 dyed weight. |
| **Mitigation** | Add validation: Dyeing must have `finalWeight > 0` before Compacting can be created. |

---

## Summary Table

| Risk | Description | Severity | Priority |
|------|-------------|----------|----------|
| R1 | No authentication | 🔴 CRITICAL | P0 |
| R2 | Dyeing never populated | 🔴 CRITICAL | P0 |
| R3 | Compacting loss formula (potential) | 🟠 HIGH | P1 |
| R4 | Dyeing status transition broken | 🟠 HIGH | P1 |
| R5 | Yarn stock over-issuance | 🟠 HIGH | P1 |
| R6 | Yarn status values changed | 🟠 HIGH | P1 |
| R7 | Compacting lot_no lookup broken | 🟠 HIGH | P1 |
| R8 | Knitter balance tracking lost | 🟡 MEDIUM | P2 |
| R9 | FabricDescription orphaned | 🟡 MEDIUM | P2 |
| R10 | Out-of-order workflow creation | 🟡 MEDIUM | P2 |

---

## P0 Blockers (System Cannot Be Used at All)
- R1: No auth = production data publicly exposed
- R2: Dyeing stage broken = core workflow non-functional

## P1 Risks (System Works But Data Will Be Wrong)
- R3–R7: Calculations wrong, stock can go negative, statuses incorrect

## P2 Risks (Operational Inconvenience)
- R8–R10: Data quality issues, missing features
