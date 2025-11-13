// migrations/20230918100000_create_tokens.ts
import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("tokens", (table) => {
    table.increments("id").primary();
    table.text("mint_address").unique().notNullable();
    table.text("name").notNullable();
    table.text("symbol").notNullable();
    table.text("uri").nullable();
    table.text("description").nullable();
    table.timestamp("created_on").notNullable();
    table.bigInteger("total_supply").notNullable();
    table.timestamp("last_updated").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("tokens");
}
