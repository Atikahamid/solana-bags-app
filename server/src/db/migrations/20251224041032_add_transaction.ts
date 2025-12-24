// migrations/2025xxxx_add_price_sol_and_marketcap_to_transactions.ts
import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("transactions", (table) => {
    table
      .decimal("price_sol", 30, 15)
      .nullable()
        .comment("Total SOL amount involved in the trade");

    table
      .decimal("marketcap_at_trade", 30, 2)
      .nullable()
      .comment("Token market cap in USD at execution time");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("transactions", (table) => {
    table.dropColumn("price_sol");
    table.dropColumn("marketcap_at_trade");
  });
}
