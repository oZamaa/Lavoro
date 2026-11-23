CREATE TABLE `applications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company` text NOT NULL,
	`title` text NOT NULL,
	`city` text,
	`url` text,
	`source` text,
	`contract` text,
	`remote` text,
	`salary` text,
	`applied_at` text,
	`follow_up_at` text,
	`notes` text,
	`contact_name` text,
	`contact_email` text,
	`column_id` integer NOT NULL,
	`position` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`column_id`) REFERENCES `columns`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `applications_column_position_idx` ON `applications` (`column_id`,`position`);--> statement-breakpoint
CREATE TABLE `columns` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`position` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `status_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`application_id` integer NOT NULL,
	`from_column_id` integer,
	`to_column_id` integer,
	`changed_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`from_column_id`) REFERENCES `columns`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`to_column_id`) REFERENCES `columns`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `status_history_application_idx` ON `status_history` (`application_id`);