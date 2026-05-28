CREATE TABLE `product_lines` (
	`id` text PRIMARY KEY NOT NULL,
	`category_id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`long_description` text,
	`image_url` text,
	`gallery_urls` text,
	`features` text,
	`system_requirements` text,
	`safety_rating` integer DEFAULT 5 NOT NULL,
	`functionality_rating` integer DEFAULT 5 NOT NULL,
	`on_update` integer DEFAULT true NOT NULL,
	`needs_usb` integer DEFAULT false NOT NULL,
	`has_spoofer` integer DEFAULT false NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_line_category_slug` ON `product_lines` (`category_id`,`slug`);--> statement-breakpoint
ALTER TABLE `products` ADD `line_id` text REFERENCES `product_lines`(`id`) ON UPDATE no action ON DELETE cascade;
