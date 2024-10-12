// routes/database.js
import dotenv from 'dotenv';
import { createClient } from 'redis';
import { MongoClient } from 'mongodb';
import RedisStore from 'connect-redis';
import session from 'express-session';


dotenv.config();

// Mongodb configurations
let client;
const mongoUrl = process.env.MONGODB_URI || "mongodb://localhost/chatapp";

export async function connectToDataBase() {
  if (!client) {
    client = new MongoClient(mongoUrl);
    await client.connect();
  }
}

export function getClient() {
  if (!client) {
    throw new Error('Database not connected. Call connectToDataBase first.');
  }
  return client;
}














// Redis configurations
// const redisClient = createClient();

// redisClient.on('connect', () => {
//   console.log('Connected to Redis');
// });

// redisClient.on('error', () => {
//   console.error('Redis error: ', err);
// });

// const redisStore = new RedisStore({
//   client: redisClient,
// });


