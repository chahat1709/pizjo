CREATE TABLE `offer_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(180) NOT NULL,
	`displayLabel` varchar(80) NOT NULL,
	`description` text,
	`terms` text,
	`promoCode` varchar(48),
	`discountType` enum('percentage','fixed','bogo','free_item') NOT NULL,
	`discountValue` int NOT NULL DEFAULT 0,
	`minimumOrderPaise` int NOT NULL DEFAULT 0,
	`maximumDiscountPaise` int,
	`appliesTo` enum('order','category','menu_item') NOT NULL DEFAULT 'order',
	`menuItemId` int,
	`categoryId` int,
	`status` enum('draft','scheduled','active','paused','expired') NOT NULL DEFAULT 'draft',
	`startsAt` timestamp,
	`endsAt` timestamp,
	`isFeatured` boolean NOT NULL DEFAULT false,
	`createdById` int NOT NULL,
	`updatedById` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `offer_campaigns_id` PRIMARY KEY(`id`),
	CONSTRAINT `offer_campaigns_promoCode_unique` UNIQUE(`promoCode`)
);
--> statement-breakpoint
ALTER TABLE `offer_campaigns` ADD CONSTRAINT `offer_campaigns_menuItemId_menu_items_id_fk` FOREIGN KEY (`menuItemId`) REFERENCES `menu_items`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `offer_campaigns` ADD CONSTRAINT `offer_campaigns_categoryId_menu_categories_id_fk` FOREIGN KEY (`categoryId`) REFERENCES `menu_categories`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `offer_campaigns` ADD CONSTRAINT `offer_campaigns_createdById_users_id_fk` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `offer_campaigns` ADD CONSTRAINT `offer_campaigns_updatedById_users_id_fk` FOREIGN KEY (`updatedById`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `offer_campaigns_status_window_idx` ON `offer_campaigns` (`status`,`startsAt`,`endsAt`);--> statement-breakpoint
CREATE INDEX `offer_campaigns_menu_item_idx` ON `offer_campaigns` (`menuItemId`);--> statement-breakpoint
CREATE INDEX `offer_campaigns_category_idx` ON `offer_campaigns` (`categoryId`);