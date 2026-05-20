import { pubCaller, protCallerOther } from "~/test/callers";

describe("recipe business logic", () => {
    it("throws error on recipe delete by wrong user", async () => {
        await expect(pubCaller.recipe.removeFull({ recipeId: 1 })).rejects.toThrow(Error)
        await expect(protCallerOther.recipe.removeFull({ recipeId: 1 })).rejects.toThrow(Error)

        await expect(pubCaller.recipe.removeLanguageVariant({ recipeId: 1, language: "english" })).rejects.toThrow(Error)
        await expect(protCallerOther.recipe.removeLanguageVariant({ recipeId: 1, language: "english" })).rejects.toThrow(Error)
    })

    it("throws error on recipe update by wrong user", async () => {

        //public caller
        await expect(pubCaller.recipe.updateName({name: "test", language: "english", recipeId: 1 })).rejects.toThrow(Error)

        await expect(pubCaller.recipe.updateContent({ content: "test", language: "english", recipeId: 1 })).rejects.toThrow(Error)
        
        await expect(pubCaller.recipe.updateIngredientNotes({ ingredientNotes: "test", language: "english", recipeId: 1 })).rejects.toThrow(Error)

        await expect(pubCaller.recipe.updateStatus({ status: "public", recipeId: 1 })).rejects.toThrow(Error)

        await expect(pubCaller.recipe.updateVariantStatus({ status: "public", language: "english", recipeId: 1 })).rejects.toThrow(Error)


        // prot caller
        await expect(protCallerOther.recipe.updateName({ name: "test", language: "english", recipeId: 1 })).rejects.toThrow(Error)

        await expect(protCallerOther.recipe.updateContent({ content: "test", language: "english", recipeId: 1 })).rejects.toThrow(Error)
        
        await expect(protCallerOther.recipe.updateIngredientNotes({ ingredientNotes: "test", language: "english", recipeId: 1 })).rejects.toThrow(Error)

        await expect(protCallerOther.recipe.updateStatus({ status: "public", recipeId: 1 })).rejects.toThrow(Error)

        await expect(protCallerOther.recipe.updateVariantStatus({ status: "public", language: "english", recipeId: 1 })).rejects.toThrow(Error)
    })

    it("throws error on unauthorized recipe read with private status", async () => {
        await expect(pubCaller.recipe.getById({ recipeId: 2, language: "polish"})).rejects.toThrow(Error)        // full recipe - private, variant - private
        await expect(pubCaller.recipe.getById({ recipeId: 2, language: "english"})).rejects.toThrow(Error)       // private - public
        await expect(pubCaller.recipe.getById({ recipeId: 3, language: "english"})).rejects.toThrow(Error)       // public - private
        await expect(protCallerOther.recipe.getById({ recipeId: 2, language: "polish"})).rejects.toThrow(Error)
        await expect(protCallerOther.recipe.getById({ recipeId: 2, language: "english"})).rejects.toThrow(Error) 
        await expect(protCallerOther.recipe.getById({ recipeId: 3, language: "english"})).rejects.toThrow(Error) 

        await expect(pubCaller.recipe.getMany({ recipes: [
            {recipeId: 2, recipeLanguage: "polish", score: 3},   // private - private
            {recipeId: 2, recipeLanguage: "english", score: 2},  // private - public
            {recipeId: 3, recipeLanguage: "english", score: 2},  // public - private
        ]})).rejects.toThrow(Error)
        await expect(protCallerOther.recipe.getMany({ recipes: [
            {recipeId: 2, recipeLanguage: "polish", score: 3},
            {recipeId: 2, recipeLanguage: "english", score: 2},
            {recipeId: 3, recipeLanguage: "english", score: 2},
        ]})).rejects.toThrow(Error)
    })

    it("throws error on unathorized variant creation", async () => {
        await expect(pubCaller.recipe.addLanguageVariant({ name: "test", recipeId: 4, language: "english" })).rejects.toThrow(Error)
        await expect(protCallerOther.recipe.addLanguageVariant({ name: "test", recipeId: 4, language: "english" })).rejects.toThrow(Error)
    })
})