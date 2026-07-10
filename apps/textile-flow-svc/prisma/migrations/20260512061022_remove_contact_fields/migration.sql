/*
  Warnings:

  - You are about to drop the column `contact_no` on the `compacters` table. All the data in the column will be lost.
  - You are about to drop the column `contact_person` on the `compacters` table. All the data in the column will be lost.
  - You are about to drop the column `contact_no` on the `dyers` table. All the data in the column will be lost.
  - You are about to drop the column `contact_person` on the `dyers` table. All the data in the column will be lost.
  - You are about to drop the column `contact_no` on the `knitters` table. All the data in the column will be lost.
  - You are about to drop the column `contact_person` on the `knitters` table. All the data in the column will be lost.
  - You are about to drop the column `contact_no` on the `mills` table. All the data in the column will be lost.
  - You are about to drop the column `contact_person` on the `mills` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "compacters" DROP COLUMN "contact_no",
DROP COLUMN "contact_person";

-- AlterTable
ALTER TABLE "dyers" DROP COLUMN "contact_no",
DROP COLUMN "contact_person";

-- AlterTable
ALTER TABLE "knitters" DROP COLUMN "contact_no",
DROP COLUMN "contact_person";

-- AlterTable
ALTER TABLE "mills" DROP COLUMN "contact_no",
DROP COLUMN "contact_person";
