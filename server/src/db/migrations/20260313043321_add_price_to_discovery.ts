import type { Knex } from "knex";
// new migration: 2026xxxxxx_add_price_to_discovery_tokens.ts
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("discovery_tokens", (table) => {
    table.decimal("price_usd", 30, 10).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("discovery_tokens", (table) => {
    table.dropColumn("price_usd");
  });
}