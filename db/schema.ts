import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const tasks = sqliteTable('tasks', {
 id: text('id').primaryKey(), title: text('title').notNull(), aircraft: text('aircraft').notNull(), system: text('system').notNull(), severity: integer('severity').notNull(), due: text('due').notNull(), status: text('status').notNull(), assignee: text('assignee').notNull(), notes: text('notes').notNull(), created: text('created').notNull()
});
export const activity = sqliteTable('activity', {
 id: integer('id').primaryKey({autoIncrement:true}),
 taskId: text('task_id').notNull(), title: text('title').notNull(), aircraft: text('aircraft').notNull(), action: text('action').notNull(), detail: text('detail').notNull(), created: text('created').notNull()
});
export const settings = sqliteTable('settings', {
 id: text('id').primaryKey(), displayName: text('display_name').notNull(), workspace: text('workspace').notNull()
});
