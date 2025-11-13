import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("discovery_tokens", (table) => {
    table.string("market_address").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("discovery_tokens", (table) => {
    table.dropColumn("market_address");
  });
}
