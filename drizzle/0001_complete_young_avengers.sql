CREATE TABLE `payment_deposits` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`platega_transaction_id` text,
	`amount_usd` real NOT NULL,
	`amount_rub` real NOT NULL,
	`fee_percent` real DEFAULT 5 NOT NULL,
	`pay_amount_rub` real NOT NULL,
	`payment_method` integer,
	`status` text DEFAULT 'pending' NOT NULL,
	`payment_url` text,
	`created_at` integer NOT NULL,
	`confirmed_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
