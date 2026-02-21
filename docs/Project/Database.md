# Project TasteTS - Database Overview

## Design Approach

The database was designed using Drizzle ORM with MySQL.
Initial planning was done in dbdiagram.io.

Key design goals:
 - Support for multilingual recipes
 - Efficient filtering ( tags & excludants )
 - Future extensibility
 - Structured and normalized ingredient entity

## Enums
The system has three enums for consistency:
- languages - polish, english
- statuses - public, private
- units - none, ml, pcs, tsp, tblsp

## Main Entities

1. **Users**  
   Uses default NextAuth tables.

2. **Recipes**  
   Stores the core of the recipe.  
   Fields:
   - id
   - creatorId (FK -> Users) 
   - status (enum **statuses**)
   - createdAt

3. **RecipeContents**  
   Composite PK: (recipeId, language)  
   Fields:
   - recipeId
   - language (enum **languages**)
   - recipeName
   - ingredientNotes
   - recipeContent
   - status (enum **statuses**)
   
   Separate Recipe and RecipeContents entity allows:
   - multiple language versions per recipe
   - independent status of the recipe per language

4. **Ingredients**  
   Fields:
   - id
   - nameEN
   - namePL
   
   Normalized ingredient storage enables:
   - Search consistency
   - Exclusion filtering
   - Alternatives system
   - Automatic translation of ingredient names

5. **Tags**  
   User-created classification for recipes.  
   Fields:
   - id
   - name

   Used for recipe filtering and searching.

6. **RecipeReviews**  
   Composite Primary Key: (userId, recipeId)  
   Fields:
   - userId
   - recipeId
   - rating (1-5, db-level constraint)
   - title
   - review

7. **UserReviews**  
   Composite Primary Key: (userId, reviewerId)  
   Fields:
   - userId
   - reviewerId
   - rating (1-5, db-level constraint)
   - title
   - review

## Excludants
The system supports filtering recipes by dietary restrictions (e.g. gluten, dairy, meat)

1. **Excludants**  
   Fields:
   - id
   - nameEN
   - namePL

   Connected to:
   - ingredients
   - recipes (if no alternative is chosen, or doesn't exist)

2. **Alternatives**  
   The schema supports ingredient substitutions.  
   Example:  
   **Milk excludants -> lactose, dairy**  
   Alternatives:  
   - Lactose-free milk -> no lactose, but still dairy  
   - Oat milk -> no lactose and dairy

   User controls alternative selection.
   Excludants are linked directly to recipes for performance uplift.

## Many-to-many Relations   
These include:
- IngredientOnRecipe
- AlternativeOnRecipe
- ExcludantOnIngredient
- ExcludantOnRecipe
- TagOnRecipe

They maintain normalization, and contain all important information for full control over filtering, and substitutions.

## Temporary Ingredient Storage  
**AdditionalIngredientsLists**  
Temporary storage for user-provided ingredients in JSON format.
Used if an ingredient is not present in the ingredients table.

When an appropriate ingredient is added, the user may change it manually.
After implementation of user roles, the admin will be able to promote these ingredients without any input from the original user.

## Notes 
- Drizzle may generate identifier names longer than MySQL 64-character limit. This required custom FK names in some cases.
- Refactor planned after Drizzle v1.0 release