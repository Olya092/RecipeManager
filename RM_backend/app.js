require('dotenv').config();

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

var app = express();

app.use(cors());
app.use(logger('dev'));
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true })); 
app.use(cookieParser());

const db_connection_string = process.env.MONGODB_CONNECTION_STRING;
const client = new MongoClient(db_connection_string, {
    serverApi: { 
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

const dbName = "RM_backend"; 
const recipesCollectionName = "recipes";

async function connectToDatabase() {
    try {
        await client.connect();
        await client.db(dbName).command({ ping: 1 });
        console.log("Connection to DB successful. Database: " + dbName);
    } catch (error) {
        console.error("Error during DB connection: ", error);
        process.exit(1); 
    }
}

connectToDatabase();

// Helper function to get the recipes collection
function recipes() {
    return client.db(dbName).collection(recipesCollectionName);
}

// --- CRUD Functions for Recipes ---

async function getAllRecipes(queryParams) {
    try {
        let filter = {};
        
        // Handle search functionality
        if (queryParams.search) {
            const searchTerm = queryParams.search;
            filter = {
                $or: [
                    { name: { $regex: searchTerm, $options: 'i' } },
                    { description: { $regex: searchTerm, $options: 'i' } },
                    { category: { $regex: searchTerm, $options: 'i' } },
                    { temperature: { $regex: searchTerm, $options: 'i' } }
                ]
            };
        }
        
        // Handle category filter 
        if (queryParams.category && queryParams.category !== 'All') {
            filter.category = queryParams.category;
        }
        
        const data = await recipes().find(filter).toArray();
        return data;
    } catch (err) {
        console.error("Something went wrong querying all recipes: " + err);
        throw err;
    }
}

async function getRecipeById(id) {
    try {
        if (!ObjectId.isValid(id)) {
            console.error("ObjectID is not valid for getRecipeById");
            return null;
        }

        const oID = new ObjectId(id);
        const data = await recipes().findOne({ _id: oID });
        
        if (data) {
            // Transform _id to id for frontend compatibility
            const { _id, ...rest } = data;
            return {
                ...rest,
                id: _id.toString()
            };
        }
        
        return data;
    } catch (err) {
        console.error("Something went wrong querying the recipe with id ", id, err);
        throw err;
    }
}

async function createNewRecipe(recipeData) {
    try {
        const newRecipe = {
            ...recipeData,
            image: recipeData.image || "https://theme-assets.getbento.com/sensei/3d11b60.sensei/assets/images/catering-item-placeholder-704x520.png",
            description: recipeData.description || "",
            prepTime: recipeData.prepTime || null,
            cookTime: recipeData.cookTime || null,
            temperature: recipeData.temperature || "",
            link: recipeData.link || "",
            createdAt: new Date(),
            lastModified: new Date()
        };
        
        const result = await recipes().insertOne(newRecipe);
        return newRecipe;
    } catch (err) {
        console.error("Something went wrong creating a new recipe: ", err);
        throw err;
    }
}

async function updateRecipe(id, updatedData) {
    try {
        if (!ObjectId.isValid(id)) {
            console.error("ObjectID is not valid for updateRecipe");
            return null;
        }

        const oID = new ObjectId(id);
        
        // Remove _id and id fields from updatedData to prevent MongoDB error
        const { _id, id: recipeId, ...cleanData } = updatedData;
        
        const updatedRecipeDocument = await recipes().findOneAndUpdate(
            { _id: oID },
            {
                $set: {
                    ...cleanData,
                    lastModified: new Date()
                }
            },
            { returnDocument: 'after' }
        );
        
        if (updatedRecipeDocument) {
            // Transform _id to id for frontend compatibility
            const { _id, ...rest } = updatedRecipeDocument;
            return {
                ...rest,
                id: _id.toString()
            };
        }
        
        return updatedRecipeDocument;
    } catch (err) {
        console.error(`Something went wrong updating recipe with id ${id}:`, err);
        throw err;
    }
}

async function deleteRecipeById(id) {
    try {
        if (!ObjectId.isValid(id)) {
            console.error("ObjectID is not valid for deleteRecipeById", id);
            return null;
        }

        const oID = new ObjectId(id);
        const result = await recipes().deleteOne({ _id: oID });
        return result.deletedCount > 0;
    } catch (err) {
        console.error(`Something went wrong deleting recipe with id ${id}:`, err);
        throw err;
    }
}

// --- API Endpoints ---

// GET /api/recipes - Get all recipes with optional search
app.get("/api/recipes", async (req, res) => {
    try {
        const queryParams = req.query;
        const allRecipes = await getAllRecipes(queryParams);
        res.json({ recipes: allRecipes });
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve recipes." });
    }
});

// POST /api/recipes - Create a new recipe
app.post("/api/recipes", async (req, res) => {
    const recipeData = req.body;

    if (!recipeData.name) {
        return res.status(400).json({ error: "Missing required field (name)." });
    }
    
    try {
        const newRecipe = await createNewRecipe(recipeData);
        res.status(201).json(newRecipe);
    } catch (error) {
        res.status(500).json({ error: "Failed to create recipe." });
    }
});

// GET /api/recipes/:id - Get a single recipe by ID
app.get("/api/recipes/:id", async (req, res) => {
    const recipeId = req.params.id;
    
    try {
        const recipe = await getRecipeById(recipeId);
        if (!recipe) {
            return res.status(404).json({ error: "Recipe not found." });
        }
        res.json(recipe);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve recipe." });
    }
});

// PUT /api/recipes/:id - Update an existing recipe
app.put("/api/recipes/:id", async (req, res) => {
    const recipeId = req.params.id;
    const updatedData = req.body;

    if (!updatedData) {
        return res.status(400).json({ error: "Missing recipe data in request body." });
    }

    try {
        const updatedRecipe = await updateRecipe(recipeId, updatedData);
        if (!updatedRecipe) {
            return res.status(404).json({ error: "Recipe not found." });
        }
        res.json(updatedRecipe);
    } catch (error) {
        res.status(500).json({ error: "Failed to update recipe." });
    }
});

// DELETE /api/recipes/:id - Delete a recipe
app.delete("/api/recipes/:id", async (req, res) => {
    const recipeId = req.params.id;
    
    try {
        const success = await deleteRecipeById(recipeId);
        if (success === null) {
            return res.status(400).json({ error: "Invalid recipe ID format for deletion." });
        }
        if (success) {
            res.status(204).send();
        } else {
            res.status(404).json({ error: "Recipe not found." });
        }
    } catch (error) {
        res.status(500).json({ error: "Failed to delete recipe." });
    }
});

// --- Test Endpoint ---
app.get("/", (req, res) => {
    res.send({ message: "Welcome to the Recipe Manager backend!" });
});


module.exports = app;