require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { getDatabaseConfig } = require('../config/databaseConfig');

const pool = new Pool(getDatabaseConfig());

async function migrate() {
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    try {
        console.log('Running migrations...');
        await pool.query(sql);
        console.log('✅ All tables created successfully!');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

migrate();
