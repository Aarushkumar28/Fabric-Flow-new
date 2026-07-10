DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'POStatus') THEN
    CREATE TYPE "POStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'COMPLETED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'YarnInwardStatus') THEN
    CREATE TYPE "YarnInwardStatus" AS ENUM ('PENDING', 'RECEIVED', 'CANCELLED');
  END IF;
END;
$$;

ALTER TABLE purchase_orders
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE "POStatus" USING status::"POStatus",
  ALTER COLUMN status SET DEFAULT 'ACTIVE'::"POStatus";

ALTER TABLE yarn_inwards
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE "YarnInwardStatus" USING status::"YarnInwardStatus",
  ALTER COLUMN status SET DEFAULT 'PENDING'::"YarnInwardStatus";

ALTER TABLE grey_fabric_lots
  ALTER COLUMN status TYPE "GreyFabricLotStatus" USING status::"GreyFabricLotStatus";
