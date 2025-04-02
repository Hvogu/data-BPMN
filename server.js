const pool = require('./db'); // Import MariaDB connection
const express = require('express');
const getSchema = require('./ERD-diagram/getSchema');
const generateErd = require('./ERD-diagram/generateErd');
const cors = require('cors');
const path = require('path');

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

async function getTableColumns(tableName) {
    let conn;
    try {
        conn = await pool.getConnection(); // Get a connection
        const query = `SELECT COLUMN_NAME, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ? AND TABLE_SCHEMA = DATABASE()`;
        const result = await conn.query(query, [tableName]); // Execute the query
        console.log(result.map(row => ({
            column: row.COLUMN_NAME,
            type: row.COLUMN_TYPE
        }))); // Extract column names)
        return result.map(row => ({
            column: row.COLUMN_NAME,
            type: row.COLUMN_TYPE
        })); // Extract column names
    } catch (error) {
        console.error(` Error fetching columns for ${tableName}:`, error);
        return { success: false, error: error.message };
    } finally {
        if (conn) conn.release(); // Release the connection
    }
}

async function getPrimaryKey(tableName) {
    try {
        conn = await pool.getConnection(); // Get a connection
        const query = `
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
        WHERE TABLE_NAME = ?
          AND CONSTRAINT_NAME = 'PRIMARY'
          AND TABLE_SCHEMA = DATABASE()`;

        const result = await conn.query(query, [tableName]); // Execute the query
        console.log(result.map(row => ({ primaryKey: row.COLUMN_NAME }))); // Extract column names)
        return result.map(row => ({ primaryKey: row.COLUMN_NAME })); // Extract column names     
    } catch (error) {
        console.error(` Error fetching primary key for ${tableName}:`, error);
        return [];
    } finally {
        if (conn) conn.release(); // Release the connection
    }
}

async function createProc(tableName, key, conditions, variableChange) {
    const columnNamesAndTypes = await getTableColumns(tableName)
    let proc = "DROP PROCEDURE IF EXISTS UPDATE \n" + "CREATE PROCEDURE UPDATE \n" + "BEGIN \n"
    //declaring local variables
    columnNamesAndTypes.forEach(({ column, type }) => {
        proc += "DECLARE local" + column + " " + type + ";\n"
    })

    //making the case statement(s)
    proc += "SELECT \n"
    for (let i = 0; i < columnNamesAndTypes.length; i++) {
        //making a case for each column in the row
        proc += "CASE \n"
        for (let j = 0; j < conditions.length; j++) {
            //checking conditions for each column in a row one at a time
            proc += "WHEN " + conditions[j] + " THEN " + variableChange[j][i] + " \n"

        }

        if (conditions.length < variableChange.length) {
            //if this is true that means an else statement is intended
            proc += "ELSE " + variableChange[conditions.length][i] + " \n"
        } else {
            //otherwise set the else to make the value go back to the original value if no else has been made 
            proc += "ELSE "
            proc += columnNamesAndTypes[i].column + " \n"
        }
        proc += "END AS temp" + i + "\n";
    }

    proc += "INTO"
    columnNamesAndTypes.forEach(({ column, type }) => {
        //putting values into the local variables
        proc += " local" + column + ", "
    })
    proc = proc.slice(0, -2) // Remove the last comma and space
    proc += "\n"
    proc += "FROM " + tableName + " \n"
    proc += "WHERE "
    key.forEach(({ primaryKey }) => {
        //meant to be able to handle multiple primary keys
        proc += primaryKey + "=1 AND "
    })
    proc = proc.slice(0, -5)
    proc += "\n"
    proc += "INSERT INTO " + tableName + " VALUES ( "
    columnNamesAndTypes.forEach(({ column, type }) => {
        //making placeholder values for the insert statement
        proc += column + ", "
    })
    proc = proc.slice(0, -2)
    proc += ") ON DUPLICATE KEY UPDATE "
    columnNamesAndTypes.forEach(({ column, type }) => {
        //updating the values in the table if a duplicate key is found(intended for update)
        proc += column + " = local" + column + ", "
    });
    proc = proc.slice(0, -2)
    proc += "\n" + "END | \n "
    return proc;
}



async function updateTable(tableName, conditions, variableChange) {
    let conn;
    try {
        const primaryKey = await getPrimaryKey(tableName)
        const proc = await createProc(tableName, primaryKey, conditions, variableChange)
        console.log(proc);
        // conn = await pool.getConnection(); // Get a connection
        // await conn.query(proc); // Execute the query
        // console.log("Procedure created successfully.");

    } catch (error) {
        console.error(` Error creating procedure for ${tableName}:`, error);
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



const app = express();
const corsOptions = {
    origin: 'http://localhost:8080', // Replace with your frontend's domain and port
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
};

app.use(cors(corsOptions));


app.use(express.static(path.join(__dirname, 'NewWindowsHTML')));



app.get('/api/generate-erd', async (req, res) => {
    try {
        console.log("🛠️ Generating schema and ERD...");
        await getSchema();        // Step 1: Create schema.json
        await generateErd();      // Step 2: Generate erd-diagram.svg
        res.status(200).json({ success: true, message: 'ERD generated successfully' });
    } catch (error) {
        console.error("❌ Failed to generate ERD:", error);
        res.status(500).json({ success: false, message: 'Error generating ERD' });
    }
});

app.get('/erd', (req, res) => {
    res.sendFile(__dirname + '/ERD-diagram/erd-diagram.svg');
});

app.get('/api/allTables', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const dbResult = await conn.query("SELECT DATABASE() AS db");
        const dbName = dbResult[0].db;

        const tables = await conn.query(
            `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?`,
            [dbName]
        );

        const tableNames = tables.map(t => t.TABLE_NAME);
        res.json(tableNames);
    } catch (err) {
        console.error("❌ Error fetching tables:", err);
        res.status(500).json({ error: "Failed to retrieve table names" });
    } finally {
        if (conn) conn.release();
    }
});

app.get('/api/table/:name', async (req, res) => {
    const tableName = req.params.name;
    try {
        const conn = await pool.getConnection();
        const rows = await conn.query(`SELECT * FROM \`${tableName}\``);
        conn.release();
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch table data' });
    }
});


// app.listen(3000, () => {
//     console.log(`Server is running on port 3000`);
// });

const conditions = ["Capacity>100", "Capacity<80", `Location="Pine Street"`]
const variableChange = [["Centerid=10", "Location=Main Street", "Capacity=1000"], ["CenterID=20", "Location=Jesper Street", "Capacity=802"], ["CenterID=30", `Location="Main Street"`, "Capacity=200"], ["CenterID=40", `Location="Else Street"`, "Capacity=400"]];
updateTable("Center", conditions, variableChange);
getTableColumns("Center");