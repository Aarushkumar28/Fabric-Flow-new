# API Contract Map — Fabric Flow Phase 0

> Generated: 2026-05-22 | OLD = Express.js routes | NEW = NestJS controllers

---

## 1. Auth

| | OLD | NEW |
|-|-----|-----|
| Login | `POST /api/auth/login` | ❌ Not implemented |
| Body | `{ username, password }` | — |
| Response | `{ token, user }` | — |

---

## 2. Master Data

### OLD — Single generic route `/api/master/:entity`

Entities: `mill-names`, `knitter-names`, `dyer-names`, `compacter-names`, `colours`, `wash-types`, `fabric-descriptions`

| Method | Old Path | Body / Params | Response |
|--------|---------|--------------|---------|
| GET | `/api/master/:entity` | — | `[{ id, name, ...addressFields }]` |
| POST | `/api/master/:entity` | `{ name, address_line1, address_line2, address_line3, state, pin_code, gstn, email }` | Created record |
| PUT | `/api/master/:entity/:id` | Same as POST | Updated record |
| DELETE | `/api/master/:entity/:id` | — | `{ message }` |

### NEW — Separate routes per entity

| Method | New Path | Notes |
|--------|---------|-------|
| GET | `/mills` | |
| POST | `/mills` | `{ name, addressLine1, city, state, pincode, email, phone, gstin }` |
| PUT | `/mills/:id` | |
| DELETE | `/mills/:id` | |
| GET | `/knitters` | |
| POST/PUT/DELETE | `/knitters/:id` | Similar structure |
| GET | `/dyers` | |
| GET | `/compacters` | |
| GET | `/colours` | |
| POST | `/colours` | Requires `code` field (UNIQUE) |
| GET | `/wash-types` | |
| POST | `/wash-types` | Requires `code` field (UNIQUE) |

---

## 3. Yarn / YarnLot

### OLD

| Method | Path | Query | Body | Response |
|--------|------|-------|------|---------|
| GET | `/api/yarn` | `?page=1&limit=50&search=` | — | `{ data: [...], total, page, limit }` |
| GET | `/api/yarn/:id` | — | — | Yarn record with millName |
| GET | `/api/yarn/hf/:hf_code` | — | — | First yarn matching hf_code |
| GET | `/api/yarn/po/:po_no` | — | — | All yarns with this PO number |
| GET | `/api/yarn/list/hf-codes` | — | — | `[{ id, hf_code, description, total_weight, used, remaining }]` |
| POST | `/api/yarn` | — | `{ mill_name_id, description, hf_code, count, purchase_order_no, invoice_no, delivery_to, quality, no_of_bags, bag_weight, rate_per_kg, issued_date }` | Created yarn |
| PUT | `/api/yarn/:id` | — | Same as POST | Updated yarn |
| DELETE | `/api/yarn/:id` | — | — | `{ message }` |

### NEW

| Method | Path | Body | Notes |
|--------|------|------|-------|
| GET | `/yarn-lots` | — | |
| POST | `/yarn-lots` | `{ hfCode, millId, purchaseOrderNo, invoiceNo, deliveryTo, description, count, quality, noOfBags, bagWeight, ratePerKg, cgstRate, sgstRate }` | |
| GET | `/yarn-lots/:id` | — | |
| PATCH | `/yarn-lots/:id` | Partial fields | |
| DELETE | `/yarn-lots/:id` | — | |
| POST | `/yarn-lots/:id/issue` | `{ knitterId, weight }` | Issue yarn to knitter |
| GET | `/yarn-inward` | — | ❌ 404 currently |

---

## 4. Knitting

### OLD

| Method | Path | Query | Body | Notes |
|--------|------|-------|------|-------|
| GET | `/api/knitting` | `?page=1&limit=50&search=` | — | Full records with lots, usages |
| GET | `/api/knitting/:id` | — | — | |
| POST | `/api/knitting` | — | `{ hf_code, dc_no, knitter_name_id, total_yarn_qty, loop_length, dia, count, gauge, date_given, fabric_description_id, grey_fabric_weight, received_weight, other_yarn_type, other_yarn_percentage, no_of_rolls, date, yarnUsages[], lots[], greyFabric }` | Auto-creates Dyeing |
| PUT | `/api/knitting/:id` | — | Same as POST | Auto-syncs Dyeing |
| DELETE | `/api/knitting/:id` | — | — | Cascades to usages, lots, dyeings |
| GET | `/api/knitting/list/hf-codes` | — | — | Simple list |
| GET | `/api/knitting/yarn-remaining/:hf_code` | — | — | Remaining stock |
| GET | `/api/knitting/grey-fabric` | `?knitterId=` | — | Available grey fabric lots |
| PUT | `/api/knitting/:id/grey-fabric` | — | Grey fabric specs | |
| GET | `/api/knitting/stock` | `?knitterId=` | — | KnitterStock for knitter |
| POST | `/api/knitting/issue` | — | `{ knitterId, yarnId, received_weight }` | Issue yarn |
| GET | `/api/knitting/program` | `?knitterId=` | — | Knitter programs |
| POST | `/api/knitting/program` | — | `{ knitterId, yarns[], grey_weight, gauge, loop_length, dia, gsm, description, productionDate }` | |
| GET | `/api/knitting/delivery-notes` | — | — | All delivery notes |
| POST | `/api/knitting/delivery-note` | — | `{ sourceKnitterId, destKnitterId, yarnId, quantity, transfer_dc_no }` | |

