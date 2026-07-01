-- ============================================================================
-- Migration: batch_po_fixes
-- Covers Issues 4, 7, 8, 9 (schema changes) + Issue 2 (DB-level weight checks)
-- ============================================================================

-- ── Issue 7: Make poNumber unique ────────────────────────────────────────────
ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_po_number_key UNIQUE (po_number);

-- ── Issue 4: Make hfCode unique ──────────────────────────────────────────────
ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_hf_code_key UNIQUE (hf_code);

-- ── Issue 9: Add fbNo column for Fabric POs ──────────────────────────────────
ALTER TABLE purchase_orders ADD COLUMN fb_no TEXT;

-- ── Issue 8: Add status column for PO lifecycle ──────────────────────────────
ALTER TABLE purchase_orders ADD COLUMN status TEXT NOT NULL DEFAULT 'ACTIVE';

-- ── Issue 8: Add updatedAt tracking ──────────────────────────────────────────
ALTER TABLE purchase_orders ADD COLUMN updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ── Issue 2: DB-level positive weight CHECK constraints (defense in depth) ───
-- These backstop DTO validation and Prisma middleware. NULL is allowed for
-- optional fields.

ALTER TABLE yarn_inwards ADD CONSTRAINT chk_received_weight_positive
  CHECK (received_weight IS NULL OR received_weight >= 0);

ALTER TABLE yarn_lots ADD CONSTRAINT chk_total_weight_positive
  CHECK (total_weight >= 0);

ALTER TABLE yarn_lots ADD CONSTRAINT chk_available_weight_positive
  CHECK (available_weight >= 0);

ALTER TABLE delivery_notes ADD CONSTRAINT chk_qty_positive
  CHECK (quantity >= 0);

ALTER TABLE dyeings ADD CONSTRAINT chk_dyeing_weights_positive
  CHECK (
    (initial_weight IS NULL OR initial_weight >= 0)
    AND (final_weight IS NULL OR final_weight >= 0)
  );

ALTER TABLE compactings ADD CONSTRAINT chk_compacting_weight_positive
  CHECK (final_weight IS NULL OR final_weight >= 0);

ALTER TABLE knitter_programs ADD CONSTRAINT chk_program_weights_positive
  CHECK (quantity_used >= 0 AND grey_weight >= 0);
