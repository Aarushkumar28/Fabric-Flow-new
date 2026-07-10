
-- CreateEnum
CREATE TYPE "Action" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- CreateTable
CREATE TABLE "mills" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address_line1" TEXT,
    "address_line2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "contact_person" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "contact_no" TEXT,
    "gstin" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knitters" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address_line1" TEXT,
    "address_line2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "contact_person" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "contact_no" TEXT,
    "gstin" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knitters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dyers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address_line1" TEXT,
    "address_line2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "contact_person" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "contact_no" TEXT,
    "gstin" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dyers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compacters" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address_line1" TEXT,
    "address_line2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "contact_person" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "contact_no" TEXT,
    "gstin" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compacters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "colours" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "hex_code" TEXT,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "colours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wash_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wash_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yarn_lots" (
    "id" SERIAL NOT NULL,
    "hf_code" TEXT NOT NULL,
    "description" TEXT,
    "mill_id" INTEGER NOT NULL,
    "count" TEXT,
    "num_bags" INTEGER NOT NULL,
    "bag_weight" DOUBLE PRECISION NOT NULL,
    "rate_per_kg" DOUBLE PRECISION NOT NULL,
    "total_weight" DOUBLE PRECISION NOT NULL,
    "total_cost" DOUBLE PRECISION NOT NULL,
    "available_weight" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "colour_id" INTEGER,

    CONSTRAINT "yarn_lots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knitter_stocks" (
    "id" SERIAL NOT NULL,
    "knitter_id" INTEGER NOT NULL,
    "yarn_lot_id" INTEGER NOT NULL,
    "received_weight" DOUBLE PRECISION NOT NULL,
    "remaining_weight" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knitter_stocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_notes" (
    "id" SERIAL NOT NULL,
    "dc_no" TEXT NOT NULL,
    "transfer_dc_no" TEXT,
    "knitter_id" INTEGER NOT NULL,
    "delivery_date" TIMESTAMP(3) NOT NULL,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_note_items" (
    "id" SERIAL NOT NULL,
    "delivery_note_id" INTEGER NOT NULL,
    "yarn_lot_id" INTEGER NOT NULL,
    "sent_weight" DOUBLE PRECISION NOT NULL,
    "cones" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_note_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knitter_programs" (
    "id" SERIAL NOT NULL,
    "program_no" TEXT NOT NULL,
    "memo_no" TEXT,
    "knitter_id" INTEGER NOT NULL,
    "colour_id" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "expected_end_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knitter_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grey_fabric_lots" (
    "id" SERIAL NOT NULL,
    "lot_number" TEXT NOT NULL,
    "knitter_program_id" INTEGER NOT NULL,
    "received_date" TIMESTAMP(3) NOT NULL,
    "gross_weight" DOUBLE PRECISION NOT NULL,
    "net_weight" DOUBLE PRECISION NOT NULL,
    "rolls" INTEGER NOT NULL,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grey_fabric_lots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dyeing_programs" (
    "id" SERIAL NOT NULL,
    "program_no" TEXT NOT NULL,
    "dyer_id" INTEGER NOT NULL,
    "colour_id" INTEGER NOT NULL,
    "wash_type_id" INTEGER NOT NULL,
    "grey_fabric_lot_id" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dyeing_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "table_name" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "action" "Action" NOT NULL,
    "old_data" JSONB,
    "new_data" JSONB,
    "performed_by" TEXT NOT NULL,
    "performed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mills_gstin_key" ON "mills"("gstin");

-- CreateIndex
CREATE UNIQUE INDEX "knitters_gstin_key" ON "knitters"("gstin");

-- CreateIndex
CREATE UNIQUE INDEX "dyers_gstin_key" ON "dyers"("gstin");

-- CreateIndex
CREATE UNIQUE INDEX "compacters_gstin_key" ON "compacters"("gstin");

-- CreateIndex
CREATE UNIQUE INDEX "colours_code_key" ON "colours"("code");

-- CreateIndex
CREATE UNIQUE INDEX "wash_types_code_key" ON "wash_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "knitter_stocks_knitter_id_yarn_lot_id_key" ON "knitter_stocks"("knitter_id", "yarn_lot_id");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_notes_dc_no_key" ON "delivery_notes"("dc_no");

-- CreateIndex
CREATE UNIQUE INDEX "knitter_programs_program_no_key" ON "knitter_programs"("program_no");

-- CreateIndex
CREATE UNIQUE INDEX "grey_fabric_lots_lot_number_key" ON "grey_fabric_lots"("lot_number");

-- CreateIndex
CREATE UNIQUE INDEX "dyeing_programs_program_no_key" ON "dyeing_programs"("program_no");

-- CreateIndex
CREATE INDEX "audit_logs_table_name_record_id_idx" ON "audit_logs"("table_name", "record_id");

-- CreateIndex
CREATE INDEX "audit_logs_performed_at_idx" ON "audit_logs"("performed_at");

-- AddForeignKey
ALTER TABLE "yarn_lots" ADD CONSTRAINT "yarn_lots_mill_id_fkey" FOREIGN KEY ("mill_id") REFERENCES "mills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yarn_lots" ADD CONSTRAINT "yarn_lots_colour_id_fkey" FOREIGN KEY ("colour_id") REFERENCES "colours"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knitter_stocks" ADD CONSTRAINT "knitter_stocks_knitter_id_fkey" FOREIGN KEY ("knitter_id") REFERENCES "knitters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knitter_stocks" ADD CONSTRAINT "knitter_stocks_yarn_lot_id_fkey" FOREIGN KEY ("yarn_lot_id") REFERENCES "yarn_lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_notes" ADD CONSTRAINT "delivery_notes_knitter_id_fkey" FOREIGN KEY ("knitter_id") REFERENCES "knitters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_note_items" ADD CONSTRAINT "delivery_note_items_delivery_note_id_fkey" FOREIGN KEY ("delivery_note_id") REFERENCES "delivery_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_note_items" ADD CONSTRAINT "delivery_note_items_yarn_lot_id_fkey" FOREIGN KEY ("yarn_lot_id") REFERENCES "yarn_lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knitter_programs" ADD CONSTRAINT "knitter_programs_knitter_id_fkey" FOREIGN KEY ("knitter_id") REFERENCES "knitters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knitter_programs" ADD CONSTRAINT "knitter_programs_colour_id_fkey" FOREIGN KEY ("colour_id") REFERENCES "colours"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grey_fabric_lots" ADD CONSTRAINT "grey_fabric_lots_knitter_program_id_fkey" FOREIGN KEY ("knitter_program_id") REFERENCES "knitter_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dyeing_programs" ADD CONSTRAINT "dyeing_programs_dyer_id_fkey" FOREIGN KEY ("dyer_id") REFERENCES "dyers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dyeing_programs" ADD CONSTRAINT "dyeing_programs_colour_id_fkey" FOREIGN KEY ("colour_id") REFERENCES "colours"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dyeing_programs" ADD CONSTRAINT "dyeing_programs_wash_type_id_fkey" FOREIGN KEY ("wash_type_id") REFERENCES "wash_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dyeing_programs" ADD CONSTRAINT "dyeing_programs_grey_fabric_lot_id_fkey" FOREIGN KEY ("grey_fabric_lot_id") REFERENCES "grey_fabric_lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

