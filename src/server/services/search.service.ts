import { or, and, inArray, eq, notExists, type SQL, exists, sql, desc } from "drizzle-orm";
import { db } from "~/server/db";
import specialKeywords from "~/server/services/specialKeywords";
import { ingredients, excludants, ingredientOnRecipe, excludantOnRecipe, recipes, recipeContents, recipeReviews } from "~/server/db/schema";
type DB = typeof db;


type SearchMode = "include" | "exclude" | "prefer"; // MUST | MUST-NOT | NICE-TO-HAVE

export async function searchRecipes(query: string, page: number, pageSize: number, db: DB, includeTotal: boolean) {
    let keywords = tokenize(query);
    let tokens = await parseTokens(keywords, db);

    const whereConditions: SQL[] = [];

    if(tokens.includeIngredients.length > 0) {
        tokens.includeIngredients.forEach(e => {
            whereConditions.push(
                exists(
                    db.select().from(ingredientOnRecipe)
                        .where(and(
                            eq(ingredientOnRecipe.recipeId, recipes.id),
                            eq(ingredientOnRecipe.ingredientId, e)
                        ))
                )
            )
        })
    }
    if(tokens.excludeIngredients.length > 0) {
        whereConditions.push(
            notExists(
                db.select().from(ingredientOnRecipe)
                    .where(and(
                        eq(ingredientOnRecipe.recipeId, recipes.id),
                        inArray(ingredientOnRecipe.ingredientId, tokens.excludeIngredients)
                    ))
            )
        )
    }
    if(tokens.foundExcludants.length > 0) {
        whereConditions.push(
            notExists(
                db.select().from(excludantOnRecipe)
                    .where(and(
                        eq(excludantOnRecipe.recipeId, recipes.id),
                        inArray(excludantOnRecipe.excludantId, tokens.foundExcludants)
                    ))
            )
        )
    }

    
    const matches: SQL[] = [];
    tokens.searchTokens.forEach(e => {
        matches.push(
            sql`(CASE WHEN ${recipeContents.recipeName} LIKE ${`%${e}%`} THEN 1 ELSE 0 END)`
        );
    })
    tokens.preferIngredients.forEach(e => {
        matches.push(
            sql`(CASE WHEN ${ingredientOnRecipe.ingredientId}=${e} THEN 1 ELSE 0 END)`
        )
    })
    const sumOfMatches = matches.length > 0 ? sql.join(matches, sql` + `) : sql<number>`0`;

    const tokenScore = db.select({
        recipeId: recipeContents.recipeId,
        language: recipeContents.language,
        tokenScore: sumOfMatches.as('tokenScore')
    })
        .from(recipeContents)
        .innerJoin(ingredientOnRecipe, eq(recipeContents.recipeId, ingredientOnRecipe.recipeId))
        .groupBy(recipeContents.recipeId, recipeContents.language)
        .as('tokenScore')

    const reviewScore = db.select({
        recipeId: recipeReviews.recipeId, 
        averageRating: sql<number>`CAST(AVG(${recipeReviews.rating}) AS FLOAT)`,
        reviewScore: 
            sql<number>`
            CAST(
                AVG(${recipeReviews.rating}) *
                (
                    CAST(COUNT(*) AS FLOAT)/
                    (COUNT(*)+50)
                )
            AS FLOAT)`
        })
        .from(recipeReviews)
        .groupBy(recipeReviews.recipeId)
        .as('reviewScore')
    
    const fullScore = db.select({
        recipeId: reviewScore.recipeId,
        language: tokenScore.language,
        score: sql<number>`CAST((${reviewScore.reviewScore}*${tokenScore.tokenScore}) AS FLOAT)`.as('fullScore')
    })
        .from(tokenScore)
        .innerJoin(reviewScore, eq(reviewScore.recipeId, tokenScore.recipeId))
        .as('fullScore')

    const foundRecipes = await db.select({ 
        recipeId: recipes.id, 
        recipeLanguage: fullScore.language,
        score: fullScore.score
    })
        .from(recipes)
        .innerJoin(fullScore, and(
            eq(recipes.id, fullScore.recipeId),
            eq(recipeContents.language, fullScore.language)
        ))
        .where(and(
            ...whereConditions, 
            sql`${fullScore.score}>0`
        ))
        .limit(pageSize)
        .offset(pageSize*page)
        .orderBy(desc(fullScore.score))

    if(includeTotal) {
        const totalResponse = await db.select({ 
            total: sql<number>`COUNT(*)`
            })
            .from(recipes)
            .innerJoin(recipeContents, eq(recipes.id, recipeContents.recipeId))
            .innerJoin(fullScore, and(
                eq(recipes.id, fullScore.recipeId),
                eq(recipeContents.language, fullScore.language)
            ))
            .where(and(
                ...whereConditions, 
                sql`${fullScore.score}>0`
            ))
            .orderBy(desc(fullScore.score))

            const total = totalResponse[0]?.total
        
        if(total) {
            return {
                foundRecipes,
                total
            }
        }
    }
    return {
        foundRecipes
    }
}

