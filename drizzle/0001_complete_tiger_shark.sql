CREATE TABLE `TasteTS_additionalIngredientsList` (
	`recipeId` bigint NOT NULL,
	`language` enum('polish','english') NOT NULL DEFAULT 'english',
	`ingredients` json,
	CONSTRAINT `TasteTS_additionalIngredientsList_recipeId_language_pk` PRIMARY KEY(`recipeId`,`language`)
);
--> statement-breakpoint
CREATE TABLE `TasteTS_alternativeOnRecipe` (
	`recipeId` bigint NOT NULL,
	`ingredientId` mediumint NOT NULL,
	`alternativeToId` mediumint NOT NULL,
	`amount` int NOT NULL,
	`unit` enum('none','ml','g','pcs','tsp','tblsp') NOT NULL,
	CONSTRAINT `alternative_on_recipe_pk` PRIMARY KEY(`recipeId`,`ingredientId`,`alternativeToId`)
);
--> statement-breakpoint
CREATE TABLE `TasteTS_excludantOnIngredient` (
	`excludantId` smallint NOT NULL,
	`ingredientId` mediumint NOT NULL,
	`alternativeId` mediumint NOT NULL,
	CONSTRAINT `excludant_on_ingredient_pk` PRIMARY KEY(`excludantId`,`ingredientId`,`alternativeId`)
);
--> statement-breakpoint
CREATE TABLE `TasteTS_excludantOnRecipe` (
	`recipeId` bigint NOT NULL,
	`excludantId` smallint NOT NULL,
	`ingredientId` mediumint NOT NULL,
	CONSTRAINT `TasteTS_excludantOnRecipe_recipeId_excludantId_ingredientId_pk` PRIMARY KEY(`recipeId`,`excludantId`,`ingredientId`)
);
--> statement-breakpoint
CREATE TABLE `TasteTS_excludant` (
	`id` smallint AUTO_INCREMENT NOT NULL,
	`namePL` varchar(255) NOT NULL,
	`nameEN` varchar(255) NOT NULL,
	CONSTRAINT `TasteTS_excludant_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `TasteTS_ingredientOnRecipe` (
	`recipeId` bigint NOT NULL,
	`ingredientId` mediumint NOT NULL,
	`amount` int NOT NULL,
	`unit` enum('none','ml','g','pcs','tsp','tblsp') NOT NULL,
	`alternative` boolean NOT NULL,
	CONSTRAINT `TasteTS_ingredientOnRecipe_recipeId_ingredientId_pk` PRIMARY KEY(`recipeId`,`ingredientId`)
);
--> statement-breakpoint
CREATE TABLE `TasteTS_ingredient` (
	`id` mediumint AUTO_INCREMENT NOT NULL,
	`namePL` varchar(255) NOT NULL,
	`nameEN` varchar(255) NOT NULL,
	CONSTRAINT `TasteTS_ingredient_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `TasteTS_recipeContent` (
	`recipeId` bigint NOT NULL,
	`language` enum('polish','english') NOT NULL DEFAULT 'english',
	`recipeName` varchar(255) NOT NULL,
	`ingredientNotes` text,
	`recipeContent` text NOT NULL,
	`status` enum('public','private') NOT NULL DEFAULT 'private',
	CONSTRAINT `TasteTS_recipeContent_recipeId_language_pk` PRIMARY KEY(`recipeId`,`language`)
);
--> statement-breakpoint
CREATE TABLE `TasteTS_recipe` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`status` enum('public','private') NOT NULL DEFAULT 'private',
	`createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`creatorId` varchar(255) NOT NULL,
	CONSTRAINT `TasteTS_recipe_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `TasteTS_review` (
	`userId` varchar(255) NOT NULL,
	`recipeId` bigint NOT NULL,
	`rating` tinyint NOT NULL,
	`title` varchar(255),
	`review` text,
	`createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `TasteTS_review_userId_recipeId_pk` PRIMARY KEY(`userId`,`recipeId`),
	CONSTRAINT `rating_check` CHECK(`TasteTS_review`.`rating` BETWEEN 1 AND 5)
);
--> statement-breakpoint
DROP TABLE `TasteTS_post`;--> statement-breakpoint
ALTER TABLE `TasteTS_additionalIngredientsList` ADD CONSTRAINT `TasteTS_additionalIngredientsList_recipeId_TasteTS_recipe_id_fk` FOREIGN KEY (`recipeId`) REFERENCES `TasteTS_recipe`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `TasteTS_alternativeOnRecipe` ADD CONSTRAINT `alternative_on_recipe_recipe_id_fk` FOREIGN KEY (`recipeId`) REFERENCES `TasteTS_recipe`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `TasteTS_alternativeOnRecipe` ADD CONSTRAINT `alternative_on_recipe_ingredient_id_fk` FOREIGN KEY (`ingredientId`) REFERENCES `TasteTS_ingredient`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `TasteTS_alternativeOnRecipe` ADD CONSTRAINT `alternative_on_recipe_alternative_to_id_fk` FOREIGN KEY (`alternativeToId`) REFERENCES `TasteTS_ingredient`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `TasteTS_excludantOnIngredient` ADD CONSTRAINT `excludant_on_ingredient_excludant_id_fk` FOREIGN KEY (`excludantId`) REFERENCES `TasteTS_excludant`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `TasteTS_excludantOnIngredient` ADD CONSTRAINT `excludant_on_ingredient_ingredient_id_fk` FOREIGN KEY (`ingredientId`) REFERENCES `TasteTS_ingredient`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `TasteTS_excludantOnIngredient` ADD CONSTRAINT `excludant_on_ingredient_alternative_id_fk` FOREIGN KEY (`alternativeId`) REFERENCES `TasteTS_ingredient`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `TasteTS_excludantOnRecipe` ADD CONSTRAINT `TasteTS_excludantOnRecipe_recipeId_TasteTS_recipe_id_fk` FOREIGN KEY (`recipeId`) REFERENCES `TasteTS_recipe`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `TasteTS_excludantOnRecipe` ADD CONSTRAINT `TasteTS_excludantOnRecipe_excludantId_TasteTS_excludant_id_fk` FOREIGN KEY (`excludantId`) REFERENCES `TasteTS_excludant`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `TasteTS_excludantOnRecipe` ADD CONSTRAINT `TasteTS_excludantOnRecipe_ingredientId_TasteTS_ingredient_id_fk` FOREIGN KEY (`ingredientId`) REFERENCES `TasteTS_ingredient`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `TasteTS_ingredientOnRecipe` ADD CONSTRAINT `TasteTS_ingredientOnRecipe_recipeId_TasteTS_recipe_id_fk` FOREIGN KEY (`recipeId`) REFERENCES `TasteTS_recipe`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `TasteTS_ingredientOnRecipe` ADD CONSTRAINT `TasteTS_ingredientOnRecipe_ingredientId_TasteTS_ingredient_id_fk` FOREIGN KEY (`ingredientId`) REFERENCES `TasteTS_ingredient`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `TasteTS_recipeContent` ADD CONSTRAINT `TasteTS_recipeContent_recipeId_TasteTS_recipe_id_fk` FOREIGN KEY (`recipeId`) REFERENCES `TasteTS_recipe`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `TasteTS_recipe` ADD CONSTRAINT `TasteTS_recipe_creatorId_TasteTS_user_id_fk` FOREIGN KEY (`creatorId`) REFERENCES `TasteTS_user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `TasteTS_review` ADD CONSTRAINT `TasteTS_review_userId_TasteTS_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `TasteTS_user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `TasteTS_review` ADD CONSTRAINT `TasteTS_review_recipeId_TasteTS_recipe_id_fk` FOREIGN KEY (`recipeId`) REFERENCES `TasteTS_recipe`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `additional_ingredients_list_recipe_id_idx` ON `TasteTS_additionalIngredientsList` (`recipeId`);--> statement-breakpoint
CREATE INDEX `alternative_on_recipe_recipe_id_idx` ON `TasteTS_alternativeOnRecipe` (`recipeId`);--> statement-breakpoint
CREATE INDEX `alternative_on_recipe_ingredient_id_idx` ON `TasteTS_alternativeOnRecipe` (`ingredientId`);--> statement-breakpoint
CREATE INDEX `alternative_on_recipe_alternative_to_id_idx` ON `TasteTS_alternativeOnRecipe` (`alternativeToId`);--> statement-breakpoint
CREATE INDEX `excludant_on_ingredient_excludant_id_idx` ON `TasteTS_excludantOnIngredient` (`excludantId`);--> statement-breakpoint
CREATE INDEX `excludant_on_ingredient_ingredient_id_idx` ON `TasteTS_excludantOnIngredient` (`ingredientId`);--> statement-breakpoint
CREATE INDEX `excludant_on_ingredient_alternative_id_idx` ON `TasteTS_excludantOnIngredient` (`alternativeId`);--> statement-breakpoint
CREATE INDEX `excludant_on_recipe_recipe_id_idx` ON `TasteTS_excludantOnRecipe` (`recipeId`);--> statement-breakpoint
CREATE INDEX `excludant_on_recipe_excludant_id_idx` ON `TasteTS_excludantOnRecipe` (`excludantId`);--> statement-breakpoint
CREATE INDEX `excludant_on_recipe_ingredient_id_idx` ON `TasteTS_excludantOnRecipe` (`ingredientId`);--> statement-breakpoint
CREATE INDEX `ingredient_on_recipe_recipe_id_idx` ON `TasteTS_ingredientOnRecipe` (`recipeId`);--> statement-breakpoint
CREATE INDEX `ingredient_on_recipe_ingredient_id_idx` ON `TasteTS_ingredientOnRecipe` (`ingredientId`);--> statement-breakpoint
CREATE INDEX `recipe_content_recipe_id_idx` ON `TasteTS_recipeContent` (`recipeId`);--> statement-breakpoint
CREATE INDEX `recipe_creator_id_idx` ON `TasteTS_recipe` (`creatorId`);--> statement-breakpoint
CREATE INDEX `review_user_id_idx` ON `TasteTS_review` (`userId`);--> statement-breakpoint
CREATE INDEX `review_recipe_id_idx` ON `TasteTS_review` (`recipeId`);