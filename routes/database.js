// routes/database.js
import { createClient } from 'redis';
import RedisStore from 'connect-redis';
import config from '../config.js';
import mongoose from 'mongoose';

// Mongodb configurations
export async function connectToDataBase() {
  try {
    await mongoose.connect(config.mongodb.url, {
      dbName: config.mongodb.dbName
    });
    console.log('MongoDB Mongoose Connected');
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // process.exit(1);
    throw error;
  }
}

export function getMongoose() {
  return mongoose;
}

export async function closeConnection() {
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
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