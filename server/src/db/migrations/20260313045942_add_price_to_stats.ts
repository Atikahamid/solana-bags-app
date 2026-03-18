import type { Knex } from "knex";


// new migration, e.g. 2026xxxxxx_add_price_usd_to_token_stats.ts
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("token_stats", (table) => {
    table.decimal("price_usd", 30, 10).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("token_stats", (table) => {
    table.dropColumn("price_usd");
  });
}
