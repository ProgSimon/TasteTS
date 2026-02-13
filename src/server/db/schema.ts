import { relations, sql } from "drizzle-orm";
import { index, mysqlTableCreator, primaryKey, check, foreignKey } from "drizzle-orm/mysql-core";
import { type AdapterAccount } from "next-auth/adapters";
import enums from "./enums";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = mysqlTableCreator((name) => `TasteTS_${name}`);

/*
  * NOTE
  * MySQL limits identifiers to 64 characters.
  * drizzle-orm can generate foreign, and primary key names that exceed this limit.
  * 
  * The temporary fix is to provide custom key names for affected fk's, and pk's.
  * Such occurences are marked with "drizzle identifier fix" comment.
  * 
  * Issue can be revisited after migrating to drizzle v1.0
*/

export const tagsOnRecipe = createTable(
  "tagsOnRecipe",
  (d) => ({
    recipeId: d
      .bigint({ mode: "number" })
      .references(() => recipes.id),
    tagId: d
      .bigint({ mode: "number" })
      .references(() => tags.id),
  }), (table) => [
    primaryKey({ columns: [table.recipeId, table.tagId] }),
    index("tags_on_recipe_recipe_id_idx").on(table.recipeId),
    index("tags_on_recipe_tag_id_idx").on(table.tagId),
  ]
);

export const tagsOnRecipeRelations = relations(tagsOnRecipe, ({ one }) => ({
  recipe: one(recipes, { fields: [tagsOnRecipe.recipeId], references: [recipes.id] }),
  tag: one(tags, { fields: [tagsOnRecipe.tagId], references: [tags.id] }),
}));

export const tags = createTable(
  "tag",
  (d) => ({
    id: d.bigint({ mode: "number" }).primaryKey().autoincrement(),
    name: d.varchar({ length: 255 }).notNull(),
  })
);

export const tagsRelations = relations(tags, ({ many }) => ({
  recipes: many(tagsOnRecipe),
}));


export const userReviews = createTable(
  "userReview",
  (d) => ({
    userId: d
      .varchar({ length: 255 })
      .references(() => users.id),
    reviewerId: d
      .varchar({ length: 255 })
      .references(() => users.id),
    rating: d
      .tinyint()
      .notNull(),
    title: d.varchar({ length: 255 }),
    review: d.text(),
    createdAt: d
      .datetime()
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  }), (table) => [
    primaryKey({ columns: [table.userId, table.reviewerId]}),
    index("user_review_user_id_idx").on(table.userId),
    index("user_review_reviewer_id_idx").on(table.reviewerId),
    check("user_review_rating_check", sql`${table.rating} BETWEEN 1 AND 5`),
  ]
);

export const userReviewsRelations = relations(userReviews, ({ one }) => ({
  user: one(users, { fields: [userReviews.userId], references: [users.id], relationName: 'reviewedUser' }),
  reviewer: one(users, { fields: [userReviews.reviewerId], references: [users.id], relationName: 'reviewingUser' }),
}));

export const recipeReviews = createTable(
  "recipeReview",
  (d) => ({
    userId: d
      .varchar({ length: 255 })
      .references(() => users.id),
    recipeId: d
      .bigint({ mode: "number" })
      .references(() => recipes.id),
    rating: d
      .tinyint()
      .notNull(),
    title: d.varchar({ length: 255 }),
    review: d.text(),
    createdAt: d
      .datetime()
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  }), (table) => [
    primaryKey({ columns: [table.userId, table.recipeId]}),
    index("review_user_id_idx").on(table.userId),
    index("review_recipe_id_idx").on(table.recipeId),
    check("rating_check", sql`${table.rating} BETWEEN 1 AND 5`),
  ]
);

export const reviewsRelations = relations(recipeReviews, ({ one }) => ({
  user: one(users, { fields: [recipeReviews.userId], references: [users.id] }),
  recipe: one(recipes, { fields: [recipeReviews.recipeId], references: [recipes.id] }),
}));

