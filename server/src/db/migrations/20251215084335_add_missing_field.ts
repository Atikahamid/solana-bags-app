import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("token_positions", (table) => {
    table.decimal("remaining_cost_usd", 18, 2).notNullable().defaultTo(0);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("token_positions", (table) => {
    table.dropColumn("remaining_cost_usd");
  });
}
