# API Diff Map — Fabric Flow Phase 0

> Generated: 2026-05-22 | Documents what changed, was removed, or was added between OLD and NEW APIs

---

## 1. Endpoints in OLD but MISSING in NEW

| Old Endpoint | Purpose | Severity |
|-------------|---------|----------|
| `POST /api/auth/login` | Authentication | 🔴 CRITICAL |
| `GET /api/yarn/hf/:hf_code` | Lookup yarn by HF code | 🟠 HIGH |
| `GET /api/yarn/po/:po_no` | All yarns for a PO (for print) | 🟠 HIGH |
| `GET /api/yarn/list/hf-codes` | HF codes with remaining stock | 🟠 HIGH |
| `GET /api/yarn-inward` | Yarn inward list | 🔴 CRITICAL (404 error) |
| `GET /api/knitting/list/hf-codes` | Simple HF code list | 🟡 MEDIUM |
| `GET /api/knitting/yarn-remaining/:hf_code` | Remaining yarn stock | 🟡 MEDIUM |
| `GET /api/knitting/grey-fabric` | Available grey fabric lots | 🟡 MEDIUM |
| `PUT /api/knitting/:id/grey-fabric` | Update grey fabric specs | 🟡 MEDIUM |
| `GET /api/knitting/stock?knitterId=` | Knitter's yarn stock | 🟡 MEDIUM |
| `POST /api/knitting/issue` | Issue yarn to knitter | 🟠 HIGH (exists as `/yarn-lots/:id/issue`) |
| `GET /api/knitting/program` | Knitter programs | 🟡 MEDIUM |
| `POST /api/knitting/program` | Create knitter program | 🟡 MEDIUM |
| `GET /api/knitting/delivery-notes` | List delivery notes | 🟡 MEDIUM |
| `POST /api/knitting/delivery-note` | Create delivery note | 🟡 MEDIUM |
| `POST /api/dyeing` | Manual dyeing create | 🟠 HIGH |
| `POST /api/dyeing/program` | Dyeing from grey lot | 🟠 HIGH |
| `GET /api/dyeing/list/lot-nos` | Lot number dropdown | 🟡 MEDIUM |
| `PUT /api/compacting/:id` | Update compacting | 🟠 HIGH |
| `DELETE /api/compacting/:id` | Delete compacting | 🟡 MEDIUM |
| `GET /api/analytics` | Dashboard metrics | 🟡 MEDIUM |
| `GET /api/search` | Cross-module search | 🟡 MEDIUM |
| `POST /api/master/fabric-descriptions` | Fabric descriptions master | 🟡 MEDIUM |

---

## 2. Endpoints Added in NEW (not in OLD)

| New Endpoint | Purpose | Notes |
|-------------|---------|-------|
| `GET/POST/PATCH /yarn-inward` | Yarn receipt document | NEW concept |
| `GET/POST /memos` | Dyeing dispatch memos | NEW workflow |
| `GET/POST /memos/:id/lines` | Memo line items | NEW |
| `GET/POST /dyeing-programs` | Dyeing programs | NEW |
| `GET/POST /grey-fabric-lots` | Grey fabric lot management | Expanded from old |
| `GET/POST /purchase-orders` | PO documents | NEW (was frontend-only in old) |
| `GET /audit-logs` | Audit trail | NEW |
| `GET/POST /grey-fabric-inwards` | External grey fabric purchase | NEW |
| `GET/POST /inhouse-knitted-fabrics` | Inhouse fabric records | Existed in old |

---

## 3. Endpoints with Changed Request/Response Structure

### Yarn List Response

| Aspect | OLD | NEW |
|--------|-----|-----|
| Wrapper | `{ data: [], total, page, limit }` | `[]` plain array |
| Pagination | `?page=1&limit=50` | Not consistently implemented |
| Search | `?search=` | `?hfCode=` (partial) |

### Yarn Create Body Field Names

| OLD Field | NEW Field | Change |
|-----------|-----------|--------|
| `mill_name_id` | `millId` | Renamed |
| `no_of_bags` | `noOfBags` | camelCase |
| `bag_weight` | `bagWeight` | camelCase |
| `rate_per_kg` | `ratePerKg` | camelCase |
| `total_weight` | *(computed)* | Not in request |
| `total_cost` | *(computed)* | Not in request |
| `invoice_no` | `invoiceNo` | camelCase |
| `delivery_to` | `deliveryTo` | camelCase |
| `purchase_order_no` | `purchaseOrderNo` | camelCase |
| `issued_date` | ❌ Removed | |
| — | `cgstRate`, `sgstRate` | New GST fields |

