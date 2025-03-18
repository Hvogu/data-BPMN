const pool = require('./db'); // Import MariaDB connection

async function fetchTable(tableName) {
    let conn;
    try {
        conn = await pool.getConnection(); // Get a connection
        const rows = await conn.query("SELECT * FROM " + tableName); // Query database
        console.log("" + tableName + ":", rows); // Display the result

        return rows; // Return the data
    } catch (err) {
        console.error("Database query error:", err);
    } finally {
        if (conn) conn.release(); // Release the connection
    }
}

async function addEmployee(name, email, date_of_birth, position) {
    let conn;
    try {
        conn = await pool.getConnection(); // Get a connection
        const query = "INSERT INTO employee (name, email, date_of_birth, position) VALUES (?, ?, ?, ?)";
        const result = await conn.query(query, [name, email, date_of_birth, position]);

        console.log(" Employee Added Successfully! Inserted ID:", result.insertId);
        return { success: true, id: result.insertId };
    } catch (err) {
        console.error(" Error inserting employee:", err);
        return { success: false, error: err.message };
    } finally {
        if (conn) conn.release(); // Release the connection
    }
}





async function addToTable(tableName, data) {
    let conn;
    try {
        conn = await pool.getConnection(); // Get a connection

        // Extract column names and values dynamically
        const columns = Object.keys(data).join(', '); // Convert object keys to column names
        const placeholders = Object.keys(data).map(() => '?').join(', '); // Generate placeholders (?,?,?,?)
        const values = Object.values(data); // Extract values dynamically

        // Construct the SQL query
        const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`;
        const result = await conn.query(query, values);
        console.log("success");

        return { success: true, id: result.insertId };
    } catch (err) {
        console.error(` Error inserting into ${tableName}:`, err);
        return { success: false, error: err.message };
    } finally {
        if (conn) conn.release(); // Release the connection
    }
}


async function deleteFromTable(tableName, parameter, value) {
    let conn;
    try {

        conn = await pool.getConnection(); // Get a connection
        const query = `DELETE FROM ${tableName} WHERE ${parameter} = ?`;
        const result = await conn.query(query, [value]); // Execute the query

        console.log(` Deleted ${result.affectedRows} rows from ${tableName}`);
        return { success: true, rowsDeleted: result.affectedRows };
    } catch (err) {
        console.error(` Error deleting from ${tableName}:`, err);
        return { success: false, error: err.message };
    } finally {
        if (conn) conn.release(); // Release the connection
    }

}
const newEmployee = {
    name: 'John boeman',
    email: 'johnboeman1234@gmail.com',
    date_of_birth: '1990-10-10',
    position: 'Developer'
};

//addToTable('employee', newEmployee);
deleteFromTable('employee', 'id', 8);
//fetchTable('employee');