const getDatabaseConfig = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    const shouldUseSsl =
        process.env.DATABASE_SSL === 'true' ||
        (isProduction && process.env.DATABASE_SSL !== 'false');

    return {
        connectionString: process.env.DATABASE_URL,
        ssl: shouldUseSsl ? { rejectUnauthorized: false } : false,
    };
};

module.exports = { getDatabaseConfig };
