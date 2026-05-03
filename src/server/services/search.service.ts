import { or, and, inArray, eq, notExists, type SQL, exists, sql, desc } from "drizzle-orm";
import { db } from "~/server/db";
import specialKeywords from "~/server/services/specialKeywords";
import { ingredients, excludants, ingredientOnRecipe, excludantOnRecipe, recipes, recipeContents, recipeReviews } from "~/server/db/schema";
import { alias } from "drizzle-orm/mysql-core";
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
                            eq(ingredientOnRecipe.recipeId, recipeContents.recipeId),
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
                        eq(ingredientOnRecipe.recipeId, recipeContents.recipeId),
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
                        eq(excludantOnRecipe.recipeId, recipeContents.recipeId),
                        inArray(excludantOnRecipe.excludantId, tokens.foundExcludants)
                    ))
            )
        )
    }

    const recipeContentsAlias = alias(recipeContents, "rc")
    const ingredientOnRecipeAlias = alias(ingredientOnRecipe, "ir")
    let keywordMatches: SQL[] = [];
    tokens.searchTokens.forEach(e => {
        keywordMatches.push(
            sql`(CASE WHEN ${recipeContentsAlias.recipeName} LIKE ${`%${e}%`} THEN 1 ELSE 0 END)`
        );
    })
    keywordMatches = [sql`(0`, ...keywordMatches, sql`0)`]
    const sumOfMatches = keywordMatches.length > 0 ? sql.join(keywordMatches, sql` + `) : sql<number>`0`;
    if(tokens.preferIngredients.length) {
        sumOfMatches.append(
            sql`+ (SELECT COUNT(*) FROM ${ingredientOnRecipe} AS \`ir\` 
                WHERE ${ingredientOnRecipeAlias.recipeId}=${recipeContentsAlias.recipeId}
                AND
                ${ingredientOnRecipeAlias.ingredientId} IN (`
            )
        const ids: SQL[] = []
        tokens.preferIngredients.forEach(e => {
            ids.push(sql`${e}`)
        })

        sumOfMatches.append(sql.join(ids, sql`, `))
        sumOfMatches.append(sql`))`)
    }

    const tokenScore = db.select({
        recipeId: recipeContentsAlias.recipeId,
        language: recipeContentsAlias.language,
        tokenScore: sumOfMatches.as('tokenScore')
    })
        .from(recipeContentsAlias)
        .leftJoin(ingredientOnRecipe, eq(recipeContentsAlias.recipeId, ingredientOnRecipe.recipeId))
        .groupBy(recipeContentsAlias.recipeId, recipeContentsAlias.language)
        .as('tokenScore')


    const reviewScore = db.select({
        recipeId: recipes.id, 
        averageRating: sql<number>`CAST(IFNULL(AVG(${recipeReviews.rating}), 0.01) AS FLOAT)`.as("averageRating"),
        reviewScore: 
            sql<number>`
            CAST(
                IFNULL(AVG(${recipeReviews.rating}),0.01) *
                (
                    CAST(COUNT(*) AS FLOAT)/
                    (COUNT(*)+50)
                )
            AS FLOAT)`.as("reviewScore")
        })
        .from(recipes)
        .leftJoin(recipeReviews, eq(recipes.id, recipeReviews.recipeId))
        .groupBy(recipes.id)
        .as('reviewScore')
    
    const fullScore = db.select({
        recipeId: reviewScore.recipeId,
        language: tokenScore.language,
        score: sql<number>`CAST((${reviewScore.reviewScore}*${tokenScore.tokenScore}) AS FLOAT)`.as('fullScore')
    })
        .from(tokenScore)
        .innerJoin(reviewScore, eq(reviewScore.recipeId, tokenScore.recipeId))
        .groupBy(reviewScore.recipeId, tokenScore.language)
        .as('fullScore')

    const foundRecipes = await db.select({ 
        recipeId: recipeContents.recipeId, 
        recipeLanguage: fullScore.language,
        score: fullScore.score
    })
        .from(recipeContents)
        .innerJoin(fullScore, and(
            eq(recipeContents.recipeId, fullScore.recipeId),
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
            .from(recipeContents)
            .innerJoin(fullScore, and(
                eq(recipeContents.recipeId, fullScore.recipeId),
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
        else {
            return {
                foundRecipes,
                total: 0
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