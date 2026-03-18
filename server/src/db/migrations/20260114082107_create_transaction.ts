// File: migrations/xxxx_create_transactions_table.ts

import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("transactions", (table) => {
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

    // BUY or SELL
    table.enu("type", ["BUY", "SELL"]).notNullable();

    // Trading data
    table.decimal("quantity", 30, 10).notNullable();
    table.decimal("price_usd", 18, 8).notNullable();
    table.decimal("total_usd", 18, 2).notNullable();

    // Solana metadata
    table.string("tx_hash").notNullable().unique();
    table.bigInteger("slot").nullable();
    table.timestamp("executed_at").notNullable();

    // 🔥 Added later
    table.decimal("cost_basis_usd", 18, 2).nullable();
    table.decimal("realized_pnl_usd", 18, 2).nullable();

    table
      .decimal("price_sol", 30, 15)
      .nullable()
      .comment("Total SOL amount involved in the trade");

    table
      .decimal("marketcap_at_trade", 30, 2)
      .nullable()
      .comment("Token market cap in USD at execution time");

    table.timestamps(true, true);

    // Indexes
    table.index(["user_privy_id"]);
    table.index(["token_mint"]);
    table.index(["tx_hash"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("transactions");
}