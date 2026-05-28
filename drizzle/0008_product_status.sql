ALTER TABLE `product_lines` ADD `status` text DEFAULT 'on_update' NOT NULL;
--> statement-breakpoint
UPDATE `product_lines` SET `status` = CASE WHEN `on_update` = 1 THEN 'on_update' ELSE 'undetected' END;
