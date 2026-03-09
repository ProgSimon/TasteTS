import { TRPCError } from "@trpc/server";
import { and, eq, inArray, or } from "drizzle-orm";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import enums from "~/server/db/enums";
import { recipeContents, recipes } from "~/server/db/schema";
import { validateRecipeVariantExistence, validateRecipeOwnership } from "~/server/services/recipes.service";
import { searchRecipes } from "~/server/services/search.service";

export const recipeRouter = createTRPCRouter({
    create: protectedProcedure
    .input(z.object({ name: z.string(), language: z.enum(enums.languages as [string, ...string[]])}))
    .mutation(async ({ ctx, input }) => {
        return await ctx.db.transaction(async (tx) => {

            const res = await tx.insert(recipes).values({ // insert main body of the recipe
                creatorId: ctx.session.user.id
            }).$returningId();
            const newRecipeId = res[0]?.id;

            if (!newRecipeId) { // throw error if unable to retrieve new recipe id
                throw new Error("Failed to retrieve insert recipe.id");
            }

            await tx.insert(recipeContents).values({ // insert the created body of the recipe
                recipeId: newRecipeId,
                language: input.language,
                recipeName: input.name,
                recipeContent: ""
            })
        })
    }),
    addLanguageVariant: protectedProcedure
    .input(z.object({ recipeId: z.number(), language: z.enum(enums.languages as [string, ...string[]]), name: z.string()}))
    .mutation(async ({ctx, input}) => {
        await validateRecipeOwnership(input.recipeId, ctx.session.user.id, ctx.db)
        return await ctx.db.transaction(async (tx) => {
            const recipeVersion = await tx.query.recipeContents.findFirst({
                where: and(
                    eq(recipeContents.recipeId, input.recipeId),
                    eq(recipeContents.language, input.language)
                )
            }) // check if a version of the recipe already exists for the specified language

            if(recipeVersion) {
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "A version of this recipe already exists for the specified language."
                })
            }

            await tx.insert(recipeContents).values({
                recipeId: input.recipeId,
                language: input.language,
                recipeName: input.name,
                recipeContent: ""
            })
        })
    }),
    updateContent: protectedProcedure
    .input(z.object({ recipeId: z.number(), language: z.enum(enums.languages as [string, ...string[]]), content: z.string() }))
    .mutation(async ({ctx, input}) => {
        await validateRecipeOwnership(input.recipeId, ctx.session.user.id, ctx.db)
        await validateRecipeVariantExistence(input.recipeId, input.language, ctx.db)
        return await ctx.db.update(recipeContents).set({
            recipeContent: input.content
        }).where(and(
            eq(recipeContents.recipeId, input.recipeId),
            eq(recipeContents.language, input.language)
        ))
    }),
    updateIngredientNotes: protectedProcedure
    .input(z.object({ recipeId: z.number(), language: z.enum(enums.languages as [string, ...string[]]), ingredientNotes: z.string() }))
    .mutation(async ({ctx, input}) => {
        await validateRecipeOwnership(input.recipeId, ctx.session.user.id, ctx.db)
        await validateRecipeVariantExistence(input.recipeId, input.language, ctx.db)
        return await ctx.db.update(recipeContents).set({
            ingredientNotes: input.ingredientNotes
        }).where(and(
            eq(recipeContents.recipeId, input.recipeId),
            eq(recipeContents.language, input.language)
        ))
    }),
    updateName: protectedProcedure
    .input(z.object({ recipeId: z.number(), language: z.enum(enums.languages as [string, ...string[]]), name: z.string() }))
    .mutation(async ({ctx, input}) => {
        await validateRecipeOwnership(input.recipeId, ctx.session.user.id, ctx.db)
        await validateRecipeVariantExistence(input.recipeId, input.language, ctx.db)
        return await ctx.db.update(recipeContents).set({
            recipeName: input.name
        }).where(and(
            eq(recipeContents.recipeId, input.recipeId),
            eq(recipeContents.language, input.language)
        ))
    }),
    removeLanguageVariant: protectedProcedure
    .input(z.object({ recipeId: z.number(), language: z.enum(enums.languages as [string, ...string[]])}))
    .mutation(async ({ctx, input}) => {
        await validateRecipeOwnership(input.recipeId, ctx.session.user.id, ctx.db)
        await validateRecipeVariantExistence(input.recipeId, input.language, ctx.db)
        return await ctx.db.delete(recipeContents).where(and(
            eq(recipeContents.recipeId, input.recipeId),
            eq(recipeContents.language, input.language)
        ))
    }),
    removeFull: protectedProcedure
    .input(z.object({ recipeId: z.number() }))
    .mutation(async ({ctx, input}) => {
        await validateRecipeOwnership(input.recipeId, ctx.session.user.id, ctx.db)
        return await ctx.db.transaction(async (tx) => {
            await tx.delete(recipeContents).where(eq(recipeContents.recipeId, input.recipeId))
            await tx.delete(recipes).where(eq(recipes.id, input.recipeId))
        })
    }),
    updateStatus: protectedProcedure
    .input(z.object({ recipeId: z.number(), status: z.enum(enums.statuses as [string, ...string[]]) }))
    .mutation(async ({ctx, input}) => {
        await validateRecipeOwnership(input.recipeId, ctx.session.user.id, ctx.db)
        return await ctx.db.update(recipes).set({
            status: input.status
        }).where(eq(recipes.id, input.recipeId))
    }),
    updateVariantStatus: protectedProcedure
    .input(z.object({ recipeId: z.number(), language: z.enum(enums.languages as [string, ...string[]]), status: z.enum(enums.statuses as [string, ...string[]]) }))
    .mutation(async ({ctx, input}) => {
        await validateRecipeOwnership(input.recipeId, ctx.session.user.id, ctx.db)
        await validateRecipeVariantExistence(input.recipeId, input.language, ctx.db)
        return await ctx.db.update(recipeContents).set({
            status: input.status
        }).where(and(
            eq(recipeContents.recipeId, input.recipeId),
            eq(recipeContents.language, input.language)
        ))
    }),
    getById: publicProcedure
    .input(z.object({ recipeId: z.number(), language: z.enum(enums.languages as [string, ...string[]]) }))
    .query(async ({ctx, input}) => {
        return await ctx.db.query.recipeContents.findFirst({
            where: and(
                eq(recipeContents.recipeId, input.recipeId),
                eq(recipeContents.language, input.language)
            ),
        })
    }),
    getByUserId: publicProcedure
    .input(z.object({ userId: z.string(), page: z.number().min(0), pageSize: z.number().min(5) }))
    .query(async ({ctx, input}) => {
        return await ctx.db.query.recipes.findMany({
            limit: input.pageSize,
            offset: input.page * input.pageSize,
            where: and(
                eq(recipes.creatorId, input.userId),
                eq(recipes.status, "public")
            )
        })
    }),
    getOwn: protectedProcedure
    .input(z.object({ page: z.number().min(0), pageSize: z.number().min(5) }))
    .query(async ({ctx, input}) => {
        return await ctx.db.query.recipes.findMany({
            limit: input.pageSize,
            offset: input.page * input.pageSize,
            where: eq(recipes.creatorId, ctx.session.user.id)
        })
    }),
    search: publicProcedure
    .input(z.object({ query: z.string(), page: z.number(), pageSize: z.number().min(5), includeTotal: z.boolean() }))
    .query(async ({ ctx, input }) => {
        return await searchRecipes(input.query, input.page, input.pageSize, ctx.db,  input.includeTotal);
    })
})