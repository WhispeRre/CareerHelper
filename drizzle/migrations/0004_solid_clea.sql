CREATE TABLE `resume_shares` (
	`id` text PRIMARY KEY NOT NULL,
	`resume_id` text NOT NULL,
	`token` text NOT NULL,
	`label` text DEFAULT '' NOT NULL,
	`password` text,
	`view_count` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`resume_id`) REFERENCES `resumes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `resume_shares_token_unique` ON `resume_shares` (`token`);