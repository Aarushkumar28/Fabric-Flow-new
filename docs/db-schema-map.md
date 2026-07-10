# DB Schema Map — Fabric Flow Phase 0

> Generated: 2026-05-22 | Both schemas use PostgreSQL

---

## OLD Schema — `backend/prisma/schema.prisma`

### Master / Reference Tables

#### `MillName`
| Column | Type | Notes |
|--------|------|-------|
| id | Int PK | |
| name | String UNIQUE | |
| address_line1 | String? | |
| address_line2 | String? | |
| address_line3 | String? | Old has 3 address lines |
| state | String? | |
| pin_code | String? | |
| gstn | String? | |
| email | String? | |
| createdAt | DateTime | |

#### `KnitterName`
| Column | Type | Notes |
|--------|------|-------|
| id | Int PK | |
| name | String UNIQUE | |
| address_line1/2/3 | String? | |
| state, pin_code, gstn, email | String? | |
| yarn_balance | Float DEFAULT 0 | ⚠️ Computed field, maintained by recalculateKnitterBalance() |
| createdAt | DateTime | |

#### `DyerName`
| Column | Type | Notes |
|--------|------|-------|
| id | Int PK | |
| name | String UNIQUE | |
| address fields | String? | |
| createdAt | DateTime | |

#### `CompacterName`
| Column | Type | Notes |
|--------|------|-------|
| id | Int PK | |
| name | String UNIQUE | |
| address fields | String? | |
| createdAt | DateTime | |

#### `Colour`
| Column | Type | Notes |
|--------|------|-------|
| id | Int PK | |
| name | String UNIQUE | |
| createdAt | DateTime | |

#### `WashType`
| Column | Type | Notes |
|--------|------|-------|
| id | Int PK | |
| name | String UNIQUE | |
| createdAt | DateTime | |

#### `FabricDescription`
| Column | Type | Notes |
|--------|------|-------|
| id | Int PK | |
| name | String UNIQUE | |
| createdAt | DateTime | |

---

### Transaction Tables

#### `Yarn` (OLD — maps to `YarnLot` in new)
| Column | Type | Notes |
|--------|------|-------|
| id | Int PK | |
| hf_code | String | Not unique |
| purchase_order_no | String DEFAULT '' | |
| invoice_no | String DEFAULT '' | Status driver: empty=Pending |
| delivery_to | String DEFAULT '' | Text, not FK |
| status | String DEFAULT 'Pending' | 'Pending' / 'Received' |
| mill_name_id | Int FK→MillName | |
| description | String | |
| count | String | |
| quality | String | |
| no_of_bags | Float | |
| bag_weight | Float | |
| total_weight | Float | |
| available_weight | Float DEFAULT 0 | Decremented on issue |
| rate_per_kg | Float | |
| total_cost | Float | `total_weight × rate_per_kg` (no GST) |
| issued_date | DateTime | |
| createdAt / updatedAt | DateTime | |

#### `Knitting`
| Column | Type | Notes |
|--------|------|-------|
| id | Int PK | |
| hf_code | String | |
| dc_no | String UNIQUE | Company DC number |
| knitter_name_id | Int FK→KnitterName | |
| total_yarn_qty | Float DEFAULT 0 | |
| loop_length | Float | |
| dia | Float | |
| count | String | |
| gauge | String | |
| date_given | DateTime | |
| fabric_description_id | Int FK→FabricDescription | |
| grey_fabric_weight | Float | |
| received_weight | Float? | Nullable |
| other_yarn_type | String? | |
| other_yarn_percentage | Float? | |
| no_of_rolls | Int | |
| date | DateTime | |
| createdAt / updatedAt | DateTime | |

#### `KnittingYarnUsage`
| Column | Type | Notes |
|--------|------|-------|
| id | Int PK | |
| knitting_id | Int FK→Knitting CASCADE | |
| yarn_id | Int FK→Yarn | |
| hf_code | String | Denormalised |
| quantity | Float | |

#### `KnittingLot`
| Column | Type | Notes |
|--------|------|-------|
| id | Int PK | |
| knitting_id | Int FK→Knitting CASCADE | |
| lot_no | String UNIQUE | |
| job_work_no | String DEFAULT '' | |
| no_of_rolls | Int DEFAULT 0 | |
| dyer_name_id | Int FK→DyerName | |

#### `KnittingLotEntry`
| Column | Type | Notes |
|--------|------|-------|
| id | Int PK | |
| knitting_lot_id | Int FK→KnittingLot CASCADE | |
| colour_id | Int FK→Colour | |
| weight | Float | |
| dyeing_id | Int? | Soft link to Dyeing (nullable) |

#### `KnitterStock`
| Column | Type | Notes |
|--------|------|-------|
| id | Int PK | |
| knitterId | Int FK→KnitterName | |
| yarnId | Int FK→Yarn | |
| received_weight | Float | |
| remaining_weight | Float | |

#### `DeliveryNote`
| Column | Type | Notes |
|--------|------|-------|
| id | Int PK | |
| sourceKnitterId | Int FK→KnitterName | |
| destKnitterId | Int FK→KnitterName | |
| yarnId | Int FK→Yarn | |
| quantity | Float | |
| transfer_dc_no | String? | |
| transferDate | DateTime | |

#### `KnitterProgram`
| Column | Type | Notes |
|--------|------|-------|
| id | Int PK | |
| knitterId | Int FK→KnitterName | |
| yarnId | Int FK→Yarn | |
| quantity_used | Float | |
| grey_weight | Float | |
| number_of_rolls | Int DEFAULT 0 | |
| gauge | String? | |
| loop_length | Float? | |
| productionDate | DateTime | |

