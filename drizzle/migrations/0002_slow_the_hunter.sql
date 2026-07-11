ALTER TABLE `resumes` ADD `share_token` text;--> statement-breakpoint
ALTER TABLE `resumes` ADD `is_public` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `resumes` ADD `share_password` text;--> statement-breakpoint
ALTER TABLE `resumes` ADD `view_count` integer DEFAULT 0 NOT NULL;