CREATE TABLE `grammar_checks` (
	`id` text PRIMARY KEY NOT NULL,
	`resume_id` text NOT NULL,
	`result` text NOT NULL,
	`score` integer NOT NULL,
	`issue_count` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`resume_id`) REFERENCES `resumes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `jd_analyses` (
	`id` text PRIMARY KEY NOT NULL,
	`resume_id` text NOT NULL,
	`job_description` text NOT NULL,
	`result` text NOT NULL,
	`overall_score` integer NOT NULL,
	`ats_score` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`resume_id`) REFERENCES `resumes`(`id`) ON UPDATE no action ON DELETE cascade
);
