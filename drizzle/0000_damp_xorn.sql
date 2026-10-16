CREATE TABLE `listings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`crop` text NOT NULL,
	`quantity_kg` real NOT NULL,
	`price_per_kg` real NOT NULL,
	`location` text NOT NULL,
	`farmer_name` text NOT NULL,
	`fulfilment` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
