import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure
} from "~/server/api/trpc";
import { z } from "zod";
import { eq, and, notInArray, notExists, isNull, inArray } from "drizzle-orm";
import { alternativeOnRecipe, excludantOnIngredient, excludantOnRecipe, ingredientOnRecipe } from "~/server/db/schema";
import { validateRecipeOwnership } from "~/server/services/recipes.service";
import enums from "~/server/db/enums";
import { recalculateExcludants } from "~/server/services/excludant.service";

export const alternativeRouter = createTRPCRouter({

    add: protectedProcedure
    .input(z.object({ 
        recipeId: z.number(), 
        ingredientId: z.number(),
        alternativeId: z.number(),
        amount: z.number(),
        unit: z.enum(enums.units as [string, ...string[]])
    }))
    .mutation(async ({ ctx, input }) => {
        await validateRecipeOwnership(input.recipeId, ctx.session.user.id, ctx.db)
        return ctx.db.transaction(async tx => {

            const excludantsToRemove = await tx.select( {excludantId: excludantOnRecipe.excludantId } )
                .from(excludantOnRecipe)
                .where(and(
                    eq(excludantOnRecipe.recipeId, input.recipeId),
                    eq(excludantOnRecipe.ingredientId, input.ingredientId),
                    notExists(
                        tx.select()
                            .from(excludantOnIngredient)
                            .where(and(
                                eq(excludantOnIngredient.ingredientId, input.alternativeId),
                                eq(excludantOnIngredient.excludantId, excludantOnRecipe.excludantId)
                            ))
                    )
                ))
            
            if(excludantsToRemove.length) {
                tx.delete(excludantOnRecipe)
                    .where(and(
                        eq(excludantOnRecipe.recipeId, input.recipeId),
                        eq(excludantOnRecipe.ingredientId, input.ingredientId),
                        inArray(
                            excludantOnRecipe.excludantId, 
                            excludantsToRemove.map( e => e.excludantId )
                        )
                    ))
            }

            tx.insert(alternativeOnRecipe).values({
                recipeId: input.recipeId,
                ingredientId: input.alternativeId,
                alternativeToId: input.ingredientId,
                amount: input.amount,
                unit: input.unit
            })

            tx.update(ingredientOnRecipe)
                .set({
                    alternative: true
                })
                .where(and(
                    eq(ingredientOnRecipe.recipeId, input.recipeId),
                    eq(ingredientOnRecipe.ingredientId, input.ingredientId)
                ))
        })
    }),


    remove: protectedProcedure
    .input(z.object({ 
        recipeId: z.number(), 
        ingredientId: z.number(),
        alternativeId: z.number()
    }))
    .mutation(async ({ ctx, input }) => {
        await validateRecipeOwnership(input.recipeId, ctx.session.user.id, ctx.db)
        await ctx.db.delete(alternativeOnRecipe)
            .where(and(
                eq(alternativeOnRecipe.recipeId, input.recipeId),
                eq(alternativeOnRecipe.ingredientId, input.alternativeId),
                eq(alternativeOnRecipe.alternativeToId, input.ingredientId)
            ))
        
        const remainingAlternatives = await ctx.db.query.alternativeOnRecipe.findFirst({
            where: and(
                eq(alternativeOnRecipe.recipeId, input.recipeId),
                eq(alternativeOnRecipe.alternativeToId, input.ingredientId)
            )
        })

        if(!remainingAlternatives) {
            await ctx.db.update(ingredientOnRecipe)
                .set({
                    alternative: false
                })
                .where(and(
                    eq(ingredientOnRecipe.recipeId, input.recipeId),
                    eq(ingredientOnRecipe.ingredientId, input.ingredientId)
                ))
        }

        await recalculateExcludants(input.recipeId, ctx.db);
    }),


    setAmount: protectedProcedure
    .input(z.object({ 
        recipeId: z.number(), 
        ingredientId: z.number(),
        alternativeId: z.number(),
        amount: z.number()
    }))
    .mutation(async ({ ctx, input }) => {
        await validateRecipeOwnership(input.recipeId, ctx.session.user.id, ctx.db)
        await ctx.db.update(alternativeOnRecipe)
            .set({
                amount: input.amount
            })
            .where(and(
                eq(alternativeOnRecipe.recipeId, input.recipeId),
                eq(alternativeOnRecipe.ingredientId, input.alternativeId),
                eq(alternativeOnRecipe.alternativeToId, input.ingredientId)
            ))
    }),


    setUnit: protectedProcedure
    .input(z.object({ 
        recipeId: z.number(), 
        ingredientId: z.number(),
        alternativeId: z.number(),
        unit: z.enum(enums.units as [string, ...string[]])
    }))
    .mutation(async ({ ctx, input }) => {
        await validateRecipeOwnership(input.recipeId, ctx.session.user.id, ctx.db)
        await ctx.db.update(alternativeOnRecipe)
            .set({
                unit: input.unit
            })
            .where(and(
                eq(alternativeOnRecipe.recipeId, input.recipeId),
                eq(alternativeOnRecipe.ingredientId, input.alternativeId),
                eq(alternativeOnRecipe.alternativeToId, input.ingredientId)
            ))
    }),


    getForRecipe: publicProcedure
    .input(z.object({ 
        recipeId: z.number()
    }))
    .mutation(async ({ ctx, input }) => {
        return await ctx.db.query.alternativeOnRecipe.findMany({
            with: {
                ingredient: true
            },
            where: eq(alternativeOnRecipe.recipeId, input.recipeId)
        })
    }),

    
    recalculate: protectedProcedure
    .input(z.object({
        recipeId: z.number()
    }))
    .mutation(async ({ ctx, input }) => {
        await validateRecipeOwnership(input.recipeId, ctx.session.user.id, ctx.db)
        await recalculateExcludants(input.recipeId, ctx.db)
    })
})