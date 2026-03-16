import { eq, and, notExists, aliasedTable } from "drizzle-orm";
import { db } from "~/server/db";
import { excludantOnIngredient, ingredientOnRecipe, alternativeOnRecipe, excludantOnRecipe } from "~/server/db/schema";

type DB = typeof db;

export async function recalculateExcludants(recipeId: number, db: DB) {
    await db.transaction(async tx => {

        // delete old excludants
        await tx.delete(excludantOnRecipe)
            .where(eq(excludantOnRecipe.recipeId, recipeId))

        const excludantOnAlternative = aliasedTable(excludantOnIngredient, "excludantOnAlternative")

        const newExcludants = await tx.select({ //select new excludantOnRecipe entries
            recipeId: ingredientOnRecipe.recipeId,
            ingredientId: ingredientOnRecipe.ingredientId,
            excludantId: excludantOnIngredient.excludantId
        })
            .from(ingredientOnRecipe)
            .innerJoin(
                excludantOnIngredient, 
                eq(excludantOnIngredient.ingredientId, ingredientOnRecipe.ingredientId)
            )
            .where(and(
                eq(ingredientOnRecipe.recipeId, recipeId),

                // add excludant if no alternative lacking this excludant is present
                notExists(
                    tx.select()
                        .from(alternativeOnRecipe)
                        .where(and(
                            eq(alternativeOnRecipe.recipeId, ingredientOnRecipe.recipeId),
                            eq(alternativeOnRecipe.alternativeToId, ingredientOnRecipe.ingredientId),
                            notExists(
                                tx.select()
                                    .from(excludantOnAlternative)
                                    .where(and(
                                        eq(excludantOnAlternative.ingredientId, alternativeOnRecipe.ingredientId),
                                        eq(excludantOnAlternative.excludantId, excludantOnIngredient.excludantId)
                                    ))
                            )
                        ))
                )
            ))

            if(newExcludants.length) {
                await tx.insert(excludantOnRecipe).values(newExcludants)
            }
    })
}