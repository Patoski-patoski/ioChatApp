// config.js
import dotenv from 'dotenv';
import nodemailer from "nodemailer";

const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
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
    },
    redis: {
        username: process.env.REDIS_USERNAME || 'default',
        url: process.env.REDIS_URL,
        token: process.env.REDIS_REST_TOKEN,
        port: process.env.REDIS_PORT || '6379',
        tls: isProd ? {} : undefined
    },
    server: {
        port: process.env.PORT || 3000,
        hostname: process.env.HOSTNAME,
        trustProxy: isProd, //Enable behind a reverse proxy (heroku, render, vercel)
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
    security: {
        cors: {
            origin: isProd ? process.env.ALLOWED_ORIGINS?.split(',') : '*',
            credentials: true,
            methods: ['GET', 'POST'],
            exposedHeaders: ['Content-Range'],
            maxAge: 3600
        },
        rateLimit: {
            windowMs: 10 * 60 * 1000,
            max: 30,
            skipSuccessfulRequests: true,
            message: "To many requests, Please try again later",
            keyGenerator: (req, res) => {
                // Use X-Forwarded-For header if trust proxy is set
                return req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            }
        },
        helmet: {
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: [
                        "'self'",
                        "https://cdn.jsdelivr.net/",
                        "https://cdnjs.cloudflare.com",
                        "'unsafe-inline'",
                    ],
                    fontSrc: [
                        "'self'",
                        "https://fonts.googleapis.com",
                        "https://fonts.gstatic.com",
                    ],
                    styleSrc: [
                        "'self'",
                        "https://cdn.jsdelivr.net/",
                        "https://fonts.googleapis.com/",
                        "'unsafe-inline'"
                    ]
                }
            }
        }
    },
    environment: process.env.NODE_ENV || 'production',
}