export const excludantOnRecipe = createTable(
  "excludantOnRecipe",
  (d) => ({
    recipeId: d
      .bigint({ mode: "number"})
      .references(() => recipes.id),
    excludantId: d
      .smallint()
      .references(() => excludants.id),
    ingredientId: d
      .mediumint()
      .references(() => ingredients.id),
  }), (table) => [
    primaryKey({ columns: [table.recipeId, table.excludantId, table.ingredientId] }),
    index("excludant_on_recipe_recipe_id_idx").on(table.recipeId),
    index("excludant_on_recipe_excludant_id_idx").on(table.excludantId),
    index("excludant_on_recipe_ingredient_id_idx").on(table.ingredientId),
  ]
);

export const excludantOnRecipeRelations = relations(excludantOnRecipe, ({ one }) => ({
  recipe: one(recipes, { fields: [excludantOnRecipe.recipeId], references: [recipes.id] }),
  excludant: one(excludants, { fields: [excludantOnRecipe.excludantId], references: [excludants.id] }),
  ingredient: one(ingredients, { fields: [excludantOnRecipe.ingredientId], references: [ingredients.id] }),
}));

export const excludantOnIngredient = createTable(
  "excludantOnIngredient",
  (d) => ({
    excludantId: d
      .smallint(),
    ingredientId: d
      .mediumint(),
    alternativeId: d
      .mediumint(),
  }), (table) => [
    primaryKey({ columns: [table.excludantId, table.ingredientId, table.alternativeId], name: "excludant_on_ingredient_pk"}), // drizzle identifier fix
    foreignKey({ // drizzle identifier fix
      columns: [table.excludantId],
      foreignColumns: [excludants.id],
      name: "excludant_on_ingredient_excludant_id_fk",
    }),
    foreignKey({ // drizzle identifier fix
      columns: [table.ingredientId],
      foreignColumns: [ingredients.id],
      name: "excludant_on_ingredient_ingredient_id_fk",
    }),
    foreignKey({ // drizzle identifier fix
      columns: [table.alternativeId],
      foreignColumns: [ingredients.id],
      name: "excludant_on_ingredient_alternative_id_fk",
    }),
    index("excludant_on_ingredient_excludant_id_idx").on(table.excludantId),
    index("excludant_on_ingredient_ingredient_id_idx").on(table.ingredientId),
    index("excludant_on_ingredient_alternative_id_idx").on(table.alternativeId),
  ]
);

export const excludantOnIngredientRelations = relations(excludantOnIngredient, ({ one }) => ({
  excludant: one(excludants, { fields: [excludantOnIngredient.excludantId], references: [excludants.id] }),
  ingredient: one(ingredients, { fields: [excludantOnIngredient.ingredientId], references: [ingredients.id], relationName: 'excludedIngredient' }),
  alternative: one(ingredients, { fields: [excludantOnIngredient.alternativeId], references: [ingredients.id], relationName: 'alternativeIngredient' }),
}));

export const excludants = createTable(
  "excludant",
  (d) => ({
    id: d.smallint().primaryKey().autoincrement(),
    namePL: d.varchar({ length: 255 }).notNull(),
    nameEN: d.varchar({ length: 255 }).notNull()
    })
);

export const excludantsRelations = relations(excludants, ({ many }) => ({
  excludantsOnRecipes: many(excludantOnRecipe),
  excludantsOnIngredients: many(excludantOnIngredient),
}));

