CREATE TABLE `TasteTS_account` (
	`userId` varchar(255) NOT NULL,
	`type` varchar(255) NOT NULL,
	`provider` varchar(255) NOT NULL,
	`providerAccountId` varchar(255) NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` int,
	`token_type` varchar(255),
	`scope` varchar(255),
	`id_token` text,
	`session_state` varchar(255),
	CONSTRAINT `TasteTS_account_provider_providerAccountId_pk` PRIMARY KEY(`provider`,`providerAccountId`)
);
--> statement-breakpoint
CREATE TABLE `TasteTS_post` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`name` varchar(256),
	`createdById` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `TasteTS_post_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `TasteTS_session` (
	`sessionToken` varchar(255) NOT NULL,
	`userId` varchar(255) NOT NULL,
	`expires` timestamp NOT NULL,
	CONSTRAINT `TasteTS_session_sessionToken` PRIMARY KEY(`sessionToken`)
);
--> statement-breakpoint
CREATE TABLE `TasteTS_user` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255),
	`email` varchar(255) NOT NULL,
	`emailVerified` timestamp(3) DEFAULT CURRENT_TIMESTAMP(3),
	`image` varchar(255),
	CONSTRAINT `TasteTS_user_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `TasteTS_verification_token` (
	`identifier` varchar(255) NOT NULL,
	`token` varchar(255) NOT NULL,
	`expires` timestamp NOT NULL,
	CONSTRAINT `TasteTS_verification_token_identifier_token_pk` PRIMARY KEY(`identifier`,`token`)
);
--> statement-breakpoint
ALTER TABLE `TasteTS_account` ADD CONSTRAINT `TasteTS_account_userId_TasteTS_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `TasteTS_user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `TasteTS_post` ADD CONSTRAINT `TasteTS_post_createdById_TasteTS_user_id_fk` FOREIGN KEY (`createdById`) REFERENCES `TasteTS_user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `TasteTS_session` ADD CONSTRAINT `TasteTS_session_userId_TasteTS_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `TasteTS_user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `account_user_id_idx` ON `TasteTS_account` (`userId`);--> statement-breakpoint
CREATE INDEX `created_by_idx` ON `TasteTS_post` (`createdById`);--> statement-breakpoint
CREATE INDEX `name_idx` ON `TasteTS_post` (`name`);--> statement-breakpoint
CREATE INDEX `session_user_id_idx` ON `TasteTS_session` (`userId`);