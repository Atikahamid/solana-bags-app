import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("portfolio_snapshots", (table) => {
    table.uuid("id").defaultTo(knex.raw("gen_random_uuid()")).primary();

    table
      .string("user_privy_id")
      .notNullable()
      .references("privy_id")
      .inTable("users")
      .onDelete("CASCADE");

    table.timestamp("snapshot_at").notNullable();

    table.decimal("equity_usd", 18, 2).notNullable();
    table.decimal("cash_usd", 18, 2).notNullable();
    table.decimal("unrealized_pnl_usd", 18, 2).notNullable();
    table.decimal("realized_pnl_usd", 18, 2).notNullable();

    table.timestamps(true, true);

    table.index(["user_privy_id", "snapshot_at"]);
    table.unique(["user_privy_id", "snapshot_at"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("portfolio_snapshots");
}
