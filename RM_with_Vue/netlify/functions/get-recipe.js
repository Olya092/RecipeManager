const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

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

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const pathParts = event.path.split('/');
    const recipeId = pathParts[pathParts.length - 1];
    
    if (!ObjectId.isValid(recipeId)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid recipe ID format' }),
      };
    }

    const collection = await connectToDatabase();
    const recipe = await collection.findOne({ _id: new ObjectId(recipeId) });
    
    if (!recipe) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Recipe not found' }),
      };
    }
    
    // Transform _id to id for frontend compatibility
    const { _id, ...rest } = recipe;
    const responseRecipe = {
      ...rest,
      id: _id.toString()
    };
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(responseRecipe),
    };
  } catch (error) {
    console.error('Error fetching recipe:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to retrieve recipe' }),
    };
  }
};