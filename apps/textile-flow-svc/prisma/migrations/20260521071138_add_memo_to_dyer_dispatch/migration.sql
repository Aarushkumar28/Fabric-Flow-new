/*
  Warnings:

  - You are about to drop the `audit_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `colours` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `compacters` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `delivery_note_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `delivery_notes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `dyeing_programs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `dyers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `grey_fabric_lots` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `knitter_programs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `knitter_stocks` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `knitters` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `mills` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `wash_types` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `yarn_lots` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "delivery_note_items" DROP CONSTRAINT "delivery_note_items_delivery_note_id_fkey";

-- DropForeignKey
ALTER TABLE "delivery_note_items" DROP CONSTRAINT "delivery_note_items_yarn_lot_id_fkey";

-- DropForeignKey
ALTER TABLE "delivery_notes" DROP CONSTRAINT "delivery_notes_knitter_id_fkey";

-- DropForeignKey
ALTER TABLE "dyeing_programs" DROP CONSTRAINT "dyeing_programs_colour_id_fkey";

-- DropForeignKey
ALTER TABLE "dyeing_programs" DROP CONSTRAINT "dyeing_programs_dyer_id_fkey";

-- DropForeignKey
ALTER TABLE "dyeing_programs" DROP CONSTRAINT "dyeing_programs_grey_fabric_lot_id_fkey";

-- DropForeignKey
ALTER TABLE "dyeing_programs" DROP CONSTRAINT "dyeing_programs_wash_type_id_fkey";

-- DropForeignKey
ALTER TABLE "grey_fabric_lots" DROP CONSTRAINT "grey_fabric_lots_knitter_program_id_fkey";

-- DropForeignKey
ALTER TABLE "knitter_programs" DROP CONSTRAINT "knitter_programs_colour_id_fkey";

-- DropForeignKey
ALTER TABLE "knitter_programs" DROP CONSTRAINT "knitter_programs_knitter_id_fkey";

-- DropForeignKey
ALTER TABLE "knitter_stocks" DROP CONSTRAINT "knitter_stocks_knitter_id_fkey";

-- DropForeignKey
ALTER TABLE "knitter_stocks" DROP CONSTRAINT "knitter_stocks_yarn_lot_id_fkey";

-- DropForeignKey
ALTER TABLE "yarn_lots" DROP CONSTRAINT "yarn_lots_colour_id_fkey";

-- DropForeignKey
ALTER TABLE "yarn_lots" DROP CONSTRAINT "yarn_lots_mill_id_fkey";

-- DropTable
DROP TABLE "audit_logs";

-- DropTable
DROP TABLE "colours";

-- DropTable
DROP TABLE "compacters";

-- DropTable
DROP TABLE "delivery_note_items";

-- DropTable
DROP TABLE "delivery_notes";

-- DropTable
DROP TABLE "dyeing_programs";

-- DropTable
DROP TABLE "dyers";

-- DropTable
DROP TABLE "grey_fabric_lots";

-- DropTable
DROP TABLE "knitter_programs";

-- DropTable
DROP TABLE "knitter_stocks";

-- DropTable
DROP TABLE "knitters";

-- DropTable
DROP TABLE "mills";

-- DropTable
DROP TABLE "wash_types";

-- DropTable
DROP TABLE "yarn_lots";

-- DropEnum
DROP TYPE "Action";

-- CreateTable
CREATE TABLE "Mill" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "gstin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnitterName" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "gstin" TEXT,
    "yarn_balance" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnitterName_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DyerName" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "gstin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DyerName_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompacterName" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "gstin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompacterName_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Colour" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "hexCode" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Colour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WashType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WashType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FabricDescription" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "FabricDescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YarnLot" (
    "id" SERIAL NOT NULL,
    "hfCode" TEXT NOT NULL,
    "purchaseOrderNo" TEXT,
    "invoiceNo" TEXT,
    "deliveryTo" TEXT,
    "millId" INTEGER NOT NULL,
    "description" TEXT,
    "count" TEXT,
    "quality" TEXT,
    "noOfBags" INTEGER NOT NULL DEFAULT 0,
    "bagWeight" DOUBLE PRECISION NOT NULL DEFAULT 60,
    "totalWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "availableWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratePerKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cgstRate" DOUBLE PRECISION DEFAULT 2.5,
    "sgstRate" DOUBLE PRECISION DEFAULT 2.5,
    "cgstAmount" DOUBLE PRECISION DEFAULT 0,
    "sgstAmount" DOUBLE PRECISION DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YarnLot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YarnReceipt" (
    "id" SERIAL NOT NULL,
    "yarnLotId" INTEGER NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "receiptDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dcNo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YarnReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnitterStock" (
    "id" SERIAL NOT NULL,
    "knitterId" INTEGER NOT NULL,
    "yarnLotId" INTEGER NOT NULL,
    "receivedWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remainingWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnitterStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryNote" (
    "id" SERIAL NOT NULL,
    "sourceKnitterId" INTEGER NOT NULL,
    "destinationKnitterId" INTEGER NOT NULL,
    "yarnLotId" INTEGER NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "transferDcNo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliveryNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Knitting" (
    "id" SERIAL NOT NULL,
    "dcNo" TEXT NOT NULL,
    "knitterNameId" INTEGER NOT NULL,
    "totalYarnQty" DOUBLE PRECISION NOT NULL,
    "loopLength" DOUBLE PRECISION,
    "dia" TEXT,
    "count" TEXT,
    "gauge" TEXT,
    "fabricDescriptionId" INTEGER,
    "greyFabricWeight" DOUBLE PRECISION NOT NULL,
    "receivedWeight" DOUBLE PRECISION,
    "noOfRolls" INTEGER,
    "dateGiven" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Knitting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnittingYarnUsage" (
    "id" SERIAL NOT NULL,
    "knittingId" INTEGER NOT NULL,
    "yarnLotId" INTEGER NOT NULL,
    "hfCode" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnittingYarnUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnittingLot" (
    "id" SERIAL NOT NULL,
    "lotNo" TEXT NOT NULL,
    "knittingId" INTEGER NOT NULL,
    "dyerNameId" INTEGER,
    "noOfRolls" INTEGER,
    "jobWorkNo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnittingLot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnittingLotEntry" (
    "id" SERIAL NOT NULL,
    "knittingLotId" INTEGER NOT NULL,
    "colourId" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "dyeingId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnittingLotEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Memo" (
    "id" SERIAL NOT NULL,
    "memoNo" INTEGER NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dyerId" INTEGER NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Memo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemoLine" (
    "id" SERIAL NOT NULL,
    "memoId" INTEGER NOT NULL,
    "knittingLotId" INTEGER NOT NULL,
    "sentWeight" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemoLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dyeing" (
    "id" SERIAL NOT NULL,
    "lotNo" TEXT NOT NULL,
    "hfCode" TEXT,
    "memoLineId" INTEGER NOT NULL,
    "dyerNameId" INTEGER NOT NULL,
    "colourId" INTEGER NOT NULL,
    "washTypeId" INTEGER,
    "initialWeight" DOUBLE PRECISION NOT NULL,
    "finalWeight" DOUBLE PRECISION,
    "processLoss" DOUBLE PRECISION,
    "noOfRolls" INTEGER,
    "knitterDcNo" TEXT,
    "companyDcNo" TEXT,
    "compacterId" INTEGER,
    "dateGiven" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dyeing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DyeingOrder" (
    "id" SERIAL NOT NULL,
    "dcNo" TEXT NOT NULL,
    "dyerName" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DyeingOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DyeingLot" (
    "id" SERIAL NOT NULL,
    "dyeingOrderId" INTEGER NOT NULL,
    "knittingId" INTEGER NOT NULL,
    "colour" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DyeingLot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GreyFabricLot" (
    "id" SERIAL NOT NULL,
    "knitterProgramId" INTEGER,
    "greyWeight" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "source" TEXT NOT NULL DEFAULT 'KNITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GreyFabricLot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnitterProgram" (
    "id" SERIAL NOT NULL,
    "knitterId" INTEGER NOT NULL,
    "yarnLotId" INTEGER NOT NULL,
    "quantityUsed" DOUBLE PRECISION NOT NULL,
    "greyWeight" DOUBLE PRECISION NOT NULL,
    "numberOfRolls" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnitterProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GreyFabric" (
    "id" SERIAL NOT NULL,
    "knittingId" INTEGER NOT NULL,
    "description" TEXT,
    "gauge" TEXT,
    "loopLength" TEXT,
    "diameter" TEXT,
    "gsm" TEXT,
    "quantity" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GreyFabric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InhouseKnittedFabric" (
    "id" SERIAL NOT NULL,
    "fabricCode" TEXT,
    "particulars" TEXT,
    "totalWeight" DOUBLE PRECISION NOT NULL,
    "rate" DOUBLE PRECISION,
    "amount" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InhouseKnittedFabric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Compacting" (
    "id" SERIAL NOT NULL,
    "lotNo" TEXT NOT NULL,
    "hfCode" TEXT,
    "compacterNameId" INTEGER NOT NULL,
    "colourId" INTEGER NOT NULL,
    "initialWeight" DOUBLE PRECISION NOT NULL,
    "finalWeight" DOUBLE PRECISION,
    "processLoss" DOUBLE PRECISION,
    "finalDia" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Compacting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Mill_gstin_key" ON "Mill"("gstin");

-- CreateIndex
CREATE UNIQUE INDEX "KnitterName_gstin_key" ON "KnitterName"("gstin");

-- CreateIndex
CREATE UNIQUE INDEX "DyerName_gstin_key" ON "DyerName"("gstin");

-- CreateIndex
CREATE UNIQUE INDEX "CompacterName_gstin_key" ON "CompacterName"("gstin");

-- CreateIndex
CREATE UNIQUE INDEX "FabricDescription_name_key" ON "FabricDescription"("name");

-- CreateIndex
CREATE UNIQUE INDEX "YarnLot_hfCode_key" ON "YarnLot"("hfCode");

-- CreateIndex
CREATE UNIQUE INDEX "KnitterStock_knitterId_yarnLotId_key" ON "KnitterStock"("knitterId", "yarnLotId");

-- CreateIndex
CREATE UNIQUE INDEX "Knitting_dcNo_key" ON "Knitting"("dcNo");

-- CreateIndex
CREATE UNIQUE INDEX "KnittingLot_lotNo_key" ON "KnittingLot"("lotNo");

-- CreateIndex
CREATE UNIQUE INDEX "Memo_memoNo_key" ON "Memo"("memoNo");

-- CreateIndex
CREATE UNIQUE INDEX "Dyeing_lotNo_key" ON "Dyeing"("lotNo");

-- CreateIndex
CREATE UNIQUE INDEX "Dyeing_memoLineId_key" ON "Dyeing"("memoLineId");

-- CreateIndex
CREATE UNIQUE INDEX "DyeingOrder_dcNo_key" ON "DyeingOrder"("dcNo");

-- CreateIndex
CREATE UNIQUE INDEX "GreyFabricLot_knitterProgramId_key" ON "GreyFabricLot"("knitterProgramId");

-- CreateIndex
CREATE UNIQUE INDEX "GreyFabric_knittingId_key" ON "GreyFabric"("knittingId");

-- CreateIndex
CREATE UNIQUE INDEX "Compacting_lotNo_key" ON "Compacting"("lotNo");

-- AddForeignKey
ALTER TABLE "YarnLot" ADD CONSTRAINT "YarnLot_millId_fkey" FOREIGN KEY ("millId") REFERENCES "Mill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YarnReceipt" ADD CONSTRAINT "YarnReceipt_yarnLotId_fkey" FOREIGN KEY ("yarnLotId") REFERENCES "YarnLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnitterStock" ADD CONSTRAINT "KnitterStock_knitterId_fkey" FOREIGN KEY ("knitterId") REFERENCES "KnitterName"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnitterStock" ADD CONSTRAINT "KnitterStock_yarnLotId_fkey" FOREIGN KEY ("yarnLotId") REFERENCES "YarnLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryNote" ADD CONSTRAINT "DeliveryNote_sourceKnitterId_fkey" FOREIGN KEY ("sourceKnitterId") REFERENCES "KnitterName"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryNote" ADD CONSTRAINT "DeliveryNote_destinationKnitterId_fkey" FOREIGN KEY ("destinationKnitterId") REFERENCES "KnitterName"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryNote" ADD CONSTRAINT "DeliveryNote_yarnLotId_fkey" FOREIGN KEY ("yarnLotId") REFERENCES "YarnLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Knitting" ADD CONSTRAINT "Knitting_knitterNameId_fkey" FOREIGN KEY ("knitterNameId") REFERENCES "KnitterName"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Knitting" ADD CONSTRAINT "Knitting_fabricDescriptionId_fkey" FOREIGN KEY ("fabricDescriptionId") REFERENCES "FabricDescription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnittingYarnUsage" ADD CONSTRAINT "KnittingYarnUsage_knittingId_fkey" FOREIGN KEY ("knittingId") REFERENCES "Knitting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnittingYarnUsage" ADD CONSTRAINT "KnittingYarnUsage_yarnLotId_fkey" FOREIGN KEY ("yarnLotId") REFERENCES "YarnLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnittingLot" ADD CONSTRAINT "KnittingLot_knittingId_fkey" FOREIGN KEY ("knittingId") REFERENCES "Knitting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnittingLot" ADD CONSTRAINT "KnittingLot_dyerNameId_fkey" FOREIGN KEY ("dyerNameId") REFERENCES "DyerName"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnittingLotEntry" ADD CONSTRAINT "KnittingLotEntry_knittingLotId_fkey" FOREIGN KEY ("knittingLotId") REFERENCES "KnittingLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnittingLotEntry" ADD CONSTRAINT "KnittingLotEntry_colourId_fkey" FOREIGN KEY ("colourId") REFERENCES "Colour"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Memo" ADD CONSTRAINT "Memo_dyerId_fkey" FOREIGN KEY ("dyerId") REFERENCES "DyerName"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoLine" ADD CONSTRAINT "MemoLine_memoId_fkey" FOREIGN KEY ("memoId") REFERENCES "Memo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoLine" ADD CONSTRAINT "MemoLine_knittingLotId_fkey" FOREIGN KEY ("knittingLotId") REFERENCES "KnittingLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dyeing" ADD CONSTRAINT "Dyeing_memoLineId_fkey" FOREIGN KEY ("memoLineId") REFERENCES "MemoLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dyeing" ADD CONSTRAINT "Dyeing_dyerNameId_fkey" FOREIGN KEY ("dyerNameId") REFERENCES "DyerName"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dyeing" ADD CONSTRAINT "Dyeing_colourId_fkey" FOREIGN KEY ("colourId") REFERENCES "Colour"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dyeing" ADD CONSTRAINT "Dyeing_washTypeId_fkey" FOREIGN KEY ("washTypeId") REFERENCES "WashType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dyeing" ADD CONSTRAINT "Dyeing_compacterId_fkey" FOREIGN KEY ("compacterId") REFERENCES "CompacterName"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DyeingLot" ADD CONSTRAINT "DyeingLot_dyeingOrderId_fkey" FOREIGN KEY ("dyeingOrderId") REFERENCES "DyeingOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DyeingLot" ADD CONSTRAINT "DyeingLot_knittingId_fkey" FOREIGN KEY ("knittingId") REFERENCES "Knitting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GreyFabricLot" ADD CONSTRAINT "GreyFabricLot_knitterProgramId_fkey" FOREIGN KEY ("knitterProgramId") REFERENCES "KnitterProgram"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnitterProgram" ADD CONSTRAINT "KnitterProgram_knitterId_fkey" FOREIGN KEY ("knitterId") REFERENCES "KnitterName"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnitterProgram" ADD CONSTRAINT "KnitterProgram_yarnLotId_fkey" FOREIGN KEY ("yarnLotId") REFERENCES "YarnLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GreyFabric" ADD CONSTRAINT "GreyFabric_knittingId_fkey" FOREIGN KEY ("knittingId") REFERENCES "Knitting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compacting" ADD CONSTRAINT "Compacting_compacterNameId_fkey" FOREIGN KEY ("compacterNameId") REFERENCES "CompacterName"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compacting" ADD CONSTRAINT "Compacting_colourId_fkey" FOREIGN KEY ("colourId") REFERENCES "Colour"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
