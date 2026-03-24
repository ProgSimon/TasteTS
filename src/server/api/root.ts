import { recipeRouter } from "~/server/api/routers/recipe";
import { ingredientRouter } from "./routers/ingredient";
import { pendingIngredientsRouter } from "./routers/pendingIngredient";
import { reviewRouter } from "./routers/reviews";
import { tagRouter } from "./routers/tag";
import { alternativeRouter } from "./routers/alternative";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  recipe: recipeRouter,
  ingredient: ingredientRouter,
  pendingIngredient: pendingIngredientsRouter,
  review: reviewRouter,
  tag: tagRouter,
  alternative: alternativeRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
