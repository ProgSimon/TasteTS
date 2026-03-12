import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure
} from "~/server/api/trpc";
import enums from "~/server/db/enums"
import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import { additionalIngredientsLists, ingredientOnRecipe } from "~/server/db/schema";
import { validateRecipeOwnership } from "~/server/services/recipes.service";
import { TRPCError } from "@trpc/server";

const additionalIngredientsListItem = z.strictObject({
    name: z.string(),
    amount: z.number().default(0),
    unit: z.enum(enums.units as [string, ...string[]]).default("none")
})
const additionalIngredientsListSchema = z.array(additionalIngredientsListItem)

export const pendingIngredientsRouter = createTRPCRouter({
	add: protectedProcedure
    .input(z.object({ 
        recipeId: z.number(), 
        language: z.enum(enums.languages as [string, ...string[]]), 
        ingredientName: z.string(),
        amount: z.number(),
        unit: z.enum(enums.units as [string, ...string[]])
    }))
    .mutation(async ({ ctx, input }) => {
        await validateRecipeOwnership(input.recipeId, ctx.session.user.id, ctx.db)
        return ctx.db.transaction(async tx => {
            const oldList = await tx.query.additionalIngredientsLists.findFirst({
                where: and(
                    eq(additionalIngredientsLists.recipeId, input.recipeId),
                    eq(additionalIngredientsLists.language, input.language)
                )
            })

            if(!oldList) {
                const newList = [{ name: input.ingredientName, amount: input.amount, unit: input.unit }]
                const validated = additionalIngredientsListSchema.parse(newList)
                tx.insert(additionalIngredientsLists).values({
                    ingredients: validated
                })

            } else {
                const oldValidated = additionalIngredientsListSchema.catch([]).parse(oldList.ingredients);
                if(oldValidated.find(e => e.name == input.ingredientName)) {
                        throw new TRPCError({
                            code: "CONFLICT",
                            message: "Ingredient with provided name already in the list."
                        })
                }
                const newList = [...oldValidated, { name: input.ingredientName, amount: input.amount, unit: input.unit }];
                const newValidated = additionalIngredientsListSchema.parse(newList)
                tx.update(additionalIngredientsLists).set({
                    ingredients: newValidated
                })
                    .where(and(
                        eq(additionalIngredientsLists.recipeId, input.recipeId),
                        eq(additionalIngredientsLists.language, input.language)
                    ))
            }
        })
    }),
    remove: protectedProcedure
    .input(z.object({ 
        recipeId: z.number(), 
        language: z.enum(enums.languages as [string, ...string[]]), 
        ingredientName: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
        await validateRecipeOwnership(input.recipeId, ctx.session.user.id, ctx.db)
        ctx.db.transaction(async tx => {
            const oldList = await tx.query.additionalIngredientsLists.findFirst({
                where: and(
                    eq(additionalIngredientsLists.recipeId, input.recipeId),
                    eq(additionalIngredientsLists.language, input.language)
                )
            })

            if(oldList) {
                const oldValidated = additionalIngredientsListSchema.parse(oldList)
                const newList = oldValidated.filter(e => e.name != input.ingredientName)
                const newValidated = additionalIngredientsListSchema.catch([]).parse(newList)
                tx.update(additionalIngredientsLists).set({
                    ingredients: newValidated
                })
                    .where(and(
                        eq(additionalIngredientsLists.recipeId, input.recipeId),
                        eq(additionalIngredientsLists.language, input.language)
                    ))
            }
        })
    }),
    promote: protectedProcedure
    .input(z.object({ recipeId: z.number(), promotedName: z.string(), promotedToId: z.number(), language: z.enum(enums.languages as [string, ...string[]]) }))
    .mutation(async ({ ctx, input }) => {
        await validateRecipeOwnership(input.recipeId, ctx.session.user.id, ctx.db)
        return await ctx.db.transaction(async tx => {
            const oldList = await tx.query.additionalIngredientsLists.findFirst({
                where: and(
                    eq(additionalIngredientsLists.recipeId, input.recipeId),
                    eq(additionalIngredientsLists.language, input.language)
                )
            })

            if (oldList) {
                const oldValidated = additionalIngredientsListSchema.parse(oldList);
                const promotedElement = oldValidated.find( e => e.name == input.promotedName)
                if(promotedElement) {
                    const newList = oldValidated.filter(e => e.name != input.promotedName)
                    const newValidated = additionalIngredientsListSchema.catch([]).parse(newList)
                    
                        
                    let affected = await tx.insert(ingredientOnRecipe).values({ // first try to update ingredientOnRecipe
                        recipeId: input.recipeId,
                        ingredientId: input.promotedToId,
                        amount: promotedElement.amount,
                        unit: promotedElement.unit,
                        alternative: false
                    })
                    .onDuplicateKeyUpdate( { set: { recipeId: sql`recipeId`, ingredientId: sql`ingredientId` }})

                    if(affected[0].affectedRows === 1) { // if succedes without conflicts, only then update additionalIngredientsLists
                        tx.update(additionalIngredientsLists).set({
                            ingredients: newValidated
                        })
                            .where(and(
                                eq(additionalIngredientsLists.recipeId, input.recipeId),
                                eq(additionalIngredientsLists.language, input.language)
                            ))
                    } else {
                        throw new TRPCError({
                            code: "CONFLICT",
                            message: "promoting to an ingredient already in the recipe"
                        })
                    }  
                }
            }
       })
    }),
    get: publicProcedure
    .input(z.object({ recipeId: z.number(), language: z.enum(enums.languages as [string, ...string[]]) }))
    .query(async ({ ctx, input }) => {
        const list = await ctx.db.query.additionalIngredientsLists.findFirst({
            columns: {
                ingredients: true
            },
            where: and(
                eq(additionalIngredientsLists.recipeId, input.recipeId),
                eq(additionalIngredientsLists.language, input.language)
            )
        })
        const validatedList = additionalIngredientsListSchema.catch([]).parse(list)
        return validatedList;
    })
})