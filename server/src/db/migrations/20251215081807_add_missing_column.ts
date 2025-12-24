import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (table) => {
    table.boolean("has_accepted_terms").notNullable().defaultTo(false);
    table.boolean("is_guest").notNullable().defaultTo(false);
    table.boolean("is_verified").notNullable().defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (table) => {
    table.dropColumn("has_accepted_terms");
    table.dropColumn("is_guest");
    table.dropColumn("is_verified");
  });
}
