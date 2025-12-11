import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("tokens", (table) => {
    table.bigInteger("total_supply").nullable().alter();
    table.timestamp("created_on").nullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("tokens", (table) => {
    table.bigInteger("total_supply").notNullable().alter();
    table.timestamp("created_on").notNullable().alter();
  });
}
