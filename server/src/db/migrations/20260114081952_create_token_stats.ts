// File: migrations/xxxx_create_token_stats_table.ts

import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("token_stats", (table) => {
    table.increments("id").primary();

    table
      .string("token_mint")
      .notNullable()
      .references("mint_address")
      .inTable("tokens")
      .onDelete("CASCADE")
      .unique("token_stats_token_mint_unique");

    table.decimal("market_cap", 30, 6);
    table.decimal("volume_24h", 30, 6);
    table.decimal("liquidity", 30, 6);

    table.bigInteger("holders_count");

    // FINAL STATE after all alterations
    table.decimal("total_supply", 40, 10).nullable();

    table.timestamp("created_on");
    table.decimal("all_time_high", 30, 8);

    table.bigInteger("active_traders");
    table.decimal("price_change_24h", 16, 8);

    table.bigInteger("tx_count");
    table.decimal("buy_volume", 30, 6);
    table.decimal("sell_volume", 30, 6);
    table.bigInteger("num_buys");
    table.bigInteger("num_sells");

    table.decimal("bonding_curve_progress", 5, 2);
    table.string("protocol_family");

    table.decimal("top_10_holders_%", 10, 4);
    table.decimal("holding_top_10", 10, 4);
    table.decimal("holding_dev", 10, 4);
    table.decimal("holding_snipers", 10, 4);
    table.decimal("holding_insiders", 10, 4);
    table.decimal("holding_bundle", 10, 4);

    table.timestamp("fetched_at").notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("token_stats");
} 