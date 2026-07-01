const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  console.log('Running backfill...');
  try {
    const res = await client.query(`
      INSERT INTO "knitter_program_yarn_usages" ("knitter_program_id", "yarn_lot_id", "quantity_used", "created_at", "updated_at")
      SELECT "id", "yarn_lot_id", "quantity_used", "created_at", "updated_at" 
      FROM "knitter_programs" 
      WHERE "yarn_lot_id" IS NOT NULL;
    `);
    console.log(`Successfully backfilled ${res.rowCount} records.`);
  } catch(e) {
    console.error('Error during backfill:', e.message);
  } finally {
    await client.end();
  }
}

main();
