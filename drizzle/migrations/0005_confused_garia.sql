CREATE TABLE `interview_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`round_id` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`metadata` text DEFAULT '{}',
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`round_id`) REFERENCES `interview_rounds`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `interview_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`overall_score` integer NOT NULL,
	`dimension_scores` text NOT NULL,
	`round_evaluations` text NOT NULL,
	`overall_feedback` text NOT NULL,
	`improvement_plan` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `interview_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `interview_reports_session_id_unique` ON `interview_reports` (`session_id`);--> statement-breakpoint
CREATE TABLE `interview_rounds` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`interviewer_type` text NOT NULL,
	`interviewer_config` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`question_count` integer DEFAULT 0 NOT NULL,
	`max_questions` integer DEFAULT 10 NOT NULL,
	`summary` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `interview_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `interview_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`resume_id` text,
	`job_description` text NOT NULL,
	`job_title` text DEFAULT '' NOT NULL,
	`selected_interviewers` text DEFAULT '[]' NOT NULL,
	`current_round` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'preparing' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`resume_id`) REFERENCES `resumes`(`id`) ON UPDATE no action ON DELETE no action
);
