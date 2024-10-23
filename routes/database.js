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
  url: `redis://${config.redis.username}:${config.redis.token}@${config.redis.url}:${config.redis.port}`,
  socket: {
    tls: true,
    rejectUnauthorized: false
  }
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

redisClient.on('error', (err) => {
  console.error('Redis error: ', err);
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
