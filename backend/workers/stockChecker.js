const { Worker } = require('bullmq');
const { createBullMQConnection } = require('../config/redis');
const { getLowStockItems } = require('../services/inventoryService');
const { checkAndAlertLowStock } = require('../services/notificationService');
const { QUEUE_NAME } = require('./queue');

let ioRef = null;

const startStockCheckerWorker = (io = null) => {
    ioRef = io;

    const worker = new Worker(
        QUEUE_NAME,
        async (job) => {
            if (job.name !== 'stock-check') return;
            const isManual = job.data?.manual === true;

            console.log(`[Worker] 🔍 Running stock check at ${new Date().toISOString()}`);
            const lowStockItems = await getLowStockItems();

            if (lowStockItems.length === 0) {
                console.log('[Worker] ✅ All stock levels are healthy.');
                return;
            }

            console.log(`[Worker] ⚠️  Found ${lowStockItems.length} low-stock item(s). Processing alerts...`);

            for (const item of lowStockItems) {
                await checkAndAlertLowStock(item, ioRef, isManual);
            }

            console.log('[Worker] ✅ Stock check complete.');
        },
        {
            connection: createBullMQConnection(),
            concurrency: 1,
        }
    );

    worker.on('completed', (job) => {
        console.log(`[Worker] Job ${job.id} completed`);
    });

    worker.on('failed', (job, err) => {
        console.error(`[Worker] Job ${job?.id} failed: ${err.message}`);
    });

    return worker;
};

module.exports = { startStockCheckerWorker };
