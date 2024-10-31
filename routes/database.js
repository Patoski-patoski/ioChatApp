// routes/database.js
import { createClient } from 'redis';
import { MongoClient } from 'mongodb';
import RedisStore from 'connect-redis';
import config from '../config.js';

// Mongodb configurations
let client = null;

export async function connectToDataBase() {
  if (!client) {
    try {
      client = new MongoClient(config.mongodb.url, {
        // ssl: true,
        // tls: true,
        // tlsAllowInvalidCertificates: false,
        // retryWrites: true,
        // minPoolSize: 5,
        // maxPoolSize: 50,
      });
      await client.connect();
      //Send a ping to confirm successsful connection
      await client.db(config.mongodb.dbName).command({ ping: 1 });
      console.log('MongoDB ATLAS Connected');
      return client;
    } catch (error) {
      console.error('MongoDB connection error:', error);
      if (client) {
        await client.close();
        client = null;
      }
      throw error  /* Re-throw to allow handling in app.js */
    }
  }
  return client;
}
export function getClient() {
  if (!client) {
    throw new Error('Database not connected. Call connectToDataBase() first.');
  }
  return client;
}

export async function closeConnection() {
  if (client) {
    await client.close();
    client = null;
    console.log('MongoDB connection closed');
  }
}


/* Redis configurations */
export const redisClient = createClient({
  url: `redis://${config.redis.username}:${config.redis.token}@${config.redis.url}:${config.redis.port}`,
  socket: {
    tls: true,
    rejectUnauthorized: false
  }
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

redisClient.on('error', (error) => {
  console.error('Redis Connection Error:', error);
  setTimeout(() => {
    console.log('Attempting to reconnect to Redis...');
    redisClient.connect();
  }, 5000); // retry after 5 seconds
});


export async function connectRedis() {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }

    //Test the connection
    await redisClient.set('test', 'connection');
    const testValue = await redisClient.get('test');
    console.log('Redis test value:', testValue);

    return true
  } catch (error) {
    console.error('Redis connection error: ', error);
    throw error;
  }
}

export const redisStore = new RedisStore({
  client: redisClient,
  prefix: "appSession",
  ttl: 86400,
});


process.on('SIGINT', async () => {
  try {
    await closeConnection();
    await redisClient.quit();
    console.log('Connections closed gracefully');
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
});