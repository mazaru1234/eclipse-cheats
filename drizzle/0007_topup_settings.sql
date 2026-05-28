CREATE TABLE `topup_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`min_amount_rub` real DEFAULT 100 NOT NULL,
	`max_amount_rub` real DEFAULT 100000 NOT NULL,
	`fee_percent` real DEFAULT 5 NOT NULL,
	`preset_amounts` text DEFAULT '[500,1000,2500,5000,10000]' NOT NULL,
	`user_daily_limit_rub` real DEFAULT 50000 NOT NULL,
	`user_daily_max_count` integer DEFAULT 10 NOT NULL,
	`admin_manual_max_rub` real DEFAULT 50000 NOT NULL,
	`admin_daily_limit_rub` real DEFAULT 500000 NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT OR IGNORE INTO `topup_settings` (`id`, `enabled`, `min_amount_rub`, `max_amount_rub`, `fee_percent`, `preset_amounts`, `user_daily_limit_rub`, `user_daily_max_count`, `admin_manual_max_rub`, `admin_daily_limit_rub`, `updated_at`)
VALUES ('default', 1, 100, 100000, 5, '[500,1000,2500,5000,10000]', 50000, 10, 50000, 500000, unixepoch());
