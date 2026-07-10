# Auto-Population Map — Fabric Flow Phase 0

> Generated: 2026-05-22 | Extracted from source code — exact field names used

---

## Overview

Auto-population is the behaviour where entering data in one module automatically pre-fills fields in a downstream module, eliminating re-entry and ensuring consistency.

---

## 1. Yarn Purchase → Knitter Module

### Trigger
User opens "Issue Yarn" dialog on the Yarn page, selects a knitter and enters received_weight.

### Source Module: Yarn (OLD) / YarnLot (NEW)
### Destination Module: KnitterStock

### Fields Auto-Populated

| Destination Field | Source | Mechanism |
|------------------|--------|-----------|
| `KnitterStock.knitterId` | User selection | Manual |
| `KnitterStock.yarnId` | Yarn record being issued | From API |
| `KnitterStock.received_weight` | User inputs weight | Manual entry |
| `KnitterStock.remaining_weight` | = received_weight (on first issue) | Auto-set in backend |
| `Yarn.available_weight` | Decremented | `available_weight -= received_weight` |

### Old API Call
```
POST /api/knitting/issue
Body: { knitterId, yarnId, received_weight }
→ Updates yarn.available_weight
→ Upserts KnitterStock
```

### New API Call
```
POST /yarn-lots/:id/issue
Body: { knitterId, weight }
→ Updates yarnLot.availableWeight
→ Upserts KnitterStock
```

---

## 2. Yarn HF Code → Knitting Form

### Trigger
User starts typing an HF code in the Knitting form yarn usage section.

### Source Module: Yarn
### Destination Module: Knitting (form)

### Fields Auto-Populated

| Destination Field | Source | Mechanism |
|------------------|--------|-----------|
| `KnittingYarnUsage.hf_code` | `Yarn.hf_code` lookup | Autocomplete from dropdown |
| `KnittingYarnUsage.yarn_id` | `Yarn.id` | Auto-resolved on selection |
| Remaining stock display | `Yarn.total_weight - Σ(usage)` | `GET /api/yarn/list/hf-codes` |

### Old API Call
```
GET /api/yarn/list/hf-codes
→ Returns: [{ id, hf_code, description, total_weight, used, remaining }]
Used for autocomplete dropdown with remaining balance shown
```

---

## 3. Knitting → Dyeing (CRITICAL AUTO-CREATION)

### Trigger
User saves a Knitting record with lots containing colour entries.

### Source Module: Knitting + KnittingLot + KnittingLotEntry
### Destination Module: Dyeing

### Fields Auto-Populated

| Destination Field | Source | Value |
|------------------|--------|-------|
| `Dyeing.lot_no` | `KnittingLot.lot_no` | Copied directly |
| `Dyeing.hf_code` | `Knitting.hf_code` | Copied |
| `Dyeing.initial_weight` | `KnittingLotEntry.weight` | Weight per colour entry |
| `Dyeing.dyer_name_id` | `KnittingLot.dyer_name_id` | Which dyer for this lot |
| `Dyeing.colour_id` | `KnittingLotEntry.colour_id` | Which colour |
| `Dyeing.count` | `Knitting.count` | |
| `Dyeing.source_type` | hardcoded | `'KNITTING'` |
| `Dyeing.gg` | `Knitting.gauge` | |
| `Dyeing.initial_dia` | `Knitting.dia` | |
| `Dyeing.no_of_rolls` | `KnittingLot.no_of_rolls` | |
| `Dyeing.final_weight` | hardcoded | `0` (to be updated later) |
| `Dyeing.process_loss` | hardcoded | `0` (to be updated later) |
| `Dyeing.wash_type_id` | hardcoded | `1` (default; user updates in Dyeing page) |

### Old Function
```javascript
// knitting.js L72-200: syncDyeingFromLots(knittingId, lots, knitting)
// Called from POST and PUT /api/knitting
// Creates Dyeing record for each NEW KnittingLotEntry
// Updates Dyeing.initial_weight and dyer when lot is updated
// Deletes Dyeing record when lot or entry is removed
```

