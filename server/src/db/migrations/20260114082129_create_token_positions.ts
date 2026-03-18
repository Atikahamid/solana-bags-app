// File: migrations/xxxx_create_token_positions_table.ts

import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("token_positions", (table) => {
    table
      .uuid("id")
      .defaultTo(knex.raw("gen_random_uuid()"))
      .primary();

    // 🔗 References
    table
      .string("user_privy_id")
      .notNullable()
      .references("privy_id")
      .inTable("users")
      .onDelete("CASCADE");

    table
      .string("token_mint")
      .notNullable()
      .references("mint_address")
      .inTable("tokens")
      .onDelete("CASCADE");

    // Aggregated buy data
    table.decimal("total_bought_qty", 30, 10).notNullable().defaultTo(0);
    table.decimal("total_bought_usd", 18, 2).notNullable().defaultTo(0);

    // Aggregated sell data
    table.decimal("total_sold_qty", 30, 10).notNullable().defaultTo(0);
    table.decimal("total_sold_usd", 18, 2).notNullable().defaultTo(0);

    // Average cost basis
    table.decimal("avg_buy_price", 18, 8).notNullable().defaultTo(0);

    // Realized PnL only
    table.decimal("realized_pnl_usd", 18, 2).notNullable().defaultTo(0);

    // Cached remaining position
    table.decimal("remaining_qty", 30, 10).notNullable().defaultTo(0);
    table.decimal("remaining_cost_usd", 18, 2).notNullable().defaultTo(0);

    table.timestamps(true, true);

    // Ensure 1 position per user per token
    table.unique(["user_privy_id", "token_mint"]);

    table.index(["user_privy_id"]);
    table.index(["token_mint"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("token_positions");
}
