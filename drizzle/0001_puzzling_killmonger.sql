CREATE TABLE `activity` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`task_id` text NOT NULL,
	`title` text NOT NULL,
	`aircraft` text NOT NULL,
	`action` text NOT NULL,
	`detail` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`workspace` text NOT NULL
);
--> statement-breakpoint
CREATE TRIGGER tasks_created AFTER INSERT ON tasks BEGIN
 INSERT INTO activity (task_id,title,aircraft,action,detail,created) VALUES (new.id,new.title,new.aircraft,'Created',new.status,strftime('%Y-%m-%dT%H:%M:%fZ','now'));
END;
--> statement-breakpoint
CREATE TRIGGER tasks_updated AFTER UPDATE ON tasks BEGIN
 INSERT INTO activity (task_id,title,aircraft,action,detail,created) VALUES (new.id,new.title,new.aircraft,'Updated',old.status || ' → ' || new.status,strftime('%Y-%m-%dT%H:%M:%fZ','now'));
END;
--> statement-breakpoint
CREATE TRIGGER tasks_deleted AFTER DELETE ON tasks BEGIN
 INSERT INTO activity (task_id,title,aircraft,action,detail,created) VALUES (old.id,old.title,old.aircraft,'Deleted',old.status,strftime('%Y-%m-%dT%H:%M:%fZ','now'));
END;
