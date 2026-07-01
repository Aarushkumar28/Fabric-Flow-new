# Schema Diff Map — Fabric Flow Phase 0

> Generated: 2026-05-22 | OLD = `backend/prisma/schema.prisma` | NEW = `apps/textile-flow-svc/prisma/schema.prisma`

---

## 1. Tables Renamed

| OLD Name | NEW Name | DB Map |
|----------|---------|--------|
| `MillName` | `Mill` | `@@map("mills")` |
| `KnitterName` | `Knitter` | `@@map("knitters")` |
| `DyerName` | `Dyer` | `@@map("dyers")` |
| `CompacterName` | `Compacter` | `@@map("compacters")` |
| `Yarn` | `YarnLot` | `@@map("yarn_lots")` |
| `KnittingYarnUsage` | `KnittingYarnUsage` | field renames only |
| `KnitterStock` | `KnitterStock` | field renames |
| `DeliveryNote` | `DeliveryNote` | field renames |
| `Compacting` | `Compacting` | camelCase field names |
| `YarnReceipt` | `YarnReceipt` | minor field renames |
| `GreyFabricLot` | `GreyFabricLot` | structure changed |
| `Dyeing` | `Dyeing` | major structural change |
| `InhouseKnittedFabric` | `InhouseKnittedFabric` | structure changed |
| `DyeingOrder` | `DyeingOrder` | field renames |
| `DyeingLot` | `DyeingOrderLine` | renamed |

---

## 2. Tables Added (NEW only)

| New Table | Purpose | Impact |
|-----------|---------|--------|
| `Memo` | Dyeing dispatch memo document | New workflow stage |
| `MemoLine` | Line item of memo (per grey lot) | Dyeing now requires memo |
| `DyeingProgram` | Formal dyeing programme | New concept |
| `YarnInward` | Yarn receipt from mill | Replaces part of old Yarn logic |
| `GreyFabricInward` | External grey fabric purchase | New source for grey lots |
| `PurchaseOrder` | PO header record | Was print-only in old system |
| `PurchaseOrderItem` | PO line items | |
| `AuditLog` | Audit trail with old/new data | |

---

## 3. Tables Removed (OLD only, not in NEW)

| Old Table | Was Used For | Risk |
|-----------|-------------|------|
| `FabricDescription` | Dropdown for fabric type in Knitting form | ⚠️ HIGH — Knitting form had a required field for this |
| `GreyFabric` | Specs attached to Knitting record (gauge, gsm, loopLength) | ⚠️ MEDIUM — data lost |
| `User` | Authentication | ❌ CRITICAL — no auth in new system |

---

## 4. Column-Level Diffs Per Table

### Mill / MillName

| Column | OLD | NEW | Change |
|--------|-----|-----|--------|
| id | Int | Int | ✅ Same |
| name | String UNIQUE | String (not unique) | ⚠️ Unique constraint removed |
| address_line1 | address_line1 | addressLine1 @map("address_line1") | Rename (camelCase) |
| address_line2 | address_line2 | addressLine2 | Rename |
| address_line3 | address_line3 | ❌ REMOVED | Breaking |
| state | String? | String? | ✅ Same |
| pin_code | String? | pincode (renamed) | Rename |
| gstn | String? | gstin String? UNIQUE | Renamed + UNIQUE added |
| email | String? | email + phone added | phone is new |
| city | ❌ Not in old | city String? | New |
| isActive | ❌ Not in old | isActive Boolean DEFAULT true | New |

### Knitter / KnitterName

| Column | OLD | NEW | Change |
|--------|-----|-----|--------|
| yarn_balance | Float DEFAULT 0 | ❌ REMOVED | ⚠️ Was shown in UI |
| address_line3 | String? | ❌ REMOVED | |
| gstn | String? | gstin UNIQUE | |
| phone | ❌ | String? | New |
| city | ❌ | String? | New |
| isActive | ❌ | Boolean DEFAULT true | New |

### Colour

| Column | OLD | NEW | Change |
|--------|-----|-----|--------|
| name | String UNIQUE | String | Unique removed |
| code | ❌ | String UNIQUE | ⚠️ NEW REQUIRED field |
| hexCode | ❌ | String? | New |
| isActive | ❌ | Boolean DEFAULT true | New |

> ⚠️ `code` is required on Colour create in new schema. Old colours have no code — migration needed.

### WashType

| Column | OLD | NEW | Change |
|--------|-----|-----|--------|
| name | String UNIQUE | String | Unique removed |
| code | ❌ | String UNIQUE | ⚠️ NEW REQUIRED |
| isActive | ❌ | Boolean DEFAULT true | New |

### Yarn → YarnLot

