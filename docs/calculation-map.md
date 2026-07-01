# Calculation Map — Fabric Flow Phase 0

> Generated: 2026-05-22 | All formulas extracted directly from source code

---

## 1. Yarn Purchase Calculations

### 1a. Total Weight

| System | Formula | Source |
|--------|---------|--------|
| OLD | `total_weight = Number(no_of_bags) × BAG_WEIGHT` where `BAG_WEIGHT = bag_weight || 60` | `yarn.js` L104 |
| NEW | `totalWeight = bags * bagWt` where `bagWt = dto.bagWeight ?? 60` | `yarn-lots.service.ts` |

✅ **MATCH** — Same formula, same default bag weight (60 kg).

---

### 1b. Total Cost

| System | Formula | Source |
|--------|---------|--------|
| OLD | `total_cost = total_weight × rate_per_kg` | `yarn.js` L105 |
| NEW | `totalCost = taxable + cgstAmt + sgstAmt` where `taxable = totalWeight × rate` | `yarn-lots.service.ts` |

⚠️ **MISMATCH — Breaking change:**
- Old total_cost = pure `weight × rate` (no taxes included)
- New totalCost = full GST-inclusive total
- Old UI displayed this as "Amount (Rs)" — new amount will be 5% higher (cgst 2.5% + sgst 2.5%)

---

### 1c. GST Calculations (NEW only)

```
taxable_amount = totalWeight × ratePerKg
cgstAmount     = taxable_amount × (cgstRate / 100)    [default cgstRate = 2.5]
sgstAmount     = taxable_amount × (sgstRate / 100)    [default sgstRate = 2.5]
totalCost      = taxable_amount + cgstAmount + sgstAmount
```

> Source: `yarn-lots.service.ts` create() method

Note: Old system computed GST only in the **print/PO preview dialog** on the frontend (client-side), not stored in DB. New system stores all GST amounts in the database.

---

## 2. Yarn Balance Logic

### 2a. Available Weight (Yarn / YarnLot)

| System | How tracked | Source |
|--------|------------|--------|
| OLD | `available_weight` starts at `total_weight`, decremented by `received_weight` on each `/api/knitting/issue` call | `knitting.js` L652: `yarn.available_weight - weight` |
| NEW | `availableWeight` starts at `totalWeight`, decremented on `POST /yarn-lots/:id/issue` | `yarn-lots.service.ts` issue() method |

✅ **MATCH** — Same approach.

### 2b. Knitter Balance (OLD only)

```javascript
// recalculateKnitterBalance(knitter_id) — knitting.js L54-67
balance = Σ(total_yarn_qty for all knittings) - Σ(received_weight for all knittings)
→ KnitterName.yarn_balance = balance
```

> ⚠️ NOT in new system — `yarn_balance` field removed from `Knitter` model.

### 2c. KnitterStock

| System | Formula | Source |
|--------|---------|--------|
| OLD | `received_weight += weight`, `remaining_weight += weight` on issue | `knitting.js` L662-665 |
| NEW | Same — upsert: `receivedWeight += weight`, `remainingWeight += weight` | `yarn-lots.service.ts` |
| OLD return | `remaining_weight -= weight` on delivery note transfer | `knitting.js` L786 |
| NEW | Same pattern | `delivery-notes` service |

✅ **MATCH**

### 2d. Yarn Stock Remaining (OLD hf-codes endpoint)

```javascript
// GET /api/yarn/list/hf-codes
remaining = yarn.total_weight - Σ(knittingYarnUsage.quantity for that yarn_id)
```

> This is a computed view — not stored. Used for dropdown balance display.

---

## 3. Dyeing Process Loss

### Formula

| System | Formula | Source |
|--------|---------|--------|
| OLD | `process_loss = ((iw - fw) / iw) × 100` where `iw = initial_weight`, `fw = final_weight` | `dyeing.js` L81-83 |
| NEW | `processLoss = ((initial - finalWeight) / initial) × 100` | `dyeings.service.ts` L44-46 |

✅ **MATCH** — Same percentage formula.

### Dyeing via Grey Fabric Lot (OLD)