### NEW

| Method | Path | Notes |
|--------|------|-------|
| GET | `/knittings` | |
| POST | `/knittings` | |
| GET | `/knitting-lots` | Separate resource |
| GET | `/knitter-stock` | |
| GET | `/delivery-notes` | |
| POST | `/delivery-notes` | |

> ⚠️ New does not have: `/list/hf-codes`, `/yarn-remaining/:hf_code`, `/grey-fabric`, `/:id/grey-fabric`

---

## 5. Dyeing

### OLD

| Method | Path | Body | Notes |
|--------|------|------|-------|
| GET | `/api/dyeing` | `?page=&limit=&search=` | Full list |
| GET | `/api/dyeing/:id` | — | |
| POST | `/api/dyeing` | `{ hf_code, source_type, fabric_code, count, lot_no, initial_weight, dyer_name_id, wash_type_id, colour_id, gg, initial_dia, final_dia, no_of_rolls, final_weight, date }` | Manual create |
| POST | `/api/dyeing/program` | `{ greyFabricLotId, dyerId, lot_no, colour_id, output_weight, gauge, loop_length, knitterDcNo, companyDcNo, compacterId }` | From grey lot |
| PUT | `/api/dyeing/:id` | `{ initial_weight, knitterDcNo, companyDcNo, compacterId, dateGiven }` | Partial update |
| DELETE | `/api/dyeing/:id` | — | Reverts grey lot to AVAILABLE |
| GET | `/api/dyeing/list/lot-nos` | — | For dropdowns |

### NEW

| Method | Path | Body | Notes |
|--------|------|------|-------|
| GET | `/dyeings` | — | |
| GET | `/dyeings/:id` | — | |
| PATCH | `/dyeings/:id` | `{ initialWeight, finalWeight, knitterDcNo, companyDcNo, compacterId, washTypeId, status, dateGiven }` | |
| DELETE | `/dyeings/:id` | — | |

> ⚠️ Missing: `POST /dyeings` (manual create), `POST /dyeings/program`, `/dyeings/list/lot-nos`

---

## 6. Compacting

### OLD

| Method | Path | Body | Notes |
|--------|------|------|-------|
| GET | `/api/compacting` | `?page=&limit=&search=` | |
| GET | `/api/compacting/:id` | — | |
| POST | `/api/compacting` | `{ hf_code, count, lot_no, initial_weight, compacter_name_id, final_dia, colour_id, final_weight, date }` | Validates lot_no in Dyeing |
| PUT | `/api/compacting/:id` | `{ hf_code, count, initial_weight, compacter_name_id, final_dia, colour_id, final_weight, date }` | |
| DELETE | `/api/compacting/:id` | — | |

### NEW

| Method | Path | Body | Notes |
|--------|------|------|-------|
| GET | `/compactings` | — | |
| POST | `/compactings` | `{ lotNo, dyeingId, compacterId, colourId, finalWeight }` | Uses dyeingId FK |

> ⚠️ Missing: `PUT /compactings/:id`, `DELETE /compactings/:id`

---

## 7. Memos (NEW only)

| Method | Path | Body | Notes |
|--------|------|------|-------|
| GET | `/memos` | — | |
| POST | `/memos` | `{ dyerId, issueDate, remarks, lines: [{ greyFabricLotId, sentWeight }] }` | |
| GET | `/memos/:id` | — | |

---

## 8. Analytics / Search

| Method | Old Path | New Path | Status |
|--------|---------|---------|--------|
| GET | `/api/analytics` | ❌ | Not in new |
| GET | `/api/search?q=&type=` | ❌ | Not in new |
| GET | `/api/knitting/yarn-remaining/:hf_code` | ❌ | Not in new |

---

## 9. Response Structure Differences

| Aspect | OLD | NEW |
|--------|-----|-----|
| List response | `{ data: [], total, page, limit }` | `[]` (plain array, no wrapper) |
| Pagination | Query params: `page`, `limit` | Varies per module |
| Relations included | Yes (knitterName, fabricDescription, etc.) | Yes but fewer relations |
| Field naming | `snake_case` | `camelCase` |
| Timestamps | `createdAt`, `updatedAt` | `createdAt`, `updatedAt` |
