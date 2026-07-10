# Frontend Action Map — Fabric Flow Phase 0

> Generated: 2026-05-22 | OLD = Vite/React JSX | NEW = Next.js/TSX

---

## 1. Yarn / Yarn Inventory Page

### OLD (`frontend/src/pages/Yarn.jsx`)

**Route:** `/yarn`  
**Data Source:** `GET /api/yarn?page=&limit=50&search=`

#### Table Columns Displayed
| Column | Field |
|--------|-------|
| HF Code | `hf_code` |
| PO No | `purchase_order_no` |
| Invoice No. | `invoice_no` |
| Delivery To | `delivery_to` |
| Mill Name | `millName.name` |
| Description | `description` |
| Count | `count` |
| Quality | `quality` |
| Bags | `no_of_bags` |
| Bag Wt | `bag_weight` |
| Total Wt | `total_weight` |
| Rate/Kg | `rate_per_kg` |
| Amount (Rs) | `total_cost.toFixed(2)` |
| Issued Date | `issued_date` (formatted) |
| Status | Chip: `Received` (green) or `Pending` (orange) |

#### Buttons / Actions
| Action | Trigger | API |
|--------|---------|-----|
| **Add Yarn** | Top-right button | `POST /api/yarn` |
| **Edit** | Row action | `PUT /api/yarn/:id` |
| **Delete** | Row action | `DELETE /api/yarn/:id` |
| **Print PO** | Row action | Opens PO print dialog |
| **Search** | Search field | `?search=` query param |
| **Pagination** | DataTable | `?page=&limit=` |

#### Add/Edit Form Fields
| Field | Type | Default | Notes |
|-------|------|---------|-------|
| Description | text | | Required |
| Mill Name | SmartDropdown | | Required |
| HF Code | text | | Optional, auto-generated if empty |
| Purchase Order No | text | | |
| Invoice No(s) | text | | Multiple via commas |
| Delivery To (Knitter) | SmartDropdown | | Value = knitter name string |
| Count | text | | |
| Quality | select | 'rl' | Options: RL, VL |
| No of Bags | number | | |
| Bag Weight (kg) | number | 60 | Default shown |
| Rate Per Kg | number | | |
| Issued Date | date | today | |

#### PO Print Flow (3 dialogs)
1. **Pre-Print Dialog** — Editable form (mill details, knitter details, yarn items, agent, CGST%, SGST%, delivery date)
2. **Confirm Dialog** — Summary with calculated totals (taxable + CGST + SGST + grand total + amount in words)
3. **PO Viewer** — Printable A4 landscape format with `window.print()`

**PO Print Auto-fetches:**
- All yarns with same PO number: `GET /api/yarn/po/:po_no`
- Knitter master data: `GET /api/master/knitter-names`

### NEW (`apps/frontend/app/tracker/yarn-inward/page.tsx`)

**Status: ❌ Backend returns 404**

Expected API: `GET /yarn-inward`  
Key difference: new repo separates yarn inward receipt from yarn lots.

---

## 2. Knitting Page

### OLD (`frontend/src/pages/Knitting.jsx`)

**Route:** `/knitting`  
**Data Source:** `GET /api/knitting?page=&limit=50&search=`

#### Table Columns
| Column | Field |
|--------|-------|
| HF Code | `hf_code` |
| DC No | `dc_no` |
| Knitter | `knitterName.name` |
| Fabric Type | `fabricDescription.name` |
| Count | `count` |
| Total Yarn Qty | `total_yarn_qty` |
| Grey Fabric Wt | `grey_fabric_weight` |
| Received Wt | `received_weight` |
| Date Given | `date_given` |
| Date | `date` |
| Lots | Count of knitting lots |

#### Buttons / Actions
| Action | Trigger | API |
|--------|---------|-----|
| **Add Knitting** | Top button | `POST /api/knitting` |
| **Edit** | Row action | `PUT /api/knitting/:id` |
| **Delete** | Row action | `DELETE /api/knitting/:id` |
| **Issue Yarn** | Separate section/button | `POST /api/knitting/issue` |
| **Delivery Note** | Separate section | `POST /api/knitting/delivery-note` |
| **Add Program** | KnitterProgram section | `POST /api/knitting/program` |

#### Complex Knitting Form Fields
| Section | Fields |
|---------|--------|
| Header | hf_code (auto from yarn), dc_no, knitter_name, date_given, date |
| Fabric | fabric_description (dropdown), count, gauge, loop_length, dia |
| Grey Fabric | grey_fabric_weight, received_weight, no_of_rolls |
| Other Yarn | other_yarn_type, other_yarn_percentage |
| **Yarn Usages** | Dynamic array: yarn HF code autocomplete + quantity per HF code |
| **Lots** | Dynamic array: lot_no, dyer, no_of_rolls, job_work_no + colour entries |
| **Colour Entries** | Per lot: colour dropdown + weight |
| **Grey Fabric Specs** | description, gauge, loopLength, diameter, gsm, quantity |

**Key behaviours:**
- Yarn remaining balance shown next to each HF code in dropdown
- At least one yarn usage required (validated)
- Grey fabric quantity validated ≤ total yarn usage
- Saving lots **auto-creates Dyeing records** in background
- DC No uniqueness enforced with friendly error message

### NEW Status
⚠️ Partial implementation. Complex form with lots/colours/yarn-usages may be missing. Auto-dyeing creation not implemented.

---

## 3. Dyeing Page

### OLD (`frontend/src/pages/Dyeing.jsx`)

**Route:** `/dyeing`  
**Data Source:** `GET /api/dyeing?page=&limit=50&search=`

