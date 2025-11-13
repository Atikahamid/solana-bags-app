// migrations/20230918101000_create_token_stats.ts
import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("token_stats", (table) => {
    table.increments("id").primary();
    table
      .integer("token_id")
      .references("id")
      .inTable("tokens")
      .onDelete("CASCADE");
    table.decimal("market_cap", 30, 6).nullable();
    table.decimal("volume_24h", 30, 6).nullable();
    table.decimal("liquidity", 30, 6).nullable();
    table.bigInteger("holders").nullable();
    table.decimal("all_time_high", 30, 8).nullable();
    table.bigInteger("active_traders").nullable();
    table.decimal("price_change_24h", 16, 8).nullable();
    table.bigInteger("trades").nullable();
    table.decimal("buy_volume", 30, 6).nullable();
    table.decimal("sell_volume", 30, 6).nullable();
    table.bigInteger("num_buys").nullable();
    table.bigInteger("num_sells").nullable();
    table.timestamp("fetched_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("token_stats");
}
