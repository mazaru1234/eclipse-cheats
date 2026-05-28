CREATE TABLE `exchange_rates` (
	`id` text PRIMARY KEY NOT NULL,
	`eur_rub` real NOT NULL,
	`usd_rub` real NOT NULL,
	`source` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT OR IGNORE INTO `exchange_rates` (`id`, `eur_rub`, `usd_rub`, `source`, `updated_at`)
VALUES ('default', 98, 95, 'seed', unixepoch());
--> statement-breakpoint
UPDATE `products` SET `price` = ROUND(`price` * 95, 0) WHERE `price` > 0 AND `price` < 500;
--> statement-breakpoint
UPDATE `users` SET `balance` = ROUND(`balance` * 95, 0) WHERE `balance` > 0 AND `balance` < 1000;
--> statement-breakpoint
UPDATE `orders` SET
  `amount` = ROUND(`amount` * 95, 0),
  `original_amount` = ROUND(`original_amount` * 95, 0),
  `discount_amount` = ROUND(`discount_amount` * 95, 0)
WHERE `amount` > 0 AND `amount` < 500;
--> statement-breakpoint
UPDATE `promo_codes` SET `min_order_amount` = ROUND(`min_order_amount` * 95, 0)
WHERE `min_order_amount` > 0 AND `min_order_amount` < 500;
--> statement-breakpoint
UPDATE `payment_deposits` SET
  `amount_usd` = ROUND(`amount_usd` * 95, 0),
  `amount_rub` = ROUND(`amount_rub` * 95, 0),
  `pay_amount_rub` = ROUND(`pay_amount_rub` * 95, 0)
WHERE `amount_usd` > 0 AND `amount_usd` < 500;
