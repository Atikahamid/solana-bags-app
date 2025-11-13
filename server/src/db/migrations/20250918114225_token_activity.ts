// migrations/20230918103000_create_token_activity.ts
import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("token_activity", (table) => {
    table.increments("id").primary();
    table
      .integer("token_id")
      .references("id")
      .inTable("tokens")
      .onDelete("CASCADE");
    table.text("tx_hash").notNullable();
    table.enu("action", ["buy", "sell", "transfer"]).notNullable();
    table.decimal("amount", 30, 8).notNullable();
    table.timestamp("timestamp").notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("token_activity");
}
