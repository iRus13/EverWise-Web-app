import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const appStores = sqliteTable('app_stores', {
  name: text('name').primaryKey(),
  revision: integer('revision').notNull(),
  body: text('body').notNull(),
});
