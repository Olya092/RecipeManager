const { MongoClient, ServerApiVersion } = require('mongodb');

const connectToDatabase = async () => {
  const client = new MongoClient(process.env.MONGODB_CONNECTION_STRING, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });
  
  await client.connect();
  return client.db("RM_backend").collection("recipes");
};

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const recipeData = JSON.parse(event.body);
    
    if (!recipeData.name) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required field (name)' }),
      };
    }

    const collection = await connectToDatabase();
    
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
    
    const result = await collection.insertOne(newRecipe);
    
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(newRecipe),
    };
  } catch (error) {
    console.error('Error creating recipe:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to create recipe' }),
    };
  }
};