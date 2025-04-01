const pool = require('../db'); // Import MariaDB connection
const fs = require('fs');

async function getSchema() {
    let connection;

    try {
        connection = await pool.getConnection(); // Get a connection from the pool
        const dbResult = await connection.query("SELECT DATABASE() AS db;");
        console.log("Database Query Result:", dbResult); // Debugging

        // Ensure dbResult is not empty and correctly structured
        if (!dbResult || dbResult.length === 0 || !dbResult[0].db) {
            throw new Error("Failed to retrieve the database name dynamically.");
        }

        const dbName = dbResult[0].db; // Extract the database name
        console.log(`Using Database: ${dbName}`);


        // Query to get tables and columns
        const tables = await connection.query(
            `SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, COLUMN_KEY 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = ?`, [dbName] // In MariaDB, pool.database gives the DB name
        );

        // Query to get foreign keys (relationships)
        const foreignKeys = await connection.query(
            `SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
         FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
         WHERE TABLE_SCHEMA = ? AND REFERENCED_TABLE_NAME IS NOT NULL`, [dbName]
        );

        // Combine schema into a JSON file
        const schema = { tables, foreignKeys };
        fs.writeFileSync('schema.json', JSON.stringify(schema, null, 2));

        console.log("Schema saved as schema.json");
    } catch (error) {
        console.error("Error fetching schema:", error);
    } finally {
        if (connection) connection.release(); // Release connection back to the pool
    }
}

module.exports = getSchema;
getSchema();
