import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable("launchpad_tokens", (table) => {
        table.decimal("bonding_curve_progress", 5, 2);
        table.string("protocol_family");
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable("launchpad_tokens", (table) => {
        table.dropColumn("bonding_curve_progress");
        table.dropColumn("protocol_family");
    });
}
