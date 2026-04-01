require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { getDatabaseConfig } = require('../config/databaseConfig');

const pool = new Pool(getDatabaseConfig());

async function migrateStores() {
    const sqlPath = path.join(__dirname, '../database/migrate_stores.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    try {
        console.log('Running stores migration...');
        await pool.query(sql);
        console.log('✅ Stores migration complete!');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

migrateStores();
