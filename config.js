import dotenv from 'dotenv';

dotenv.config();

export default {
    mongodb: {
        url: process.env.MONGODB_URI || "mongodb://localhost/chatapp",
        dbName: 'chatapp'
    },
    redis: {
        username: process.env.REDIS_USERNAME,
        url: process.env.REDIS_URL,
        token: process.env.REDIS_REST_TOKEN,
        port: process.env.REDIS_PORT
    },
    server: {
        port: process.env.PORT || 3000,
        hostname: process.env.HOSTNAME || 'localhost',
    },
    session: {
        secret: process.env.SESSION_SECRET,
        cookie: {
            maxAge: 12 * 60 * 60 * 1000, /* estimated 12 hours */
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
        }
    },
    environment: process.env.NODE_ENV === 'development',
}