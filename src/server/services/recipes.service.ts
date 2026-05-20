import { db } from "~/server/db";
import { TRPCError } from "@trpc/server";
import { and, eq, or, ne } from "drizzle-orm";
import { recipeContents, recipes } from "../db/schema";

type DB = typeof db;

export async function validateRecipeOwnership(recipeId: number, userId: string, db: DB) {
    
    const recipe = await db.query.recipes.findFirst({
        where: and(
            eq(recipes.id, recipeId),
            eq(recipes.creatorId, userId)
        )
    })

    if(!recipe) {
        throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have permission to edit this recipe."
        })
    }
}

export async function validateRecipeVariantExistence(recipeId: number, language: string, db: DB) {
    const recipeVersion = await db.query.recipeContents.findFirst({
        where: and(
            eq(recipeContents.recipeId, recipeId),
            eq(recipeContents.language, language)
        )
    })

    if(!recipeVersion) {
        throw new TRPCError({
            code: "NOT_FOUND",
            message: "Recipe not found for the specified language."
        })
    }
}

export async function validateRecipePublicStatus(recipeIds: {recipeId: number, recipeLanguage: string}[], userId: string, db: DB) {
    const queryRecipes = recipeIds.map(
        e => and(
                eq(recipeContents.recipeId, e.recipeId),
                eq(recipeContents.language, e.recipeLanguage)
            ))
    
    const forbiddenInQuery = await db.select({recipeId: recipeContents.recipeId})
            .from(recipeContents)
            .innerJoin(recipes, eq(recipeContents.recipeId, recipes.id))
            .where(and(
                or(...queryRecipes),
                and(
                    ne(recipes.creatorId, userId),
                    or(
                        ne(recipeContents.status, "public"),
                        ne(recipes.status, "public"),
                    
                ))))
            .limit(1)
    
    if(forbiddenInQuery.length) {
        throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have permission to access this recipe."
        })
    }
}

