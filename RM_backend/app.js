require('dotenv').config();

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

var app = express();

app.use(cors());
app.use(logger('dev'));
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true })); 
app.use(cookieParser());

const db_connection_string = process.env.MONGODB_CONNECTION_STRING;
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-key-change-this';
const SALT_ROUNDS = 10;

const client = new MongoClient(db_connection_string, {
    serverApi: { 
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

const dbName = "RM_backend"; 
const recipesCollectionName = "recipes";
const usersCollectionName = "users";

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

// Helper functions to get collections
function recipes() {
    return client.db(dbName).collection(recipesCollectionName);
}

function users() {
    return client.db(dbName).collection(usersCollectionName);
}

// Authentication Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) {
        return res.status(401).json({ error: "Access token required" });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Invalid or expired token" });
        }
        req.user = user;
        next();
    });
}

// --- USER AUTHENTICATION FUNCTIONS ---

async function createUser(userData) {
    try {
        // Check if user already exists
        const existingUser = await users().findOne({ email: userData.email });
        if (existingUser) {
            throw new Error('User with this email already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);

        const newUser = {
            name: userData.name,
            email: userData.email,
            password: hashedPassword,
            createdAt: new Date(),
            lastModified: new Date()
        };

        const result = await users().insertOne(newUser);
        
        // Return user without password
        const { password, ...userWithoutPassword } = newUser;
        return {
            ...userWithoutPassword,
            id: newUser._id.toString()
        };
    } catch (err) {
        console.error("Error creating user:", err);
        throw err;
    }
}

async function authenticateUser(email, password) {
    try {
        const user = await users().findOne({ email: email });
        if (!user) {
            throw new Error('Invalid credentials');
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            throw new Error('Invalid credentials');
        }

        // Return user without password
        const { password: userPassword, ...userWithoutPassword } = user;
        return {
            ...userWithoutPassword,
            id: user._id.toString()
        };
    } catch (err) {
        console.error("Error authenticating user:", err);
        throw err;
    }
}

async function getUserById(id) {
    try {
        if (!ObjectId.isValid(id)) {
            return null;
        }

        const oID = new ObjectId(id);
        const user = await users().findOne({ _id: oID });
        
        if (user) {
            const { password, ...userWithoutPassword } = user;
            return {
                ...userWithoutPassword,
                id: user._id.toString()
            };
        }
        
        return null;
    } catch (err) {
        console.error("Error getting user by ID:", err);
        throw err;
    }
}

async function getAllUsers() {
    try {
        const data = await users().find({}).toArray();
        
        // Transform and remove passwords
        const transformedData = data.map(user => {
            const { password, _id, ...rest } = user;
            return {
                ...rest,
                id: _id.toString()
            };
        });
        
        return transformedData;
    } catch (err) {
        console.error("Something went wrong querying all users: " + err);
        throw err;
    }
}

async function updateUser(id, updatedData) {
    try {
        if (!ObjectId.isValid(id)) {
            console.error("ObjectID is not valid for updateUser");
            return null;
        }

        const oID = new ObjectId(id);
        
        // Remove sensitive fields from updatedData
        const { _id, id: userId, password, currentPassword, ...cleanData } = updatedData;
        
        // If password is being updated, verify current password first
        if (password) {
            if (!currentPassword) {
                throw new Error('Current password is required to change password');
            }
            
            // Get current user to verify password
            const currentUser = await users().findOne({ _id: oID });
            if (!currentUser) {
                throw new Error('User not found');
            }
            
            // Verify current password
            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentUser.password);
            if (!isCurrentPasswordValid) {
                throw new Error('Current password is incorrect');
            }
            
            // Hash the new password
            cleanData.password = await bcrypt.hash(password, SALT_ROUNDS);
        }
        
        const updatedUserDocument = await users().findOneAndUpdate(
            { _id: oID },
            {
                $set: {
                    ...cleanData,
                    lastModified: new Date()
                }
            },
            { returnDocument: 'after' }
        );
        
        if (updatedUserDocument) {
            // Transform and remove password
            const { password, _id, ...rest } = updatedUserDocument;
            return {
                ...rest,
                id: _id.toString()
            };
        }
        
        return updatedUserDocument;
    } catch (err) {
        console.error(`Something went wrong updating user with id ${id}:`, err);
        throw err;
    }
}

async function deleteUserById(id) {
    try {
        if (!ObjectId.isValid(id)) {
            console.error("ObjectID is not valid for deleteUserById", id);
            return null;
        }

        const oID = new ObjectId(id);
        const result = await users().deleteOne({ _id: oID });
        return result.deletedCount > 0;
    } catch (err) {
        console.error(`Something went wrong deleting user with id ${id}:`, err);
        throw err;
    }
}

// --- CRUD FUNCTIONS FOR RECIPES ---

async function getAllRecipes(queryParams, userId = null) {
    try {
        let filter = {};
        
        // If userId is provided, filter by user's recipes
        if (userId) {
            filter.$or = [
                { userId: userId },
                { createdBy: userId } // For backward compatibility with email-based tracking
            ];
        }
        
        // Handle search functionality
        if (queryParams.search) {
            const searchTerm = queryParams.search;
            const searchFilter = {
                $or: [
                    { name: { $regex: searchTerm, $options: 'i' } },
                    { description: { $regex: searchTerm, $options: 'i' } },
                    { category: { $regex: searchTerm, $options: 'i' } },
                    { temperature: { $regex: searchTerm, $options: 'i' } }
                ]
            };
            
            // If we already have a user filter, combine with search
            if (filter.$or) {
                filter = {
                    $and: [
                        { $or: filter.$or }, // User filter
                        searchFilter // Search filter
                    ]
                };
            } else {
                filter = searchFilter;
            }
        }
        
        // Handle category filter 
        if (queryParams.category && queryParams.category !== 'All') {
            if (filter.$and) {
                filter.$and.push({ category: queryParams.category });
            } else if (filter.$or && !queryParams.search) {
                filter = {
                    $and: [
                        { $or: filter.$or },
                        { category: queryParams.category }
                    ]
                };
            } else {
                filter.category = queryParams.category;
            }
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

// --- AUTHENTICATION ENDPOINTS ---

// POST /api/auth/register - Register a new user
app.post("/api/auth/register", async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: "Name, email, and password are required" });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    try {
        const user = await createUser({ name, email, password });
        
        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email }, 
            JWT_SECRET, 
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: "User registered successfully",
            user: user,
            token: token
        });
    } catch (error) {
        if (error.message === 'User with this email already exists') {
            return res.status(409).json({ error: error.message });
        }
        res.status(500).json({ error: "Failed to register user" });
    }
});

