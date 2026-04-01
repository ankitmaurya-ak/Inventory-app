const Redis = require('ioredis');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    retryStrategy: (times) => {
        if (times > 10) {
            console.error('Redis: Could not connect after 10 retries');
            return null;
        }
        return Math.min(times * 200, 3000);
    },
});

redisClient.on('connect', () => console.log('✅ Redis connected'));
redisClient.on('error', (err) => console.error('❌ Redis error:', err.message));

// Separate connection for BullMQ (it requires its own Redis connection)
const createBullMQConnection = () =>
    new Redis(redisUrl, { maxRetriesPerRequest: null });

module.exports = { redisClient, createBullMQConnection };