| Column (OLD) | Column (NEW) | Change |
|-------------|-------------|--------|
| hf_code | hfCode | camelCase |
| purchase_order_no | purchaseOrderNo | camelCase |
| invoice_no | invoiceNo | camelCase |
| delivery_to | deliveryTo | camelCase |
| mill_name_id | millId | renamed |
| status | status DEFAULT 'ACTIVE' | value changed |
| no_of_bags | noOfBags | camelCase |
| bag_weight | bagWeight | camelCase |
| total_weight | totalWeight | camelCase |
| available_weight | availableWeight | camelCase |
| rate_per_kg | ratePerKg | camelCase |
| total_cost | totalCost | camelCase (formula changed) |
| issued_date | ❌ REMOVED | ⚠️ Lost |
| description | description | ✅ Same |
| count | count | ✅ Same |
| quality | quality | ✅ Same |
| ❌ | cgstRate, sgstRate, cgstAmount, sgstAmount | NEW — full GST breakdown |
| ❌ | colourId | NEW |
| ❌ | yarnInwardId | NEW — links to YarnInward |

### Dyeing (MAJOR STRUCTURAL CHANGE)

| Column (OLD) | Column (NEW) | Change |
|-------------|-------------|--------|
| lot_no String UNIQUE | lotNo String UNIQUE | Rename |
| hf_code | hfCode | Rename |
| source_type | sourceType | Rename |
| fabric_code | ❌ REMOVED | Breaking |
| count | ❌ REMOVED | Breaking |
| initial_weight | initialWeight | Rename |
| gg | ❌ REMOVED | Breaking |
| initial_dia | ❌ REMOVED | Breaking |
| final_dia | ❌ REMOVED | Breaking |
| no_of_rolls | noOfRolls | Rename |
| final_weight | finalWeight | Rename |
| process_loss | processLoss | Rename |
| date | ❌ REMOVED | Breaking |
| colour_id | colourId | Rename |
| dyer_name_id | dyerId | Rename |
| wash_type_id | washTypeId | Rename |
| compacterId | compacterId | ✅ Same |
| greyFabricLotId | ❌ (indirect via MemoLine) | Breaking |
| knitterDcNo | knitterDcNo | ✅ Same |
| companyDcNo | companyDcNo | ✅ Same |
| dateGiven | dateGiven | ✅ Same |
| ❌ | memoLineId UNIQUE FK | ⚠️ NEW REQUIRED — all dyeings need a memo |
| status | status | ✅ Same field, different logic |

### Compacting (STRUCTURAL CHANGE)

| Column (OLD) | Column (NEW) | Change |
|-------------|-------------|--------|
| lot_no String UNIQUE | lotNo String UNIQUE | Rename |
| hf_code | ❌ REMOVED | |
| count | ❌ REMOVED | |
| initial_weight | ❌ REMOVED | ⚠️ Was key for loss calc |
| compacter_name_id | compacterId | Renamed to FK→Compacter |
| final_dia | ❌ REMOVED | |
| colour_id | colourId | Rename |
| final_weight | finalWeight | Rename |
| process_loss | processLoss | Rename |
| date | ❌ REMOVED | |
| ❌ | dyeingId FK→Dyeing | NEW — proper FK |

---

## 5. BREAKING CHANGES Summary

| # | Breaking Change | Severity | Impact |
|---|----------------|----------|--------|
| 1 | `Dyeing.memoLineId` now required | 🔴 CRITICAL | Cannot create dyeing without a memo in new system |
| 2 | `FabricDescription` table removed | 🔴 CRITICAL | Knitting form `fabric_description_id` field is orphaned |
| 3 | `User` table removed | 🔴 CRITICAL | No auth system in new repo |
| 4 | `Colour.code` now required | 🔴 HIGH | All existing colours need a code |
| 5 | `WashType.code` now required | 🔴 HIGH | All existing wash types need a code |
| 6 | `Yarn.status` values changed | 🟠 HIGH | UI status chips will break |
| 7 | `Compacting.initial_weight` removed | 🟠 HIGH | Loss calculation source changed |
| 8 | `Dyeing.gg`, `initial_dia`, `final_dia` removed | 🟠 MEDIUM | These fields shown in old dyeing UI |
| 9 | `Dyeing.fabric_code` removed | 🟠 MEDIUM | INHOUSE_FABRIC flow broken |
| 10 | `GreyFabric` table removed | 🟡 MEDIUM | Knitting grey fabric specs lost |
| 11 | `KnitterName.yarn_balance` removed | 🟡 MEDIUM | Was displayed in old UI |
| 12 | `Mill.name` no longer UNIQUE | 🟡 LOW | Duplicates now possible |
