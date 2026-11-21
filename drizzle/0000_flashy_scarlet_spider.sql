CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`aircraft` text NOT NULL,
	`system` text NOT NULL,
	`severity` integer NOT NULL,
	`due` text NOT NULL,
	`status` text NOT NULL,
	`assignee` text NOT NULL,
	`notes` text NOT NULL,
	`created` text NOT NULL
);
