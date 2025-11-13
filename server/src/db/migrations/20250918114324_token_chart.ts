// migrations/20230918104000_create_token_chart.ts
import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("token_chart", (table) => {
    table.increments("id").primary();
    table
      .integer("token_id")
      .references("id")
      .inTable("tokens")
      .onDelete("CASCADE");
    table.enu("interval", ["1m", "5m", "1h", "1d"]).notNullable();
    table.timestamp("time_bucket").notNullable();
    table.decimal("open", 30, 8).notNullable();
    table.decimal("close", 30, 8).notNullable();
    table.decimal("high", 30, 8).notNullable();
    table.decimal("low", 30, 8).notNullable();
    table.decimal("volume", 30, 8).notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("token_chart");
}
