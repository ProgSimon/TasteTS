import { pubCaller } from "~/test/callers";

describe("search", () => {
    it("returns total number of recipes when total flag is present", async () => {
    let query = await pubCaller.recipe.search({
            query: "",
            page: 0,
            pageSize: 5,
            includeTotal: true
        })

        expect(query).toEqual({
            foundRecipes: [],
            total: 0
        })

        query = await pubCaller.recipe.search({
            query: "",
            page: 0,
            pageSize: 5,
            includeTotal: false
        })
        expect(query).toEqual({
            foundRecipes: []
        })
    })

    it("returns when given a query", async () => {
    let query = await pubCaller.recipe.search({
            query: "dumplings salt with pepper without milk lactose",
            page: 0,
            pageSize: 5,
            includeTotal: false
        })
        expect(query).toEqual({
            foundRecipes: expect.any(Array)
        })
    })
})