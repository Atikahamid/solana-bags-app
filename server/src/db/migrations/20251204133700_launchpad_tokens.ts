import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("launchpad_tokens", (table) => {
        table.string("mint").notNullable();
        table.string("category").notNullable();

        table.string("name");
        table.string("symbol");
        table.text("image");
        table.text("uri");

        table.timestamp("time");

        table.text("social_twitter_profile");
        table.text("social_platform");
        table.text("social_website");
        table.text("social_telegram");
        table.text("social_twitter");
        table.text("social_tiktok");

        table.bigInteger("holders");
        table.bigInteger("pro_traders");
        table.bigInteger("kols");
        table.bigInteger("num_migrations");

        table.decimal("marketcap", 30, 6);
        table.decimal("volume", 30, 6);
        table.decimal("fees", 30, 6);
        table.bigInteger("txns");

        table.decimal("holding_top_10", 10, 4);
        table.decimal("holding_dev", 10, 4);
        table.decimal("holding_snipers", 10, 4);
        table.decimal("holding_insiders", 10, 4);
        table.decimal("holding_bundle", 10, 4);

        table.timestamp("updated_at");

        table.primary(["mint", "category"]);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("launchpad_tokens");
}