#### Table Columns
| Column | Notes |
|--------|-------|
| Lot No | `lot_no` |
| HF Code | `hf_code` |
| Dyer | `dyerName.name` |
| Colour | `colour.name` |
| Count | `count` |
| Initial Wt (kg) | `initial_weight` |
| Final Wt (kg) | `final_weight` |
| Process Loss % | `process_loss.toFixed(2)` |
| GG | `gg` |
| Initial Dia | `initial_dia` |
| Final Dia | `final_dia` |
| Rolls | `no_of_rolls` |
| Knitter DC No | `knitterDcNo` |
| Company DC No | `companyDcNo` |
| Date Given | `dateGiven` |
| Compacter | `compacter.name` |
| Date | `date` |

#### Buttons / Actions
| Action | Trigger | API |
|--------|---------|-----|
| **Update** (inline) | Edit row | `PUT /api/dyeing/:id` |
| **Delete** | Row action | `DELETE /api/dyeing/:id` |
| **Search** | Search box | `?search=` |

#### Editable Fields in Dyeing (only partial update)
- `initial_weight` — grey weight (can be corrected)
- `knitterDcNo` — when knitter issues DC
- `companyDcNo` — when company issues DC
- `compacterId` — assign compacter
- `dateGiven` — date fabric sent to dyer

> Note: Most fields are READ-ONLY (auto-created from Knitting). Only DC numbers, compacter, and dateGiven are user-editable.

### NEW Status
⚠️ Only PATCH endpoint exists. No status-based filtering. No list of fields with same granularity.

---

## 4. Compacting Page

### OLD (`frontend/src/pages/Compacting.jsx`)

**Route:** `/compacting`  
**Data Source:** `GET /api/compacting?page=&limit=50&search=`

#### Table Columns
| Column | Notes |
|--------|-------|
| HF Code | `hf_code` |
| Count | `count` |
| Lot No | `lot_no` |
| Compacter | `compacterName.name` |
| Colour | `colour.name` |
| Initial Wt | `initial_weight` (= grey weight from dyeing) |
| Final Wt | `final_weight` |
| Process Loss % | `process_loss.toFixed(2)` |
| Final Dia | `final_dia` |
| Date | `date` |

#### Buttons / Actions
| Action | API |
|--------|-----|
| **Add Compacting** | `POST /api/compacting` |
| **Edit** | `PUT /api/compacting/:id` |
| **Delete** | `DELETE /api/compacting/:id` |
| **Search** | `?search=` |

#### Compacting Form Fields
| Field | Notes |
|-------|-------|
| Lot No | Validated against Dyeing table |
| HF Code | From Dyeing record (auto-filled) |
| Count | |
| Compacter | Dropdown from master |
| Colour | Dropdown from master |
| Initial Weight | Auto-fetched from Dyeing.initial_weight |
| Final Weight | User enters |
| Final Dia | User enters |
| Date | |

> ⚠️ Process loss auto-calculated on save. User cannot override.

### NEW Status
⚠️ Partial — create exists but update missing. `initial_weight`, `hf_code`, `count`, `date`, `final_dia` removed from schema.

---

## 5. Master Data Page

### OLD (`frontend/src/pages/MasterData.jsx`)

**Entities managed:**
- Mill Names
- Knitter Names
- Dyer Names
- Compacter Names
- Colours
- Wash Types
- Fabric Descriptions

**All entities:** GET / POST / PUT / DELETE via `GET/POST/PUT/DELETE /api/master/:entity`

### NEW
Separate pages per master entity under `/master/*`. All implemented.  
`FabricDescription` entity — ❌ REMOVED from new schema.

---

## 6. Search Page

### OLD (`frontend/src/pages/Search.jsx`)

Cross-module search by HF code or lot number.  
`GET /api/search?q=&type=`  
Returns combined results from Yarn, Knitting, Dyeing, Compacting.

### NEW Status
❌ **NOT IMPLEMENTED** — no search page, no search API.

---

## 7. Analytics / Dashboard

### OLD (`frontend/src/pages/Dashboard.jsx`)

Minimal — mostly a placeholder.  
`GET /api/analytics` — for metrics.

### NEW Status
⚠️ Basic stub page exists. No analytics API.

---

## 8. Fabric Purchase (Inhouse Fabric)

### OLD (`frontend/src/pages/FabricPurchase.jsx`)

**Route:** `/fabric-purchase`  
Manages `InhouseKnittedFabric` records.  
Can initiate dyeing directly: source_type = `'INHOUSE_FABRIC'`

### NEW Status
❌ **NOT IMPLEMENTED** — no frontend page, no API endpoint.

---

## Summary Table

| Page | OLD | NEW | Status |
|------|-----|-----|--------|
| Yarn / Yarn Inward | ✅ Full CRUD + PO print | ⚠️ Backend 404 | Broken |
| Knitting | ✅ Complex form + auto-dyeing | ⚠️ Partial | Missing auto-dyeing |
| Dyeing | ✅ View + partial update | ⚠️ Partial (PATCH only) | Missing list columns |
| Compacting | ✅ Full CRUD | ⚠️ Partial (no update) | Missing fields |
| Master Data | ✅ 7 entities | ✅ 6 entities (FabDesc missing) | Near match |
| Search | ✅ Cross-module | ❌ Missing | Not started |
| Analytics | ⚠️ Basic | ❌ Not started | Not started |
| Fabric Purchase | ✅ Full | ❌ Missing | Not started |
| PO Print | ✅ 3-dialog print flow | ❌ Missing | Not started |
