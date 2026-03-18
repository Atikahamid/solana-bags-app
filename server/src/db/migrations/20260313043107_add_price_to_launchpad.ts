import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("launchpad_tokens", (table) => {
    table.decimal("price_usd", 30, 10).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("launchpad_tokens", (table) => {
    table.dropColumn("price_usd");
  });
}