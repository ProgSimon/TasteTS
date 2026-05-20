import { protCallerOwner } from "~/test/callers";

describe("recipe CRUD", () => {
    it("creates and deletes a recipe along with its variant", async () => {
        const newRecipe = await protCallerOwner.recipe.create({ name: "test", language: "english"})
        await expect(protCallerOwner.recipe.getById({ recipeId: newRecipe, language: "english" })).resolves.toHaveProperty("recipeName", "test")

        await protCallerOwner.recipe.removeFull({ recipeId: newRecipe })
        await expect(protCallerOwner.recipe.getById({ recipeId: newRecipe, language: "english" })).resolves.toBeUndefined()
    })

    it("adds a recipe variant", async () => {
        await protCallerOwner.recipe.addLanguageVariant({ name: "test4", recipeId: 4, language: "english"})

        await expect(protCallerOwner.recipe.getById({ recipeId: 4, language: "english" })).resolves.toHaveProperty("recipeName", "test4")
    })

    it("updates recipe data", async () => {
        await protCallerOwner.recipe.updateContent({content: "testContent", language: "english", recipeId: 4})
        await protCallerOwner.recipe.updateIngredientNotes({ingredientNotes: "testNotes", language: "english", recipeId: 4})
        await protCallerOwner.recipe.updateName({name: "testName", language: "english", recipeId: 4})
        await protCallerOwner.recipe.updateStatus({status: "public", recipeId: 4})
        await protCallerOwner.recipe.updateVariantStatus({status: "public", language: "english", recipeId: 4})

        await expect(protCallerOwner.recipe.getById({ recipeId: 4, language: "english"})).resolves.toMatchObject({
            status: "public",
            recipeId: 4,
            language: "english",
            recipeContent: "testContent",
            recipeName: "testName",
            ingredientNotes: "testNotes"
        })
    })

    it("removes recipe variant", async () => {
        await protCallerOwner.recipe.removeLanguageVariant({ recipeId: 4, language: "english"})

        await expect(protCallerOwner.recipe.getById({ recipeId: 4, language: "english"})).resolves.toBeUndefined()
    })

    it("fetches own recipes", async () => {
        await expect(protCallerOwner.recipe.getOwn({ page: 0,  pageSize: 5})).resolves.toHaveLength(4)
    })
    it("fetches a recipe", async () => {
        await expect(protCallerOwner.recipe.getById({ recipeId: 1, language: "english" })).resolves.toHaveProperty("recipeName")
    })
    it("fetches recipes", async () => {
        await expect(protCallerOwner.recipe.getMany({ recipes: [
            {recipeId: 1, recipeLanguage: "english", score: 2},
            {recipeId: 1, recipeLanguage: "polish", score: 2}
        ]})).resolves.toHaveLength(2)
    })
})