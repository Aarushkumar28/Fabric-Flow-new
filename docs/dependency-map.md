# Dependency Map — Fabric Flow Phase 0

> Generated: 2026-05-22

---

## 1. Module Dependencies (Backend)

### NestJS Module Imports (`app.module.ts`)

```
AppModule
├── PrismaModule          (shared DB client)
├── MillsModule
├── KnitterNamesModule    → uses Knitter (master)
├── DyerNamesModule       → uses Dyer (master)
├── CompacterNamesModule  → uses Compacter (master)
├── ColoursModule
├── WashTypesModule
├── YarnLotsModule        → depends on MillsModule (FK: millId)
├── YarnReceiptsModule    → depends on YarnLotsModule (FK: yarnLotId)
├── KnitterStockModule    → depends on KnitterNamesModule + YarnLotsModule
├── DeliveryNotesModule   → depends on KnitterNamesModule + YarnLotsModule
├── KnittingsModule       → depends on KnitterNamesModule
├── KnittingLotsModule    → depends on KnittingsModule + DyerNamesModule
├── MemosModule           → depends on DyerNamesModule + GreyFabricLotsModule
├── DyeingsModule         → depends on MemosModule (memoLineId FK)
├── CompactingsModule     → depends on DyeingsModule (dyeingId FK)
├── DyeingProgramsModule  → depends on GreyFabricLotsModule + DyerNamesModule
├── DyeingOrdersModule
└── AuditLogsModule
```

---

## 2. Workflow Dependencies (Data Must Exist Before Next Stage)

```
Workflow Dependency Chain:
─────────────────────────
[Mills master]          ← Must exist before creating YarnLot
[Knitters master]       ← Must exist before creating KnitterStock, Knitting
[Dyers master]          ← Must exist before creating KnittingLot, Memo, Dyeing
[Compacters master]     ← Must exist before assigning to Dyeing/Compacting
[Colours master]        ← Must exist before KnittingLotEntry, Dyeing, Compacting
[WashTypes master]      ← Must exist before Dyeing

YarnLot                 ← Requires Mill
  └─→ KnitterStock      ← Requires YarnLot + Knitter
        └─→ Knitting    ← Requires Knitter (+ fabric_description in OLD, removed in NEW)
              └─→ KnittingLot   ← Requires Knitting + Dyer
                    └─→ KnittingLotEntry  ← Requires KnittingLot + Colour

NEW FLOW (via Memo):
GreyFabricLot           ← Requires KnitterProgram or GreyFabricInward
  └─→ Memo              ← Requires Dyer
        └─→ MemoLine    ← Requires Memo + GreyFabricLot
              └─→ Dyeing ← Requires MemoLine (memoLineId)
                    └─→ Compacting  ← Requires Dyeing (dyeingId)

OLD FLOW (direct from Knitting):
Knitting + KnittingLots
  └─→ Dyeing (auto-created)
        └─→ Compacting (by lot_no lookup)
```

---

## 3. Status Dependencies

| Stage | Status Required | Field That Triggers It |
|-------|----------------|----------------------|
| Yarn → KnitterStock | No status gate | Any yarn can be issued |
| Yarn status change | invoice_no present | status: Pending → Received (OLD) |
| Dyeing appears | Knitting lots saved | Auto-created (OLD) |
| Dyeing → "In Dyeing" | companyDcNo + dateGiven | Auto-set by service |
| Compacting creation | lot_no exists in Dyeing (OLD) OR dyeingId (NEW) | Validated in POST |
| GreyFabricLot → Dyeing | status = 'AVAILABLE' | Checked before consuming |

---

## 4. Document Dependencies (DC Numbers / Invoice Numbers)

| Document | Links | Effect |
|----------|-------|--------|
| `invoice_no` (Yarn) | Yarn record | Changes status Pending→Received |
| `dc_no` (Knitting) | Knitting record (UNIQUE) | Uniquely identifies a knitter shipment |
| `lot_no` (KnittingLot) | Connects KnittingLot → Dyeing | Text-based join (OLD) |
| `knitterDcNo` (Dyeing) | Dyeing record | DC from knitter confirming dispatch |
| `companyDcNo` (Dyeing) | Dyeing record | Company's own DC, triggers "In Dyeing" |
| `memoNo` (Memo) | Memo record | Sequential memo for dyeing dispatch (NEW) |
| `transfer_dc_no` (DeliveryNote) | Yarn transfer | Documents inter-knitter transfers |

---

## 5. Foreign Key Dependency Chain

```
Mill ──────────────────────────────────┐
                                       ↓
YarnInward ──────────────────────→ YarnLot ──────────────────────────────┐
                                       │                                   │
                                       ↓                                   ↓
Knitter ────────────────────────→ KnitterStock ←─────────────────────────┘
    │                                  │
    ├────────────────────────────→ Knitting ──────────────────────────────┐
    │                                  │                                   │
    │                                  ↓                                   │
    │                           KnittingYarnUsage ←── YarnLot             │
    │                                  │                                   │
    │                                  ↓                                   │
Dyer ──────────────────────────→ KnittingLot ───────────────────────────┐ │
                                       │                                 │ │
                                       ↓                                 │ │
Colour ─────────────────────────→ KnittingLotEntry                      │ │
                                                                         │ │
    ┌──────────────────────────────────────────────────────────────────┘ │
    │                                                                      │
    ↓                                                                      │
Dyer ─────────────────────────────→ Memo ────────────────────────────────┤
                                       │                                   │
GreyFabricLot ─────────────────→ MemoLine ←──────────────────────────────┘
                                       │
                                       ↓
Dyer, Colour, WashType, Compacter → Dyeing ←── MemoLine (REQUIRED FK)
                                       │
                                       ↓
Colour, Compacter ─────────────→ Compacting
```

---

## 6. Delete Cascade Dependencies (OLD Schema)

| Delete Action | Cascades To |
|--------------|-------------|
| DELETE Knitting | → KnittingYarnUsage (CASCADE), KnittingLots (CASCADE) |
| DELETE KnittingLot | → KnittingLotEntries (CASCADE) |
| DELETE KnittingLotEntry | → Dyeing record (manual in route handler) |
| DELETE Dyeing (with greyFabricLotId) | → GreyFabricLot status reset to AVAILABLE |
| DELETE Yarn | → No cascade (safe if no usages) |

---

## 7. What Cannot Be Done Out of Order (Business Rules)

| Operation | Requires |
|-----------|---------|
| Create KnitterStock entry | Yarn lot must exist AND Knitter must exist |
| Create Knitting | Knitter must exist, fabric_description must exist (OLD) |
| Create KnittingLot | Knitting must exist, Dyer must exist |
| Create Dyeing (NEW) | MemoLine must exist (enforced by FK) |
| Create Dyeing (OLD) | Auto-created; OR lot_no must be unique |
| Create Compacting (OLD) | lot_no must exist in Dyeing table |
| Create Compacting (NEW) | dyeingId must be valid Dyeing record |
| Mark Dyeing "In Dyeing" | companyDcNo must be provided AND (dateGiven must exist) |
