// ==== File: server/src/db/migrations/20250916_create_special_tokens.ts ====
import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("launchpad_tokens", (table) => {
        table.string("mint").notNullable();
        table.string("category").notNullable(); // new_pair, final_stretch, migrated
        table.string("name").nullable();
        table.string("symbol").nullable();
        table.text("image").nullable();

        // timing info
        table.timestamp("time").nullable();

        // socials (explicit columns, grouped by prefix "social_")
        table.text("social_twitter_profile").nullable();
        table.text("social_platform").nullable();
        table.text("social_website").nullable();
        table.text("social_telegram").nullable();
        table.text("social_twitter").nullable();
        table.text("social_tiktok").nullable();

        // core metrics
        table.bigInteger("holders").nullable();
        table.bigInteger("pro_traders").nullable();
        table.bigInteger("kols").nullable();
        table.bigInteger("num_migrations").nullable();

        table.decimal("marketcap", 30, 6).nullable();
        table.decimal("volume", 30, 6).nullable();
        table.decimal("fees", 30, 6).nullable();
        table.bigInteger("txns").nullable();

        // holdings (explicit columns, grouped by prefix "holding_")
        table.decimal("holding_top_10", 10, 4).nullable();   // %
        table.decimal("holding_dev", 10, 4).nullable();      // %
        table.decimal("holding_snipers", 10, 4).nullable();  // %
        table.decimal("holding_insiders", 10, 4).nullable(); // %
        table.decimal("holding_bundle", 10, 4).nullable();   // %
       
        table.timestamp("updated_at").nullable();

        table.primary(["mint", "category"]);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("launchpad_tokens");
}
