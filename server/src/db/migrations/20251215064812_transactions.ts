import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("transactions", (table) => {
    table.uuid("id").defaultTo(knex.raw("gen_random_uuid()")).primary();

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
    table.decimal("quantity", 30, 10).notNullable(); // SPL tokens
    table.decimal("price_usd", 18, 8).notNullable(); // price per token
    table.decimal("total_usd", 18, 2).notNullable(); // quantity * price

    // Solana metadata
    table.string("tx_hash").unique().notNullable();
    table.bigInteger("slot").nullable();

    table.timestamp("executed_at").notNullable();

    table.timestamps(true, true);

    // Indexes for performance
    table.index(["user_privy_id"]);
    table.index(["token_mint"]);
    table.index(["tx_hash"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("transactions");
}
