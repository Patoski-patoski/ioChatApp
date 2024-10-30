// config.js
import dotenv from 'dotenv';

const isProd = process.env.NODE_ENV === 'production';

if (isProd){
    dotenv.config();
}

const getSessionSecret = () => {
    // Ensure a secret is set
    if (!process.env.SESSION_SECRET) {
        if (isProd) {
            throw new Error('Production SESSION_SECRET must be set');
        }
        // Fallback for development only
        return 'dev-default-secret-do-not-use-in-production';
    }
    return process.env.SESSION_SECRET;
};

export default {
    mongodb: {
        url: process.env.MONGODB_URI_ATLAS,
        dbName: 'chatapp',
        options: {
            maxPoolSize: 10,
            serverSelectionTimeOutMS: 10000,
            socketTimeOut: 120000
        }
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
        secret: getSessionSecret(),
        name: 'sessionId',
        cookie: {
            maxAge: 12 * 60 * 60 * 1000, /* 12 hours */
            secure: isProd,
            httpOnly: true,
            sameSite: isProd ? 'none' : 'lax',
            domain: isProd ? process.env.COOKIE_DOMAIN : undefined,
        },
        rolling: true,
    },
    environment: process.env.NODE_ENV === 'development',
}