#### `GreyFabricLot`
| Column | Type | Notes |
|--------|------|-------|
| id | Int PK | |
| knitterProgramId | Int UNIQUE FK→KnitterProgram | |
| grey_weight | Float | |
| status | String DEFAULT 'AVAILABLE' | |

#### `Dyeing` (@@map: "dyeings")
| Column | Type | Notes |
|--------|------|-------|
| id | Int PK | |
| lot_no | String UNIQUE | |
| hf_code | String? | |
| source_type | String? | 'KNITTING' / 'INHOUSE_FABRIC' / 'GREY_FABRIC' |
| fabric_code | String? | For INHOUSE_FABRIC |
| count | String? | |
| initial_weight | Float? | Grey weight sent |
| gg | Float? | Gauge |
| initial_dia | Float? | |
| final_dia | Float? | |
| no_of_rolls | Int? | |
| final_weight | Float? | |
| process_loss | Float? | Percentage |
| date | DateTime | |
| dateGiven | DateTime? | |
| knitterDcNo | String? | |
| companyDcNo | String? | |
| compacterId | Int? FK→CompacterName | |
| greyFabricLotId | Int? UNIQUE FK→GreyFabricLot | |
| colour_id | Int FK→Colour | |
| dyer_name_id | Int FK→DyerName | |
| wash_type_id | Int? FK→WashType | |

#### `Compacting`
| Column | Type | Notes |
|--------|------|-------|
| id | Int PK | |
| hf_code | String | |
| count | String DEFAULT '' | |
| lot_no | String UNIQUE | Must match Dyeing.lot_no |
| initial_weight | Float | Grey weight (from Dyeing.initial_weight) |
| compacter_name_id | Int FK→CompacterName | |
| final_dia | Float | |
| colour_id | Int FK→Colour | |
| final_weight | Float | |
| process_loss | Float | `(initial_weight - final_weight) / initial_weight × 100` |
| date | DateTime | |

#### `InhouseKnittedFabric`
| Column | Type | Notes |
|--------|------|-------|
| id | Int PK | |
| fabric_code | String UNIQUE | |
| purchase_order_no | String | |
| invoice_no | String DEFAULT '' | |
| supplier_name_id | Int? | NOT FK (soft reference) |
| particulars | String | |
| total_weight | Float | |
| rate_per_unit | Float | |
| amount | Float | |
| date | DateTime | |

#### `YarnReceipt`
| Column | Type | Notes |
|--------|------|-------|
| id | Int PK | |
| yarnId | Int FK→Yarn | |
| quantity | Float | |
| receiptDate | DateTime | |
| dcNo | String? | |
| notes | String? | |

#### `GreyFabric` (attached to Knitting)
| Column | Type | Notes |
|--------|------|-------|
| id | Int PK | |
| knittingId | Int UNIQUE FK→Knitting | |
| description | String | |
| gauge | String? | |
| loopLength | Float? | |
| diameter | Float? | |
| gsm | Float? | |
| quantity | Float | |

#### `DyeingOrder` + `DyeingLot`
| Model | Key Fields |
|-------|-----------|
| DyeingOrder | id, dcNo UNIQUE, dyerName(text), issueDate |
| DyeingLot | id, dyeingOrderId FK, knittingId FK, colour(text), weight |

#### `User`
| Column | Type |
|--------|------|
| id | Int PK |
| username | String UNIQUE |
| passwordHash | String |
| role | String DEFAULT 'user' |

---

## NEW Schema — `apps/textile-flow-svc/prisma/schema.prisma`

### Key Differences Overview

| Area | Old | New |
|------|-----|-----|
| Mill entity | `MillName` | `Mill` (@@map:"mills") |
| Knitter entity | `KnitterName` | `Knitter` (@@map:"knitters") |
| Dyer entity | `DyerName` | `Dyer` (@@map:"dyers") |
| Compacter entity | `CompacterName` | `Compacter` (@@map:"compacters") |
| Yarn lot | `Yarn` | `YarnLot` (@@map:"yarn_lots") |
| Knitter balance | `KnitterName.yarn_balance` | Not stored — computed |
| Colour | simple `name` | Added `code` (UNIQUE), `hexCode`, `isActive` |
| WashType | simple `name` | Added `code` (UNIQUE), `isActive` |
| Fabric Descriptions | `FabricDescription` table | ❌ REMOVED from new schema |
| Dyeing | standalone with lot linking | Now requires `memoLineId` FK |
| Compacting | links via `lot_no` text | Links via `dyeingId` FK |
| Grey fabric | `GreyFabric` attached to `Knitting` | `GreyFabricLot` as standalone |
| Status tracking | String defaults | Mixed: String + Enum |
| Audit | None | `AuditLog` table |
| Tax tracking | `total_cost = weight × rate` | Full GST breakdown (cgst/sgst) |
| New models | — | `Memo`, `MemoLine`, `DyeingProgram`, `YarnInward`, `GreyFabricInward`, `PurchaseOrder`, `PurchaseOrderItem` |

### New Models Not in Old Schema

| Model | Purpose |
|-------|---------|
| `Memo` | Dyeing dispatch document (memo no., dyer, lines) |
| `MemoLine` | Individual grey lot sent to dyer |
| `DyeingProgram` | Formal dyeing programme record |
| `YarnInward` | Physical yarn receipt from mill |
| `GreyFabricInward` | External grey fabric purchase |
| `PurchaseOrder` | Purchase order header |
| `PurchaseOrderItem` | PO line items |
| `AuditLog` | Record-level audit trail |
