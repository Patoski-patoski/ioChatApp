// routes/database.js
import { createClient } from 'redis';
import { MongoClient } from 'mongodb';
import RedisStore from 'connect-redis';
import config from '../config.js';


// Mongodb configurations
let client;

export async function connectToDataBase() {
  if (!client) {
    try {
      client = new MongoClient(config.mongodb.url);
      await client.connect();
      console.log('MongoDB Connected');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error  /* Re-throw to allow handling in app.js */
    }
  }
}
export function getClient() {
  if (!client) {
    throw new Error('Database not connected. Call connectToDataBase() first.');
  }
  return client;
}

/* Redis configurations */
export const redisClient = createClient({
  url: config.redis.url
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

redisClient.on('error', () => {
  console.error('Redis error: ', err);
});

export async function connectRedis() {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('Redis connection error: ', error);
    throw error;
  }
}

export const redisStore = new RedisStore({
  client: redisClient,
});
