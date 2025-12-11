import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("tokens", (table) => {
    table.specificType("total_supply", "numeric").nullable().alter();
    table.timestamp("created_on").nullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("tokens", (table) => {
    table.specificType("total_supply", "numeric").notNullable().alter();
    table.timestamp("created_on").notNullable().alter();
  });
}
