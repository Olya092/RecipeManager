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

  if (event.httpMethod !== 'DELETE') {
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
    const result = await collection.deleteOne({ _id: new ObjectId(recipeId) });
    
    if (result.deletedCount === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Recipe not found' }),
      };
    }
    
    return {
      statusCode: 204,
      headers,
      body: '',
    };
  } catch (error) {
    console.error('Error deleting recipe:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to delete recipe' }),
    };
  }
};