export const alternativeOnRecipe = createTable(
  "alternativeOnRecipe",
  (d) => ({
    recipeId: d
      .bigint({ mode: "number"}),
    ingredientId: d
      .mediumint(),
    alternativeToId: d
      .mediumint(),
    amount: d
      .int()
      .notNull(),
    unit: d
      .mysqlEnum(enums.units as [string, ...string[]])
      .notNull(),
  }), (table) => [
    primaryKey({ columns: [table.recipeId, table.ingredientId, table.alternativeToId], name: "alternative_on_recipe_pk"}), // drizzle identifier fix
    foreignKey({ // drizzle identifier fix
      columns: [table.recipeId],
      foreignColumns: [recipes.id],
      name: "alternative_on_recipe_recipe_id_fk",
    }),
    foreignKey({ // drizzle identifier fix
      columns: [table.ingredientId],
      foreignColumns: [ingredients.id],
      name: "alternative_on_recipe_ingredient_id_fk",
    }),
    foreignKey({ // drizzle identifier fix
      columns: [table.alternativeToId],
      foreignColumns: [ingredients.id],
      name: "alternative_on_recipe_alternative_to_id_fk",
    }),
    index("alternative_on_recipe_recipe_id_idx").on(table.recipeId),
    index("alternative_on_recipe_ingredient_id_idx").on(table.ingredientId),
    index("alternative_on_recipe_alternative_to_id_idx").on(table.alternativeToId),
  ]
);

export const alternativeOnRecipeRelations = relations(alternativeOnRecipe, ({ one }) => ({
  recipe: one(recipes, { fields: [alternativeOnRecipe.recipeId], references: [recipes.id] }),
  ingredient: one(ingredients, { fields: [alternativeOnRecipe.ingredientId], references: [ingredients.id], relationName: 'ingredient'}),
  alternativeTo: one(ingredients, { fields: [alternativeOnRecipe.alternativeToId], references: [ingredients.id], relationName: 'alternativeTo' }),
}));

export const ingredientOnRecipe = createTable(
  "ingredientOnRecipe",
  (d) => ({
    recipeId: d
      .bigint({ mode: "number"})
      .references(() => recipes.id),
    ingredientId: d
      .mediumint()
      .references(() => ingredients.id),
    amount: d
      .int()
      .notNull(),
    unit: d
      .mysqlEnum(enums.units as [string, ...string[]])
      .notNull(),
    alternative: d
      .boolean()
      .notNull()
  }), (table) => [
    primaryKey({ columns: [table.recipeId, table.ingredientId]}),
    index("ingredient_on_recipe_recipe_id_idx").on(table.recipeId),
    index("ingredient_on_recipe_ingredient_id_idx").on(table.ingredientId),
  ]
);

export const ingredientOnRecipeRelations = relations(ingredientOnRecipe, ({ one, many }) => ({
  recipe: one(recipes, { fields: [ingredientOnRecipe.recipeId], references: [recipes.id] }),
  ingredient: one(ingredients, { fields: [ingredientOnRecipe.ingredientId], references: [ingredients.id] }),
}));

export const ingredients = createTable(
  "ingredient",
  (d) => ({
    id: d.mediumint().primaryKey().autoincrement(),
    namePL: d.varchar({ length: 255 }).notNull(),
    nameEN: d.varchar({ length: 255 }).notNull()
  })
);

export const ingredientsRelations = relations(ingredients, ({ many }) => ({
  ingredientsOnRecipes: many(ingredientOnRecipe),
  alternativeOnRecipe: many(alternativeOnRecipe, { relationName: 'ingredient'}),
  alternativeTo: many(alternativeOnRecipe, { relationName: 'alternativeTo'}),
  excludedIngredient: many(excludantOnIngredient, { relationName: 'excludedIngredient'}),
  alternativeOnExcludant: many(excludantOnIngredient, { relationName: 'alternativeIngredient'}),
  excludantOnRecipe: many(excludantOnRecipe),
}));


export const additionalIngredientsLists = createTable(
  "additionalIngredientsList",
  (d) => ({
    recipeId: d
      .bigint({ mode: "number"})
      .references(() => recipes.id),
    language: d
      .mysqlEnum(enums.languages as [string, ...string[]])
      .default("english"),
    ingredients: d.json(),
  }), (table) => [
    primaryKey({ columns: [table.recipeId, table.language]}),
    index("additional_ingredients_list_recipe_id_idx").on(table.recipeId)
  ]
)

