import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("discovery_tokens", (table) => {
        table.string("mint").notNullable();
        table.string("category").notNullable(); // trending, popular, featured, ai, stock, lst, bluechip_meme
        table.string("name").nullable();
        table.string("symbol").nullable();
        table.text("image").nullable();

        // financial stats
        table.decimal("marketcap", 30, 6).nullable();
        table.decimal("price_change_24h", 16, 8).nullable();
        table.decimal("volume_24h", 30, 6).nullable();
        table.decimal("liquidity", 30, 6).nullable();

        table.timestamp("updated_at").nullable();

        table.primary(["mint", "category"]); // same token can exist in multiple categories
    });
}


export async function down(knex: Knex): Promise<void> {
     await knex.schema.dropTableIfExists("discovery_tokens");
}