### Dyeing Update (PATCH) Body

| OLD Field | NEW Field | Change |
|-----------|-----------|--------|
| `initial_weight` | `initialWeight` | camelCase |
| `knitterDcNo` | `knitterDcNo` | ✅ Same |
| `companyDcNo` | `companyDcNo` | ✅ Same |
| `compacterId` | `compacterId` | ✅ Same |
| `dateGiven` | `dateGiven` | ✅ Same |
| — | `finalWeight` | NEW in update |
| — | `washTypeId` | NEW in update |
| — | `status` | NEW in update |

### Compacting Create Body

| OLD Field | NEW Field | Change |
|-----------|-----------|--------|
| `hf_code` | ❌ Removed | |
| `count` | ❌ Removed | |
| `lot_no` | `lotNo` | camelCase |
| `initial_weight` | ❌ Removed | Auto-fetched from dyeing |
| `compacter_name_id` | `compacterId` | Renamed |
| `final_dia` | ❌ Removed | |
| `colour_id` | `colourId` | camelCase |
| `final_weight` | `finalWeight` | camelCase |
| `date` | ❌ Removed | |
| — | `dyeingId` | NEW — FK instead of lot_no text |

### Master Data — Colour Create

| OLD Field | NEW Field | Change |
|-----------|-----------|--------|
| `name` | `name` | ✅ Same |
| *(no code)* | `code` | ⚠️ NEW REQUIRED |
| — | `hexCode` | Optional |
| — | `isActive` | Optional |

---

## 4. Field Naming Convention Change (Global)

All field names changed from `snake_case` to `camelCase`:

| OLD Pattern | NEW Pattern |
|------------|------------|
| `hf_code` | `hfCode` |
| `mill_name_id` | `millId` |
| `dyer_name_id` | `dyerId` |
| `compacter_name_id` | `compacterId` |
| `no_of_bags` | `noOfBags` |
| `bag_weight` | `bagWeight` |
| `rate_per_kg` | `ratePerKg` |
| `total_weight` | `totalWeight` |
| `available_weight` | `availableWeight` |
| `process_loss` | `processLoss` |
| `initial_weight` | `initialWeight` |
| `final_weight` | `finalWeight` |
| `colour_id` | `colourId` |
| `wash_type_id` | `washTypeId` |
| `lot_no` | `lotNo` |
| `dc_no` | `dcNo` |
| `date_given` | `dateGiven` |
| `no_of_rolls` | `noOfRolls` |
| `grey_fabric_weight` | `greyFabricWeight` |
| `received_weight` | `receivedWeight` |

> ⚠️ This is a global breaking change for any frontend that uses old field names.

---

## 5. Status Filter Changes

| Module | OLD Filter | NEW Filter |
|--------|-----------|-----------|
| Yarn | `?search=` only | `?hfCode=` |
| Dyeing | `?search=` (lot_no or hf_code) | No search implemented |
| Compacting | `?search=` (lot_no or hf_code) | No search implemented |
| Grey Fabric | `?status=AVAILABLE` (old query param) | `?status=` enum |

---

## 6. Breaking API Changes Summary

| # | Change | Severity |
|---|--------|----------|
| 1 | No auth endpoint — all APIs are unprotected | 🔴 CRITICAL |
| 2 | `/yarn-inward` returns 404 | 🔴 CRITICAL |
| 3 | List responses changed from `{ data, total, page, limit }` to plain `[]` | 🔴 HIGH |
| 4 | All request body field names changed to camelCase | 🔴 HIGH |
| 5 | `POST /api/dyeing` (manual create) missing | 🔴 HIGH |
| 6 | `PUT /api/compacting/:id` missing | 🟠 HIGH |
| 7 | Colour/WashType create now requires `code` field | 🟠 HIGH |
| 8 | Compacting no longer accepts `lot_no`, requires `dyeingId` | 🟠 HIGH |
| 9 | Dyeing creation requires `memoLineId` | 🟠 HIGH |
| 10 | `GET /api/yarn/list/hf-codes` (with remaining) missing | 🟡 MEDIUM |