export const additionalIngredientsListsRelations = relations(additionalIngredientsLists, ({ one }) => ({
  recipe: one(recipes, { fields: [additionalIngredientsLists.recipeId], references: [recipes.id] }),
}));

export const recipeContents = createTable(
  "recipeContent",
  (d) => ({
    recipeId: d
      .bigint({ mode: "number"})
      .references(() => recipes.id),
    language: d
      .mysqlEnum(enums.languages as [string, ...string[]])
      .default("english"),
    recipeName: d
      .varchar({ length: 255 })
      .notNull(),
    ingredientNotes: d.text(),
    recipeContent: d
      .text()
      .notNull(),
    status: d
      .mysqlEnum(enums.statuses as [string, ...string[]])
      .default("private")
      .notNull(),
  }), (table) => [
    primaryKey({ columns: [table.recipeId, table.language]}),
    index("recipe_content_recipe_id_idx").on(table.recipeId)
  ]
)

export const recipeContentsRelations = relations(recipeContents, ({ one }) => ({
  recipe: one(recipes, { fields: [recipeContents.recipeId], references: [recipes.id] }),
}));

export const recipes = createTable(
  "recipe",
  (d) => ({
    id: d.bigint({ mode: "number" }).primaryKey().autoincrement(),
    status: d
      .mysqlEnum(enums.statuses as [string, ...string[]])
      .notNull()
      .default("private"),
    createdAt: d
      .datetime()
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    creatorId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id)
  }),
  (table) => [index("recipe_creator_id_idx").on(table.creatorId)],
);

export const recipesRelations = relations(recipes, ({ one, many }) => ({
  creator: one(users, { fields: [recipes.creatorId], references: [users.id] }),
  contents: many(recipeContents),
  additionalIngredientsList: many(additionalIngredientsLists),
  ingredientsOnRecipes: many(ingredientOnRecipe),
  excludantsOnRecipes: many(excludantOnRecipe),
  reviews: many(recipeReviews),
  alternativeOnRecipe: many(alternativeOnRecipe),
  tags: many(tagsOnRecipe),
}));


export const users = createTable("user", (d) => ({
  id: d
    .varchar({ length: 255 })
    .notNull()
    .primaryKey()
  
    .$defaultFn(() => crypto.randomUUID()),
  name: d.varchar({ length: 255 }),
  email: d.varchar({ length: 255 }).notNull(),
  emailVerified: d

    .timestamp({
      mode: "date",
      fsp: 3,
    })
    .default(sql`CURRENT_TIMESTAMP(3)`),
  image: d.varchar({ length: 255 }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  recipes: many(recipes),
  reviews: many(recipeReviews),
  userReviews: many(userReviews, { relationName: 'reviewedUser' }),
  reviewsWritten: many(userReviews, { relationName: 'reviewingUser' }),
}));

export const accounts = createTable(
  "account",
  (d) => ({
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    type: d.varchar({ length: 255 }).$type<AdapterAccount["type"]>().notNull(),
    provider: d.varchar({ length: 255 }).notNull(),
    providerAccountId: d.varchar({ length: 255 }).notNull(),
    refresh_token: d.text(),
    access_token: d.text(),
    expires_at: d.int(),
    token_type: d.varchar({ length: 255 }),
    scope: d.varchar({ length: 255 }),
    id_token: d.text(),
    session_state: d.varchar({ length: 255 }),
  }),
  (t) => [
    primaryKey({
      columns: [t.provider, t.providerAccountId],
    }),
    index("account_user_id_idx").on(t.userId),
  ],
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
  "session",
  (d) => ({
    sessionToken: d.varchar({ length: 255 }).notNull().primaryKey(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    expires: d.timestamp({ mode: "date" }).notNull(),
  }),
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
  "verification_token",
  (d) => ({
    identifier: d.varchar({ length: 255 }).notNull(),
    token: d.varchar({ length: 255 }).notNull(),
    expires: d.timestamp({ mode: "date" }).notNull(),
  }),
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);