### ⚠️ Status in NEW Repo
This auto-creation logic (`syncDyeingFromLots`) is **NOT IMPLEMENTED** in the new knittings module.
In the new system, Dyeings require a `memoLineId` FK — so they cannot be auto-created from knitting lots using the old mechanism.

---

## 4. Yarn PO Number → Print/Preview

### Trigger
User clicks "Print" icon on a Yarn row.

### Source Module: Yarn
### Destination Module: PO Print Dialog (frontend only)

### Fields Auto-Populated

| Print Field | Source | API Call |
|------------|--------|---------|
| PO Number | `Yarn.purchase_order_no` | Pre-filled |
| Date | `Yarn.issued_date` | Pre-filled |
| Mill name | `Yarn.millName.name` | From included relation |
| Mill GSTIN | `Yarn.millName.gstn` | From included relation |
| Mill address | Combined from millName fields | Computed |
| Knitter name | Fetched via `delivery_to` name match | `GET /api/master/knitter-names` |
| Knitter GSTIN | `KnitterName.gstn` | From master lookup |
| Knitter address | From matched knitter record | From master lookup |
| All yarn items | All yarns with same PO number | `GET /api/yarn/po/:po_no` |

### ⚠️ Status in NEW Repo
No PO print functionality in new frontend. The old system used a client-side `window.print()` approach with all data assembled in the dialog.

---

## 5. Dyeing → Compacting

### Trigger
User creates a Compacting record and enters the `lot_no`.

### Source Module: Dyeing
### Destination Module: Compacting

### Fields Auto-Populated

| Destination Field | Source | Mechanism |
|------------------|--------|-----------|
| `Compacting.initial_weight` | `Dyeing.initial_weight` | Fetched by `lot_no` lookup |
| `Compacting.hf_code` | `Dyeing.hf_code` | Could be auto-filled (old UI) |
| `Compacting.process_loss` | Computed: `(Dyeing.initial_weight - final_weight) / Dyeing.initial_weight × 100` | Auto-calculated in backend |

### Old API Validation
```javascript
// compacting.js L66-68
const dyeing = await prisma.dyeing.findUnique({ where: { lot_no } });
if (!dyeing) → 400 error "Lot No not found in Dyeing"
```

### ⚠️ Status in NEW Repo
In new schema, `Compacting` links via `dyeingId` FK, not `lot_no` text. This is a structural change.

---

## 6. GreyFabricLot → Dyeing (Old "program" flow)

### Trigger
`POST /api/dyeing/program` with a `greyFabricLotId`

### Source: GreyFabricLot
### Destination: Dyeing

| Destination Field | Source |
|------------------|--------|
| `Dyeing.initial_weight` | `GreyFabricLot.grey_weight` |
| `Dyeing.no_of_rolls` | `KnitterProgram.number_of_rolls` |
| `Dyeing.source_type` | Hardcoded `'GREY_FABRIC'` |
| `GreyFabricLot.status` | Set to `'CONSUMED'` |

---

## 7. Memo → Dyeing (NEW workflow)

### Trigger
When a Dyeing return is recorded against a MemoLine.

### Source: Memo → MemoLine
### Destination: Dyeing

| Destination Field | Source |
|------------------|--------|
| `Dyeing.memoLineId` | `MemoLine.id` |
| `Dyeing.initialWeight` | `MemoLine.sentWeight` |
| `Dyeing.dyerId` | `Memo.dyerId` |

---

## 8. Auto-Population Status Summary

| Auto-Population | OLD | NEW | Status |
|----------------|-----|-----|--------|
| Yarn issue → KnitterStock | ✅ | ✅ | Same |
| HF code autocomplete in Knitting | ✅ | ⚠️ Unknown | Needs verification |
| Knitting lots → Dyeing auto-create | ✅ | ❌ Missing | CRITICAL |
| Lot_no → Compacting validation+data | ✅ | ⚠️ Partial (dyeingId FK) | Changed approach |
| Yarn PO → Print dialog | ✅ | ❌ Missing | High |
| GreyFabricLot → Dyeing | ✅ | ⚠️ Via Memo/MemoLine | Different flow |
| Dyeing → Compacting loss calc | ✅ | ✅ | Same formula |
