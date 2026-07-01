import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set.');
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }, // required for Supabase
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Cleaning up empty GSTINs in mills...');
  await prisma.$executeRaw`UPDATE mills SET gstin = NULL WHERE trim(gstin) = ''`;

  console.log('Cleaning up empty GSTINs in knitters...');
  await prisma.$executeRaw`UPDATE knitters SET gstin = NULL WHERE trim(gstin) = ''`;

  console.log('Cleaning up empty GSTINs in dyers...');
  await prisma.$executeRaw`UPDATE dyers SET gstin = NULL WHERE trim(gstin) = ''`;

  console.log('Cleaning up empty GSTINs in compacters...');
  await prisma.$executeRaw`UPDATE compacters SET gstin = NULL WHERE trim(gstin) = ''`;

  console.log('SQL cleanup done.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
