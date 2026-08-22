CREATE TABLE `activity_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorUserId` int,
	`employeeId` int,
	`action` varchar(140) NOT NULL,
	`entityType` varchar(80) NOT NULL,
	`entityId` varchar(80),
	`detail` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `business_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessName` varchar(180) NOT NULL,
	`address` text,
	`phone` varchar(32),
	`gstin` varchar(32),
	`invoicePrefix` varchar(24) NOT NULL DEFAULT 'PIZ',
	`taxRateBps` int NOT NULL DEFAULT 0,
	`updatedById` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `business_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`fullName` varchar(180) NOT NULL,
	`phone` varchar(32),
	`email` varchar(320),
	`jobTitle` varchar(120),
	`accessRole` enum('admin','staff') NOT NULL DEFAULT 'staff',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employees_id` PRIMARY KEY(`id`),
	CONSTRAINT `employees_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `inventory_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(180) NOT NULL,
	`sku` varchar(80),
	`unit` varchar(30) NOT NULL,
	`currentStock` int NOT NULL DEFAULT 0,
	`lowStockThreshold` int NOT NULL DEFAULT 0,
	`linkedMenuItemId` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventory_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_sku_unique` UNIQUE(`sku`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceNumber` varchar(48) NOT NULL,
	`orderId` int NOT NULL,
	`status` enum('draft','issued','void') NOT NULL DEFAULT 'issued',
	`customerName` varchar(180),
	`customerPhone` varchar(32),
	`subtotalPaise` int NOT NULL,
	`taxPaise` int NOT NULL DEFAULT 0,
	`discountPaise` int NOT NULL DEFAULT 0,
	`totalPaise` int NOT NULL,
	`issuedAt` timestamp NOT NULL DEFAULT (now()),
	`createdById` int NOT NULL,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_invoiceNumber_unique` UNIQUE(`invoiceNumber`),
	CONSTRAINT `invoices_orderId_unique` UNIQUE(`orderId`)
);
--> statement-breakpoint
CREATE TABLE `menu_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`catalogKey` varchar(180) NOT NULL,
	`name` varchar(180) NOT NULL,
	`sortOrder` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `menu_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `menu_categories_catalogKey_unique` UNIQUE(`catalogKey`)
);
--> statement-breakpoint
CREATE TABLE `menu_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`catalogId` varchar(240) NOT NULL,
	`categoryId` int NOT NULL,
	`name` varchar(240) NOT NULL,
	`description` text,
	`imageUrl` text,
	`pricePaise` int NOT NULL,
	`isVegetarian` boolean NOT NULL DEFAULT true,
	`isAvailable` boolean NOT NULL DEFAULT true,
	`isOutOfStock` boolean NOT NULL DEFAULT false,
	`sortOrder` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `menu_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `menu_items_catalogId_unique` UNIQUE(`catalogId`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`menuItemId` int,
	`catalogId` varchar(240),
	`itemName` varchar(240) NOT NULL,
	`unitPricePaise` int NOT NULL,
	`quantity` int NOT NULL,
	`lineTotalPaise` int NOT NULL,
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNumber` varchar(40) NOT NULL,
	`source` enum('whatsapp','walk_in','phone','other') NOT NULL DEFAULT 'whatsapp',
	`status` enum('pending','preparing','ready','delivered','cancelled') NOT NULL DEFAULT 'pending',
	`customerName` varchar(180),
	`customerPhone` varchar(32),
	`notes` text,
	`paymentMethod` enum('cash','upi','card','other') NOT NULL DEFAULT 'cash',
	`paymentStatus` enum('unpaid','paid','refunded') NOT NULL DEFAULT 'unpaid',
	`subtotalPaise` int NOT NULL,
	`taxPaise` int NOT NULL DEFAULT 0,
	`discountPaise` int NOT NULL DEFAULT 0,
	`totalPaise` int NOT NULL,
	`placedAt` timestamp NOT NULL DEFAULT (now()),
	`deliveredAt` timestamp,
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderNumber_unique` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
CREATE TABLE `shifts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`startsAt` timestamp NOT NULL,
	`endsAt` timestamp NOT NULL,
	`status` enum('scheduled','completed','cancelled') NOT NULL DEFAULT 'scheduled',
	`note` text,
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shifts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `social_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`platform` enum('instagram','facebook','zomato','whatsapp') NOT NULL,
	`handle` varchar(180) NOT NULL,
	`url` text NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`updatedById` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `social_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `social_accounts_platform_unique` UNIQUE(`platform`)
);
--> statement-breakpoint
CREATE TABLE `social_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`socialAccountId` int,
	`platform` enum('instagram','facebook','zomato','whatsapp') NOT NULL,
	`title` varchar(240) NOT NULL,
	`caption` text NOT NULL,
	`status` enum('draft','scheduled','published') NOT NULL DEFAULT 'draft',
	`scheduledAt` timestamp,
	`publishedAt` timestamp,
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `social_posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stock_movements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inventoryItemId` int NOT NULL,
	`changeQuantity` int NOT NULL,
	`reason` enum('opening','restock','usage','adjustment','waste') NOT NULL,
	`note` text,
	`performedById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stock_movements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','staff') NOT NULL DEFAULT 'staff';--> statement-breakpoint
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_actorUserId_users_id_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_employeeId_employees_id_fk` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_settings` ADD CONSTRAINT `business_settings_updatedById_users_id_fk` FOREIGN KEY (`updatedById`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `employees_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_items` ADD CONSTRAINT `inventory_items_linkedMenuItemId_menu_items_id_fk` FOREIGN KEY (`linkedMenuItemId`) REFERENCES `menu_items`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_orderId_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_createdById_users_id_fk` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `menu_items` ADD CONSTRAINT `menu_items_categoryId_menu_categories_id_fk` FOREIGN KEY (`categoryId`) REFERENCES `menu_categories`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_orderId_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_menuItemId_menu_items_id_fk` FOREIGN KEY (`menuItemId`) REFERENCES `menu_items`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_createdById_users_id_fk` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shifts` ADD CONSTRAINT `shifts_employeeId_employees_id_fk` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shifts` ADD CONSTRAINT `shifts_createdById_users_id_fk` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `social_accounts` ADD CONSTRAINT `social_accounts_updatedById_users_id_fk` FOREIGN KEY (`updatedById`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `social_posts` ADD CONSTRAINT `social_posts_socialAccountId_social_accounts_id_fk` FOREIGN KEY (`socialAccountId`) REFERENCES `social_accounts`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `social_posts` ADD CONSTRAINT `social_posts_createdById_users_id_fk` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_inventoryItemId_inventory_items_id_fk` FOREIGN KEY (`inventoryItemId`) REFERENCES `inventory_items`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_performedById_users_id_fk` FOREIGN KEY (`performedById`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `activity_logs_employee_created_idx` ON `activity_logs` (`employeeId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `employees_active_idx` ON `employees` (`isActive`);--> statement-breakpoint
CREATE INDEX `inventory_menu_item_idx` ON `inventory_items` (`linkedMenuItemId`);--> statement-breakpoint
CREATE INDEX `invoices_issued_at_idx` ON `invoices` (`issuedAt`);--> statement-breakpoint
CREATE INDEX `menu_items_category_idx` ON `menu_items` (`categoryId`);--> statement-breakpoint
CREATE INDEX `order_items_order_idx` ON `order_items` (`orderId`);--> statement-breakpoint
CREATE INDEX `orders_status_placed_idx` ON `orders` (`status`,`placedAt`);--> statement-breakpoint
CREATE INDEX `orders_customer_phone_idx` ON `orders` (`customerPhone`);--> statement-breakpoint
CREATE INDEX `shifts_employee_start_idx` ON `shifts` (`employeeId`,`startsAt`);--> statement-breakpoint
CREATE INDEX `social_posts_status_scheduled_idx` ON `social_posts` (`status`,`scheduledAt`);--> statement-breakpoint
CREATE INDEX `stock_movements_item_created_idx` ON `stock_movements` (`inventoryItemId`,`createdAt`);