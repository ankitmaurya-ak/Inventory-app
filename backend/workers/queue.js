const { Queue, Worker, QueueScheduler } = require('bullmq');
const { createBullMQConnection } = require('../config/redis');

const QUEUE_NAME = 'inventory-checks';

// Create the queue
const inventoryQueue = new Queue(QUEUE_NAME, {
    connection: createBullMQConnection(),
    defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 20,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
    },
});

// Schedule recurring stock check every 5 minutes
const scheduleStockChecks = async () => {
    // Remove existing repeatable job first
    const repeatableJobs = await inventoryQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
        if (job.name === 'stock-check') {
            await inventoryQueue.removeRepeatableByKey(job.key);
        }
    }

    await inventoryQueue.add(
        'stock-check',
        { triggeredAt: new Date().toISOString() },
        { repeat: { every: 5 * 60 * 1000 } } // Every 5 minutes
    );
    console.log('[Worker] ⏰ Stock check scheduled every 5 minutes');
};

module.exports = { inventoryQueue, scheduleStockChecks, QUEUE_NAME };