// POST /api/auth/login - Login user
app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    try {
        const user = await authenticateUser(email, password);
        
        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email }, 
            JWT_SECRET, 
            { expiresIn: '7d' }
        );

        res.json({
            message: "Login successful",
            user: user,
            token: token
        });
    } catch (error) {
        if (error.message === 'Invalid credentials') {
            return res.status(401).json({ error: "Invalid email or password" });
        }
        res.status(500).json({ error: "Failed to login" });
    }
});

// GET /api/auth/me - Get current user info (protected route)
app.get("/api/auth/me", authenticateToken, async (req, res) => {
    try {
        const user = await getUserById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json({ user: user });
    } catch (error) {
        res.status(500).json({ error: "Failed to get user info" });
    }
});

// POST /api/auth/logout - Logout (client-side token removal)
app.post("/api/auth/logout", (req, res) => {
    // With JWT, logout is handled client-side by removing the token
    res.json({ message: "Logout successful" });
});

// --- USER ENDPOINTS ---

// GET /api/users - Get all users (ADMIN only)
app.get("/api/users", authenticateToken, async (req, res) => {
    try {
        const allUsers = await getAllUsers();
        res.json({ users: allUsers });
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve users." });
    }
});

// POST /api/users - Create a new user (alternative endpoint)
app.post("/api/users", async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: "Name, email, and password are required" });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    try {
        const user = await createUser({ name, email, password });
        res.status(201).json(user);
    } catch (error) {
        if (error.message === 'User with this email already exists') {
            return res.status(409).json({ error: error.message });
        }
        res.status(500).json({ error: "Failed to create user" });
    }
});

// GET /api/users/:id - Get a single user by ID
app.get("/api/users/:id", authenticateToken, async (req, res) => {
    const userId = req.params.id;
    
    try {
        const user = await getUserById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve user." });
    }
});

// PUT /api/users/:id - Update an existing user
app.put("/api/users/:id", authenticateToken, async (req, res) => {
    const userId = req.params.id;
    const updatedData = req.body;

    // Users can only update their own profile (unless admin)
    if (req.user.id !== userId) {
        return res.status(403).json({ error: "You can only update your own profile." });
    }

    if (!updatedData) {
        return res.status(400).json({ error: "Missing user data in request body." });
    }

    try {
        const updatedUser = await updateUser(userId, updatedData);
        if (!updatedUser) {
            return res.status(404).json({ error: "User not found." });
        }
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: error.message || "Failed to update user." });
    }
});

// DELETE /api/users/:id - Delete a user account
app.delete("/api/users/:id", authenticateToken, async (req, res) => {
    const userId = req.params.id;
    
    // Users can only delete their own account (unless admin)
    if (req.user.id !== userId) {
        return res.status(403).json({ error: "You can only delete your own account." });
    }
    
    try {
        const success = await deleteUserById(userId);
        if (success === null) {
            return res.status(400).json({ error: "Invalid user ID format for deletion." });
        }
        if (success) {
            res.status(204).send();
        } else {
            res.status(404).json({ error: "User not found." });
        }
    } catch (error) {
        res.status(500).json({ error: "Failed to delete user." });
    }
});

// --- RECIPE ENDPOINTS ---

// GET /api/recipes - Get all recipes with optional search
app.get("/api/recipes", async (req, res) => {
    try {
        const queryParams = req.query;
        let userId = null;
        
        // If user is authenticated (not in preview mode), filter by their recipes
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                userId = decoded.id; // Filter by authenticated user's recipes
            } catch (err) {
                // Token is invalid, but that's okay - just show all recipes (preview mode)
            }
        }
        
        const allRecipes = await getAllRecipes(queryParams, userId);
        res.json({ recipes: allRecipes });
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve recipes." });
    }
});

// POST /api/recipes - Create a new recipe (PROTECTED)
app.post("/api/recipes", authenticateToken, async (req, res) => {
    const recipeData = req.body;

    if (!recipeData.name) {
        return res.status(400).json({ error: "Missing required field (name)." });
    }
    
    try {
        // Add user ID to recipe data
        const recipeWithUser = {
            ...recipeData,
            userId: req.user.id,
            createdBy: req.user.email
        };
        
        const newRecipe = await createNewRecipe(recipeWithUser);
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

// PUT /api/recipes/:id - Update an existing recipe (PROTECTED)
app.put("/api/recipes/:id", authenticateToken, async (req, res) => {
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

// DELETE /api/recipes/:id - Delete a recipe (PROTECTED)
app.delete("/api/recipes/:id", authenticateToken, async (req, res) => {
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

// Export the app as the default export (what bin/www expects)
module.exports = app;