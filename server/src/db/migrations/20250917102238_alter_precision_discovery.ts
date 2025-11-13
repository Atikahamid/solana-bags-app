import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("discovery_tokens", (table) => {
    table.decimal("marketcap", 40, 12).nullable().alter();
    table.decimal("price_change_24h", 40, 12).nullable().alter();
    table.decimal("volume_24h", 40, 12).nullable().alter();
    table.decimal("liquidity", 40, 12).nullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("discovery_tokens", (table) => {
    table.decimal("marketcap", 30, 6).nullable().alter();
    table.decimal("price_change_24h", 16, 8).nullable().alter();
    table.decimal("volume_24h", 30, 6).nullable().alter();
    table.decimal("liquidity", 30, 6).nullable().alter();
  });
}
