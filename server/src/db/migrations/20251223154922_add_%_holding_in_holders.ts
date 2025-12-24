import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("token_holders", (table) => {
    table.decimal("holding_percent", 10, 6);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("token_holders", (table) => {
    table.dropColumn("holding_percent");
  });
}

