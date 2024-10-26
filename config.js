// config.js
import dotenv from 'dotenv';

dotenv.config();

export default {
    mongodb: {
        url: process.env.MONGODB_URI_ATLAS,
        dbName: 'chatapp'
    },
    redis: {
        username: process.env.REDIS_USERNAME || 'default',
        url: process.env.REDIS_URL,
        token: process.env.REDIS_REST_TOKEN,
        port: process.env.REDIS_PORT || '6379'
    },
    server: {
        port: process.env.PORT || 3000,
        hostname: process.env.HOSTNAME,
    },
    session: {
        secret: process.env.SESSION_SECRET,
        cookie: {
            maxAge: 12 * 60 * 60 * 1000, /* 12 hours */
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            sameSite: process.env.NODE_ENV === 'production' ? 'none': 'lax'
        }
    },
    environment: process.env.NODE_ENV === 'development',
}