function tokenize(query: string): string[] {
    let keywords = query.trim().toLocaleLowerCase().replace(/[,]/g, " ").replace(/[.]/, " . ").split(/\s+/).filter(Boolean);
      for(let i=0; i<keywords.length-1; i++) {
        if (
            specialKeywords.control.include.has(keywords[i] + " " + keywords[i+1]) || 
            specialKeywords.control.exclude.has(keywords[i] + " " + keywords[i+1])
        ) {
            keywords[i] = keywords[i] + " " + keywords[i+1];
            keywords[i+1] = "";
            i++;
        }
    }
    keywords = keywords.filter((e): e is string => e!=="");
    return keywords;
}

async function parseTokens(keywords: string[], db: DB) {
    const { foundExcludants, newKeywords } = await parseExcludants(keywords, db);
    const { ingredientBuckets, finalKeywords } = await parseIngredients(newKeywords, db)

    return {
        foundExcludants,
        includeIngredients: ingredientBuckets.include,
        excludeIngredients: ingredientBuckets.exclude,
        preferIngredients: ingredientBuckets.prefer,
        searchTokens: finalKeywords.filter(Boolean)
    }
}

async function parseExcludants(keywords: string[], db: DB) {
    let foundExcludants = []
    const potentialMatches = await db.query.excludants.findMany({
        where: or (
            inArray(excludants.nameEN, keywords),
            inArray(excludants.namePL, keywords)
        )
    })

    const lookup = new Map<string, number>();
    potentialMatches.forEach(m => {
        lookup.set(m.nameEN.toLowerCase(), m.id),
        lookup.set(m.namePL.toLowerCase(), m.id)
    })

    for (let i = 0; i < keywords.length; i++) { 
        let current = keywords[i];
        let next = keywords[i+1];

        if (!current || specialKeywords.ignore.has(current)) continue;
        
        if (next) { // check two-word combinations
            const match = lookup.get(`${current} ${next}`)
            if(match) {
                foundExcludants.push(match);
                keywords[i] = "";
                keywords[i+1] = "";
                i++; // skip next word
                continue;
            }
        }

        const match = lookup.get(current);
        if(match) { // check single word if two-word check fails
            foundExcludants.push(match);
            keywords[i] = "";
        }
    }

    return {
        foundExcludants: foundExcludants,
        newKeywords: keywords
    }
}

async function parseIngredients(keywords: string[], db: DB) {
    const buckets: Record<SearchMode, number[]> = {
        include: [],
        exclude: [],
        prefer: []
    }

    const potentialMatches = await db.query.ingredients.findMany({
        where: or(
            inArray(ingredients.nameEN, keywords),
            inArray(ingredients.namePL, keywords)
        )
    })
    
    const lookup = new Map<string, number>()
    potentialMatches.forEach(m => {
        lookup.set(m.nameEN.toLowerCase(), m.id);
        lookup.set(m.namePL.toLowerCase(), m.id);
    })

    let mode: SearchMode = "prefer";

    for (let i=0; i<keywords.length;i++) {
        let current = keywords[i];
        let next = keywords[i+1];

        if(!current || specialKeywords.ignore.has(current)) continue;

        if(specialKeywords.control.include.has(current)) { // SearchMode switching
            mode = "include";
            keywords[i] = "";
            continue;
        } else if (specialKeywords.control.exclude.has(current)) {
            mode = "exclude";
            keywords[i] = "";
            continue;
        } else if (current === ".") {
            mode = "prefer";
            keywords[i] = "";
            continue;
        }

        if(next) {
            const match = lookup.get(`${current} ${next}`); // check two-word combinations
            if(match) {
                switch (mode) {
                    case "include": 
                        buckets.include.push(match);
                        keywords[i] = "";
                        continue;
                    case "exclude":
                        buckets.exclude.push(match);
                        keywords[i] = "";
                        continue;
                    case "prefer":
                        buckets.prefer.push(match);
                        continue;
                    default:
                        buckets.prefer.push(match);
                        continue;
                }
            }
        }

        const match = lookup.get(current); //check single words if two-word combination not found
        if(match) {
            switch (mode) {
                case "include": 
                    buckets.include.push(match);
                    keywords[i] = "";
                    continue;
                case "exclude":
                    buckets.exclude.push(match);
                    keywords[i] = "";
                    continue;
                case "prefer":
                    buckets.prefer.push(match);
                    continue;
                default:
                    buckets.prefer.push(match);
                    continue;
            }
        }
    }

    return {
        ingredientBuckets: buckets,
        finalKeywords: keywords
    }
}