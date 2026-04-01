require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { getDatabaseConfig } = require('../config/databaseConfig');

const pool = new Pool(getDatabaseConfig());

async function seed() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        console.log('Seeding database...');

        // Admin user
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const userResult = await client.query(
            `INSERT INTO users (name, email, password, role)
       VALUES ('Admin User', 'admin@inventory.com', $1, 'admin')
       ON CONFLICT (email) DO NOTHING RETURNING id`,
            [hashedPassword]
        );

        // Sample supplier
        const supplierResult = await client.query(
            `INSERT INTO suppliers (name, email, phone, address)
       VALUES ('TechParts Ltd', 'supplier@techparts.com', '+1-555-0100', '123 Supply Street, Industry City')
       ON CONFLICT (email) DO NOTHING RETURNING id`
        );

        // Get supplier ID
        const suppRes = await client.query(
            `SELECT id FROM suppliers WHERE email = 'supplier@techparts.com'`
        );
        const supplierId = suppRes.rows[0]?.id;

        if (supplierId) {
            // Sample items
            const items = [
                { name: 'USB-C Cables', category: 'Electronics', qty: 45, price: 12.99, location: 'Shelf A1' },
                { name: 'Wireless Mouse', category: 'Electronics', qty: 8, price: 29.99, location: 'Shelf A2' },
                { name: 'Printer Paper', category: 'Office Supplies', qty: 200, price: 5.49, location: 'Shelf B1' },
                { name: 'Hand Sanitizer', category: 'Hygiene', qty: 5, price: 3.99, location: 'Cabinet C1' },
                { name: 'HDMI Cables', category: 'Electronics', qty: 0, price: 15.99, location: 'Shelf A3' },
                { name: 'Sticky Notes', category: 'Office Supplies', qty: 150, price: 2.99, location: 'Shelf B2' },
                { name: 'Ethernet Cable 5m', category: 'Electronics', qty: 9, price: 8.99, location: 'Shelf A4' },
                { name: 'Ballpoint Pens (box)', category: 'Office Supplies', qty: 60, price: 6.49, location: 'Shelf B3' },
            ];

            for (const item of items) {
                const status = item.qty === 0 ? 'out_of_stock' : 'available';
                await client.query(
                    `INSERT INTO items (name, category, quantity, price, supplier_id, location, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT DO NOTHING`,
                    [item.name, item.category, item.qty, item.price, supplierId, item.location, status]
                );
            }
        }

        await client.query('COMMIT');
        console.log('✅ Database seeded successfully!');
        console.log('   Admin login: admin@inventory.com / admin123');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Seed failed:', err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

seed();
