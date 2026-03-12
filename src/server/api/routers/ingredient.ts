import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure
} from "~/server/api/trpc";
import { z } from "zod";
import { validateRecipeOwnership } from "~/server/services/recipes.service";
import { eq, and, or, like } from "drizzle-orm";
import { alternativeOnRecipe, excludantOnIngredient, excludantOnRecipe, ingredientOnRecipe, ingredients, tags, tagsOnRecipe } from "~/server/db/schema";
import enums from "~/server/db/enums";
import { get } from "http";

export const ingredientRouter = createTRPCRouter({
    add: protectedProcedure
    .input(z.object({ recipeId: z.number(), ingredientId: z.number(), amount: z.number(), unit: z.enum(enums.units as [string, ...string[]]) }))
    .mutation(async ({ ctx, input }) => {
        await validateRecipeOwnership(input.recipeId, ctx.session.user.id, ctx.db);
        return await ctx.db.transaction(async tx => {
            await tx.insert(ingredientOnRecipe).values({
                recipeId: input.recipeId,
                ingredientId: input.ingredientId,
                amount: input.amount,
                unit: input.unit,
                alternative: false
            })

            const excludantList = await tx.query.excludantOnIngredient.findMany({
                columns: {
                    excludantId: true
                },
                where: eq(excludantOnIngredient.ingredientId, input.ingredientId)
            }) 

            if (excludantList.length > 0) {
                await tx.insert(excludantOnRecipe).values(
                    excludantList.map(e => ({ 
                        recipeId: input.recipeId, 
                        ingredientId: input.ingredientId, 
                        excludantId: e.excludantId 
                })) // add excludants based on the ingredient added
            )}
        })
    }),
    remove: protectedProcedure
    .input(z.object({ recipeId: z.number(), ingredientId: z.number() }))
    .mutation(async ({ ctx, input }) => {
        await validateRecipeOwnership(input.recipeId, ctx.session.user.id, ctx.db)
        return await ctx.db.transaction(async tx => {
            tx.delete(ingredientOnRecipe)
                .where(and(
                    eq(ingredientOnRecipe.recipeId, input.recipeId),
                    eq(ingredientOnRecipe.ingredientId, input.ingredientId)
                ))
            
            tx.delete(alternativeOnRecipe)
                .where(and(
                    eq(alternativeOnRecipe.recipeId, input.recipeId),
                    eq(alternativeOnRecipe.alternativeToId, input.ingredientId)
                ))
            // delete all alternatives, and excludants connected with that ingredient
            tx.delete(excludantOnRecipe)
                .where(and(
                    eq(excludantOnRecipe.recipeId, input.recipeId),
                    eq(excludantOnRecipe.ingredientId, input.ingredientId)
                ))
        })
    }),
    setAmount: protectedProcedure
    .input(z.object({ recipeId: z.number(), ingredientId: z.number(), amount: z.number() }))
    .mutation(async ({ ctx, input }) => {
        await validateRecipeOwnership(input.recipeId, ctx.session.user.id, ctx.db)
        return await ctx.db.transaction(async tx => {
            tx.update(ingredientOnRecipe).set({
                amount: input.amount
            }).where(and(
                eq(ingredientOnRecipe.recipeId, input.recipeId),
                eq(ingredientOnRecipe.ingredientId, input.ingredientId)
            ))
        })
    }),
    setUnit: protectedProcedure
    .input(z.object({ recipeId: z.number(), ingredientId: z.number(), unit: z.enum(enums.units as [string, ...string[]]) }))
    .mutation(async ({ ctx, input }) => {
        await validateRecipeOwnership(input.recipeId, ctx.session.user.id, ctx.db)
        return await ctx.db.transaction(async tx => {
            tx.update(ingredientOnRecipe).set({
                unit: input.unit
            }).where(and(
                eq(ingredientOnRecipe.recipeId, input.recipeId),
                eq(ingredientOnRecipe.ingredientId, input.ingredientId)
            ))
        })
    }),
    getForRecipe: publicProcedure
    .input(z.object({ recipeId: z.number()}))
    .query(async ({ ctx, input}) => {
        return await ctx.db.query.ingredientOnRecipe.findMany({
            columns: {
                ingredientId: true
            },
            with: {
                ingredient: {
                    columns: {
                        nameEN: true,
                        namePL: true
                    }
                }
            },
            where: eq(ingredientOnRecipe.recipeId, input.recipeId)
        })
    }),
    getByFirstChar: protectedProcedure
    .input(z.object({ firstchar: z.string().length(1) }))
    .query(async ({ ctx, input }) => {
        return await ctx.db.query.ingredients.findMany({
            where: or(
                like(ingredients.nameEN, `${input.firstchar}%`),
                like(ingredients.namePL, `${input.firstchar}%`)
            )
        })
    })
})