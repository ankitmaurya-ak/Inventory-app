const { scheduleStockChecks } = require('./queue');
const { startStockCheckerWorker } = require('./stockChecker');

let io = null;

const startWorkers = (socketIo = null) => {
    io = socketIo;
    startStockCheckerWorker(io);
    scheduleStockChecks().catch(console.error);
    console.log('[Workers] All background workers started.');
};

module.exports = { startWorkers };

if (require.main === module) {
    startWorkers();
}
