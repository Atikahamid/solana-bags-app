import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("discovery_tokens", (table) => {
        table.string("mint").notNullable();
        table.string("category").notNullable();
        table.string("name");
        table.string("symbol");
        table.text("uri");
        table.text("image");

        table.decimal("marketcap", 30, 6);
        table.decimal("price_change_24h", 16, 8);
        table.decimal("volume_24h", 30, 6);
        table.decimal("liquidity", 30, 6);

        table.timestamp("updated_at");

        table.primary(["mint", "category"]);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("discovery_tokens");
}
