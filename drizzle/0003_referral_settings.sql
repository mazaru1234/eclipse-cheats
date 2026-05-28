CREATE TABLE `referral_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`friend_discount_type` text DEFAULT 'fixed' NOT NULL,
	`friend_discount_rub` real DEFAULT 50 NOT NULL,
	`friend_discount_usd` real DEFAULT 0.5 NOT NULL,
	`referrer_bonus_type` text DEFAULT 'percent' NOT NULL,
	`referrer_bonus_rub` real DEFAULT 0 NOT NULL,
	`referrer_bonus_usd` real DEFAULT 5 NOT NULL,
	`dynamic_rank_bonus` integer DEFAULT false NOT NULL,
	`recurrent_bonus` integer DEFAULT false NOT NULL,
	`monthly_referral_limit` integer DEFAULT 20 NOT NULL,
	`bonus_validity_days` integer DEFAULT 90 NOT NULL,
	`payout_delay_days` integer DEFAULT 0 NOT NULL,
	`max_referrals_per_ip` integer DEFAULT 3 NOT NULL,
	`blocked_email_domains` text DEFAULT '' NOT NULL,
	`updated_at` integer NOT NULL
);
