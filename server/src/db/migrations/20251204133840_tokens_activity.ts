import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("token_activity", (table) => {
        table.increments("id").primary();

        table.string("token_mint")
            .notNullable()
            .references("mint_address")
            .inTable("tokens")
            .onDelete("CASCADE");

        table.string("user_id")
            .notNullable()
            .references("privy_id")
            .inTable("users")
            .onDelete("CASCADE");
        table.string("tx_hash").notNullable();
        table.enu("action", ["buy", "sell", "transfer"]).notNullable();
        table.decimal("amount_of_sol_spent_received", 30, 8).notNullable(); //This represents the amount of SOL spent or received in the trade.
        table.decimal("marketcap_at_trade_time", 30, 6); //This is the current market cap at the time of the trade.
        table.decimal("price_change", 16, 8);  //This is the price movement over a short interval relative to the trade.
        table.timestamp("time");
        table.timestamp("timestamp").notNullable();
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("token_activity");
}
