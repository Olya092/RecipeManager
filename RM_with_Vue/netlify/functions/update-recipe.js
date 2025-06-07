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

  if (event.httpMethod !== 'PUT') {
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

    const updatedData = JSON.parse(event.body);
    const collection = await connectToDatabase();
    
    const { _id, id, ...cleanData } = updatedData;
    
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(recipeId) },
      {
        $set: {
          ...cleanData,
          lastModified: new Date()
        }
      },
      { returnDocument: 'after' }
    );
    
    if (!result) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Recipe not found' }),
      };
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('Error updating recipe:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to update recipe' }),
    };
  }
};