import type { Knex } from "knex";


// migrations/xxxx_add_is_active_to_tokens.ts
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("tokens", (table) => {
    table.boolean("is_active").notNullable().defaultTo(true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("tokens", (table) => {
    table.dropColumn("is_active");
  });
}

