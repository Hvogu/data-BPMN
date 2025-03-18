const mariadb = require('mariadb');



const pool = mariadb.createPool({
    host: 'localhost',       // Corrected: Only the host (without port and DB name)
    port: 3306,              // Port is specified separately
    user: 'root',            // Your MariaDB username
    password: 'bananjesper33', // Your MariaDB password
    database: 'TestCompanyBPMN', // Your database name
    connectionLimit: 10,     // Increased connection limit
    acquireTimeout: 20000,   // Increased timeout (20 sec)
});




async function testConnection() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log("✅ Successfully connected to MariaDB!");
        const rows = await conn.query("SELECT NOW() as time");
        console.log("Current Time:", rows[0].time);
    } catch (err) {
        console.error("❌ Database connection error:", err);
    } finally {
        if (conn) conn.release(); // Release connection back to pool
    }
}

testConnection();

module.exports = pool;
