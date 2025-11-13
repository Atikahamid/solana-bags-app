// migrations/20230918102000_create_token_holders.ts
import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("token_holders", (table) => {
    table.increments("id").primary();
    table
      .integer("token_id")
      .references("id")
      .inTable("tokens")
      .onDelete("CASCADE");
    table.text("holder_address").notNullable();
    table.decimal("balance", 30, 8).notNullable();
    table.decimal("percent_of_supply", 10, 6).notNullable();
    table.timestamp("fetched_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("token_holders");
}