```javascript
// dyeing.js L167-169 — POST /api/dyeing/program
process_loss = lot.grey_weight > 0
  ? ((lot.grey_weight - output_weight) / lot.grey_weight) * 100
  : 0;
```

✅ Same formula, uses `grey_weight` as the base (initial weight).

---

## 4. Compacting Process Loss — ⚠️ CRITICAL

### OLD Formula (correct per business rule)

```javascript
// compacting.js L74-78 — POST /api/compacting
const grey_fabric_weight = dyeing.initial_weight;  // ← fetched from Dyeing record
const process_loss = grey_fabric_weight > 0
  ? ((grey_fabric_weight - fw) / grey_fabric_weight) * 100
  : 0;
```

**Business rule satisfied:** Loss = (Grey Weight − Compact Weight) / Grey Weight × 100

The variable `dyeing.initial_weight` IS the grey weight because in the dyeing flow:
- Knitting → KnittingLotEntry.weight → Dyeing.initial_weight (= grey fabric weight sent to dyer)

### NEW Formula (compactings.service.ts)

```typescript
// compactings.service.ts L15-17
const processLoss = dto.finalWeight
  ? ((dyeing.initialWeight - dto.finalWeight) / dyeing.initialWeight) * 100
  : undefined;
```

**Where `dyeing.initialWeight` comes from:**
- In new schema, `Dyeing.initialWeight` = `MemoLine.sentWeight` (the weight sent via memo)
- This IS the grey weight sent to the dyer

✅ **FORMULA IS CORRECT** in both old and new — uses `initialWeight` (grey weight), not `finalWeight` (dyed weight).

> However: if `Dyeing.finalWeight` is set before compacting and someone reads it as the initial weight, the formula would be wrong. The code correctly uses `dyeing.initialWeight` not `dyeing.finalWeight`.

### Compacting PUT (OLD — recalculates on update)

```javascript
// compacting.js L114-120
const dyeing = await prisma.dyeing.findUnique({ where: { lot_no: existing.lot_no } });
const grey_fabric_weight = dyeing ? dyeing.initial_weight : Number(initial_weight);
const process_loss = grey_fabric_weight > 0
  ? ((grey_fabric_weight - fw) / grey_fabric_weight) * 100
  : 0;
```

✅ Uses `dyeing.initial_weight` as fallback, not `initial_weight` from request body.

> ⚠️ NEW compactings.service.ts has no `update()` method yet — only `create()` and `findAll()`.

---

## 5. KnitterProgram / Grey Fabric Production (OLD)

```javascript
// POST /api/knitting/program
// quantity_used = yarn used (input)
// grey_weight   = actual fabric weight (output)
// anomalyFlag   = grey_weight > quantity_used (new schema field)
```

> In new schema, `KnitterProgram.anomalyFlag = true` when `greyWeight > quantityUsed`.
> This is a new validation not in old system.

---

## 6. Yarn Stock Validation (OLD — validateYarnStock)

```javascript
// knitting.js L207-238
remaining = yarn.total_weight - Σ(knittingYarnUsage.quantity for other knittings)
if (requested_quantity > remaining) → error
```

> ⚠️ NOT IMPLEMENTED in new knittings service. Can over-issue yarn.

---

## 7. Summary of Calculation Differences

| Calculation | OLD | NEW | Status |
|------------|-----|-----|--------|
| Total weight | bags × bagWt | bags × bagWt | ✅ Same |
| Yarn total_cost | weight × rate | taxable + cgst + sgst | ⚠️ Different |
| Available weight | decremented on issue | decremented on issue | ✅ Same |
| Knitter balance | stored on KnitterName | ❌ Not tracked | ⚠️ Missing |
| Dyeing process loss | (initial - final) / initial × 100 | Same | ✅ Same |
| Compacting process loss | (grey - compact) / grey × 100 | Same formula | ✅ Same |
| Yarn stock validation | Full validation on create/update | ❌ Not implemented | ⚠️ Missing |
| Amount in words | Computed on frontend for PO print | ❌ Not in new UI | ⚠️ Missing |
