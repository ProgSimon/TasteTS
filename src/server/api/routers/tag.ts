import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure
} from "~/server/api/trpc";
import { z } from "zod";
import { validateRecipeOwnership } from "~/server/services/recipes.service";
import { eq, and } from "drizzle-orm";
import { tags, tagsOnRecipe } from "~/server/db/schema";

export const tagRouter = createTRPCRouter({
    add: protectedProcedure
    .input(z.object({ tagName: z.string(), recipeId: z.number() }))
    .mutation(async ({ctx, input}) => {
        await validateRecipeOwnership(input.recipeId, ctx.session.user.id, ctx.db)
        return await ctx.db.transaction(async tx => {
            let tagId: number;
            let tagExists = await tx.query.tags.findFirst({
                columns: {
                    id: true
                },
                where: eq(tags.name, input.tagName)
            }) // check if tag already exists

            if(!tagExists) {
                const tagInsert = await tx.insert(tags).values({
                    name: input.tagName
                }).$returningId()

                if(!tagInsert[0]?.id) {
                    throw new Error("Failed to retrieve insert tag.id")
                } 
                tagId = tagInsert[0].id
                //if not, insert and return id, throw error if unable to retrieve id
            } else {
                tagId = tagExists.id
            }
            
            await tx.insert(tagsOnRecipe).values({
                recipeId: input.recipeId,
                tagId: tagId
            })
        })
    }),
    remove: protectedProcedure
    .input(z.object({ recipeId: z.number(), tagId: z.number() }))
    .mutation(async ({ctx, input}) => {
        await validateRecipeOwnership(input.recipeId, ctx.session.user.id, ctx.db)
        return await ctx.db.delete(tagsOnRecipe)
            .where(and(
                eq(tagsOnRecipe.recipeId, input.recipeId),
                eq(tagsOnRecipe.tagId, input.tagId)
            ))
    }),
    getForRecipe: publicProcedure
    .input(z.object({ recipeId: z.number() }))
    .query(async ({ctx, input}) => {
        return await ctx.db.query.tagsOnRecipe.findMany({
            columns: {
                tagId: true
            },
            with: {
                tag: { columns: { name: true }}
            },
            where: eq(tagsOnRecipe.recipeId, input.recipeId)
        })
    })
})