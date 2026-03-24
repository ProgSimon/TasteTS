# Project TasteTS - API overview

## Design approach

The API was designed using tRPC

Key design goals:
 - Procedures spread between their applicable domains
 - Procedures centered around user actions (what can user do in each domain)
 - Future extensibility
 - Separation between API and service layers


## Service layer

Service layer is responsible for enforcing business logic, and handling complex database operations. It also contains frequently reused code.

Currently there are three services in the service layer:

 1. Excludant service - handles complicated excludant logic. Currently has only one function, which recalculates excludants on recipes from scratch.

 1. Recipe service - enforces business logic on recipes. Currently hosts two functions:
    - recipe ownership validation
    - recipe variant existence

 1. Search service - contains recipe search algorithm


## API layer

API layer hosts tRPC procedures spread around six routers, each handling different domain:

 1. Recipe
 1. Ingredient
 1. Alternative
 1. Pending ingredient
 1. Tag
 1. Review

These procedures handle CRUD operations, and service layer calls


## tRPC routers

 1. Recipe - handles recipe operations

    **User actions:**
    - create
    - add language variant
    - update content
    - update ingredient notes
    - update name
    - remove language variant
    - remove fully with all its variants
    - update recipe status
    - update variant status
    - get by id
    - get by user id
    - get own
    - search

 1. Ingredient - handles ingredients and excludants on recipes

    **User actions:**
    - add to recipe
    - remove from recipe
    - set amount
    - set unit
    - get for recipe
    - get by first character

    Last procedure is used for ingredient addition. Instead of fetching full ingredients table, only ingredients starting with provided starting letter are fetched. Further filtering is done client-side.

 1. Alternative - handles alternative ingredients and excludants on recipes

    **User actions:**
    - add to ingredient on recipe
    - remove from ingredient on recipe
    - set amount
    - set unit
    - get for recipe
    - recalculate recipe excludants

    Last procedure is for testing only.

 1. Pending ingredient - handles ingredients not present in the database

    **User actions:**
    - add to recipe
    - remove from recipe
    - promote
    - get for recipe

    The "promote" procedure is used after the ingredient has been added to the database. 

 1. Tag - handles tags on recipes

    **User actions:**
    - add
    - remove
    - get for recipe

 1. Review - handles both recipe, and user reviews

    **User actions:**
    - create for user
    - create for recipe
    - update for user
    - update for recipe
    - remove from user
    - remove from recipe
    - get for user
    - get for recipe


## Search algorithm v1

API currently features early recipe search algorithm with recipe ranking. It has its limitations and is subject for later expansion.

Algorithm works in a few simple steps:
 1. transform user query into usable search words
 1. remove unnecessary "glue-words"
 1. find excludants, and remove them from further search
 1. read query word by word looking for ingredients, and distribute them between three "baskets":
    - *include* - must have
    - *exclude* - must not have
    - *prefer* - should have

    The basket is determined by search mode:
    - **prefer** - default mode
    - **include** - enabled when a word like "with" or "including" is read. Following ingredients are added into *include basket* until **exclude mode** word is encountered, or a period sign resets it to **prefer mode**
    - **exclude** - enabled when a word like "without" or "no" is read. Following ingredients are added into *exclude basket* until **include mode** word is encountered, or a period sign resets it to **prefer mode**

    Ingredients injected into *include* and *exclude* baskets are removed from search keywords

 1. Read from database recipes:
    - with ingredients from *include* basket
    - without ingredients from *exclude* basket
    - without excludants found in the search query

    Recipes are rated by remaining keywords, and ingredients from *prefer* basket:
    - keyword found in name awards 1 point to recipe
    - ingredient from *prefer* basket awards 1 point to recipe

 1. Return recipes in ranking order, with offset: (page number)*(page size)
 1. When a user first searches the query the client doesn't have the number of pages. To get the number of appropriate recipes the client must send **includeTotal** flag.

 ## Notes
 - The search algorithm currently supports excludants, ingredients, etc., with a maximum length of two words.
 - Until the search algorithm is expanded, instructions detailing proper search usage will be present on the search page