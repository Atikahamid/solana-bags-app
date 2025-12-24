import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("transactions", (table) => {
    table.decimal("cost_basis_usd", 18, 2).nullable();
    table.decimal("realized_pnl_usd", 18, 2).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("transactions", (table) => {
    table.dropColumn("cost_basis_usd");
    table.dropColumn("realized_pnl_usd");
  });
}
