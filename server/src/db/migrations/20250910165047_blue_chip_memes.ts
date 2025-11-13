// ==== File: server/src/db/migrations/20250910_create_bluechip_memes.ts ====
import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("bluechip_memes", (table) => {
    table.string("mint").primary();
    table.string("name").nullable();
    table.string("symbol").nullable();
    table.text("image").nullable();

    // financial stats
    table.decimal("marketcap", 30, 6).nullable();
    table.decimal("price_change_24h", 16, 8).nullable();
    table.decimal("volume_24h", 30, 6).nullable();
    table.decimal("liquidity", 30, 6).nullable();

    table.timestamp("updated_at").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("bluechip_memes");
}
