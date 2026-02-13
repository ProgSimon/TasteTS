CREATE TABLE `TasteTS_tag` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	CONSTRAINT `TasteTS_tag_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `TasteTS_tagsOnRecipe` (
	`recipeId` bigint NOT NULL,
	`tagId` bigint NOT NULL,
	CONSTRAINT `TasteTS_tagsOnRecipe_recipeId_tagId_pk` PRIMARY KEY(`recipeId`,`tagId`)
);
--> statement-breakpoint
CREATE TABLE `TasteTS_userReview` (
	`userId` varchar(255) NOT NULL,
	`reviewerId` varchar(255) NOT NULL,
	`rating` tinyint NOT NULL,
	`title` varchar(255),
	`review` text,
	`createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `TasteTS_userReview_userId_reviewerId_pk` PRIMARY KEY(`userId`,`reviewerId`),
	CONSTRAINT `user_review_rating_check` CHECK(`TasteTS_userReview`.`rating` BETWEEN 1 AND 5)
);
--> statement-breakpoint
RENAME TABLE `TasteTS_review` TO `TasteTS_recipeReview`;--> statement-breakpoint
ALTER TABLE `TasteTS_recipeReview` DROP CONSTRAINT `rating_check`;--> statement-breakpoint
ALTER TABLE `TasteTS_recipeReview` DROP FOREIGN KEY `TasteTS_review_userId_TasteTS_user_id_fk`;
--> statement-breakpoint
ALTER TABLE `TasteTS_recipeReview` DROP FOREIGN KEY `TasteTS_review_recipeId_TasteTS_recipe_id_fk`;
--> statement-breakpoint
ALTER TABLE `TasteTS_recipeReview` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `TasteTS_recipeReview` ADD PRIMARY KEY(`userId`,`recipeId`);--> statement-breakpoint
ALTER TABLE `TasteTS_tagsOnRecipe` ADD CONSTRAINT `TasteTS_tagsOnRecipe_recipeId_TasteTS_recipe_id_fk` FOREIGN KEY (`recipeId`) REFERENCES `TasteTS_recipe`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `TasteTS_tagsOnRecipe` ADD CONSTRAINT `TasteTS_tagsOnRecipe_tagId_TasteTS_tag_id_fk` FOREIGN KEY (`tagId`) REFERENCES `TasteTS_tag`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `TasteTS_userReview` ADD CONSTRAINT `TasteTS_userReview_userId_TasteTS_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `TasteTS_user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `TasteTS_userReview` ADD CONSTRAINT `TasteTS_userReview_reviewerId_TasteTS_user_id_fk` FOREIGN KEY (`reviewerId`) REFERENCES `TasteTS_user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `tags_on_recipe_recipe_id_idx` ON `TasteTS_tagsOnRecipe` (`recipeId`);--> statement-breakpoint
CREATE INDEX `tags_on_recipe_tag_id_idx` ON `TasteTS_tagsOnRecipe` (`tagId`);--> statement-breakpoint
CREATE INDEX `user_review_user_id_idx` ON `TasteTS_userReview` (`userId`);--> statement-breakpoint
CREATE INDEX `user_review_reviewer_id_idx` ON `TasteTS_userReview` (`reviewerId`);--> statement-breakpoint
ALTER TABLE `TasteTS_recipeReview` ADD CONSTRAINT `rating_check` CHECK (`TasteTS_recipeReview`.`rating` BETWEEN 1 AND 5);--> statement-breakpoint
ALTER TABLE `TasteTS_recipeReview` ADD CONSTRAINT `TasteTS_recipeReview_userId_TasteTS_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `TasteTS_user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `TasteTS_recipeReview` ADD CONSTRAINT `TasteTS_recipeReview_recipeId_TasteTS_recipe_id_fk` FOREIGN KEY (`recipeId`) REFERENCES `TasteTS_recipe`(`id`) ON DELETE no action ON UPDATE no action;