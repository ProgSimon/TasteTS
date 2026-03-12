import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure
} from "~/server/api/trpc";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { recipeReviews, userReviews } from "~/server/db/schema";

export const reviewRouter = createTRPCRouter({
    createForUser: protectedProcedure
    .input(z.object({ 
        userId: z.string(), 
        title: z.string().optional(), 
        payload: z.string().optional(), 
        rating: z.number().min(1).max(5) 
    }))
    .mutation(async ({ ctx, input }) => {
        return ctx.db.transaction(async tx => {
            tx.insert(userReviews).values({
                reviewerId: ctx.session.user.id,
                userId: input.userId,
                rating: input.rating,
                title: input.title,
                review: input.payload
            })
        })
    }),
    createForRecipe: protectedProcedure 
    .input(z.object({ 
        recipeId: z.number(), 
        title: z.string().optional(), 
        payload: z.string().optional(), 
        rating: z.number().min(1).max(5) 
    }))
    .mutation(async ({ ctx, input }) => {
        return ctx.db.transaction(async tx => {
            tx.insert(recipeReviews).values({
                userId: ctx.session.user.id,
                recipeId: input.recipeId,
                rating: input.rating,
                title: input.title,
                review: input.payload
            })
        })
    }),
    updateForUser: protectedProcedure
    .input(z.object({ 
        userId: z.string(), 
        title: z.string().optional(), 
        payload: z.string().optional(), 
        rating: z.number().min(1).max(5) 
    }))
    .mutation(async ({ ctx, input }) => {
        return ctx.db.transaction(async tx => {
            tx.update(userReviews).set({
                rating: input.rating,
                title: input.title,
                review: input.payload
            }).where(and(
                eq(userReviews.reviewerId, ctx.session.user.id),
                eq(userReviews.userId, input.userId)
            ))
        })
    }),
    updateForRecipe: protectedProcedure
    .input(z.object({ 
        recipeId: z.number(), 
        title: z.string().optional(), 
        payload: z.string().optional(), 
        rating: z.number().min(1).max(5) 
    }))
    .mutation(async ({ ctx, input }) => {
        return ctx.db.transaction(async tx => {
            tx.update(recipeReviews).set({
                rating: input.rating,
                title: input.title,
                review: input.payload
            }).where(and(
                eq(recipeReviews.userId, ctx.session.user.id),
                eq(recipeReviews.recipeId, input.recipeId)
            ))
        })
    }),
    removeForUser: protectedProcedure
    .input(z.object({ 
        userId: z.string(), 
    }))
    .mutation(async ({ ctx, input }) => {
        return ctx.db.transaction(async tx => {
            tx.delete(userReviews)
                .where(and(
                    eq(userReviews.reviewerId, ctx.session.user.id),
                    eq(userReviews.userId, input.userId)
                ))
        })
    }),
    removeForRecipe: protectedProcedure
    .input(z.object({ 
        recipeId: z.number(), 
    }))
    .mutation(async ({ ctx, input }) => {
        return ctx.db.transaction(async tx => {
            tx.delete(recipeReviews)
                .where(and(
                    eq(recipeReviews.userId, ctx.session.user.id),
                    eq(recipeReviews.recipeId, input.recipeId)
                ))
        })
    }),
    getForUser: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ctx, input}) => {
        return ctx.db.query.userReviews.findMany({
            where: eq(userReviews.userId, input.userId)
        })
    }),
    getForRecipe: publicProcedure
    .input(z.object({ recipeId: z.number() }))
    .query(async ({ctx, input}) => {
        return ctx.db.query.recipeReviews.findMany({
            where: eq(recipeReviews.recipeId, input.recipeId)
        })
    })
})