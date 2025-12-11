import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("token_chart", (table) => {
        table.increments("id").primary();

        table.string("token_mint")
            .notNullable()
            .references("mint_address")
            .inTable("tokens")
            .onDelete("CASCADE");

        table.enu("interval", ["1m", "5m", "1h", "1d"]).notNullable();
        // IMPORTANT: use integer unix timestamp
        table.bigInteger("time").notNullable();
        table.decimal("open", 30, 8).notNullable();
        table.decimal("close", 30, 8).notNullable();
        table.decimal("high", 30, 8).notNullable();
        table.decimal("low", 30, 8).notNullable();
        table.decimal("volume", 30, 8).notNullable();

         // avoid duplicates
        table.unique(["token_mint", "interval", "time"]);

        // indexing for fast queries
        table.index(["token_mint", "interval", "time"]);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("token_chart");
}
