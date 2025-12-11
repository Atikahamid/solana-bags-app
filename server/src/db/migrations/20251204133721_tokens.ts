import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("tokens", (table) => {
        table.string("mint_address").primary();
        table.string("name").notNullable();
        table.string("symbol").notNullable();
        table.text("image");
        table.text("uri");
        table.text("description");
        // socials object (WHY: supports dynamic social links)
        table.jsonb("socials").defaultTo("{}");


        table.bigInteger("total_supply").notNullable();
        table.timestamp("created_on").notNullable();
        table.timestamp("last_updated").defaultTo(knex.fn.now());
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("tokens");
}

