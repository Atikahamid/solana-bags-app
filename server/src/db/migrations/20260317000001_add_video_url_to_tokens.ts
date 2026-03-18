// File: migrations/xxxx_add_video_url_to_tokens.ts

import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("tokens", (table) => {
    table.text("video_url").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("tokens", (table) => {
    table.dropColumn("video_url");
  });
}