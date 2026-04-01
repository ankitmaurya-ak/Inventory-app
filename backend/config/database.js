const { Pool } = require('pg');
const { getDatabaseConfig } = require('./databaseConfig');

const pool = new Pool({
    ...getDatabaseConfig(),
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL error:', err);
});

pool.on('connect', () => {
    // Uncomment for debugging:
    // console.log('New DB connection established');
});

/**
 * Execute a query with optional parameters.
 * @param {string} text - SQL query string
 * @param {Array} params - Query parameters
 */
const query = (text, params) => pool.query(text, params);

/**
 * Get a pooled client for transactions.
 */
const getClient = () => pool.connect();

module.exports = { query, getClient, pool };
