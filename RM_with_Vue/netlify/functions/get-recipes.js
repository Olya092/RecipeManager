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

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const collection = await connectToDatabase();
    
    const queryParams = event.queryStringParameters || {};
    let filter = {};
    
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
    
    if (queryParams.category && queryParams.category !== 'All') {
      filter.category = queryParams.category;
    }
    
    const recipes = await collection.find(filter).toArray();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ recipes }),
    };
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to retrieve recipes' }),
    };
  }
};