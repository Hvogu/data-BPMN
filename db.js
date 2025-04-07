const mariadb = require('mariadb');
const { col } = require('sequelize');


let pool = null;
// const pool = mariadb.createPool({
//     host: 'localhost',       // Corrected: Only the host (without port and DB name)
//     port: 3306,              // Port is specified separately
//     user: 'root',            // Your MariaDB username
//     password: 'bananjesper33', // Your MariaDB password
//     database: 'jespersgym', // Your database name
//     connectionLimit: 10,     // Increased connection limit
//     acquireTimeout: 20000,   // Increased timeout (20 sec)

// });
console.log("Connecting to MariaDB...")

function createMDBPool(host, port, user, password, database) {
    pool = mariadb.createPool({
        host: host,
        port: port,
        user: user,
        password: password,
        database: database,
        connectionLimit: 10, // Connection limit
        acquireTimeout: 20000 // Timeout in milliseconds
    });
    console.log("Connected to MariaDB!");
}

function getPool() {
    if (!pool) {
        throw new Error("❌ Pool has not been created yet. Call createPool() first.");
    }
    return pool; // Return the pool object for use in other modules
}







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
        SELECT k.COLUMN_NAME, c.COLUMN_TYPE
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE k
        JOIN INFORMATION_SCHEMA.COLUMNS c
          ON k.TABLE_NAME = c.TABLE_NAME
          AND k.COLUMN_NAME = c.COLUMN_NAME
          AND k.TABLE_SCHEMA = c.TABLE_SCHEMA
        WHERE k.TABLE_NAME = ?
          AND k.CONSTRAINT_NAME = 'PRIMARY'
          AND k.TABLE_SCHEMA = DATABASE();
      `;

        const result = await conn.query(query, [tableName]); // Execute the query
        console.log(result.map(row => ({
            primaryKey: row.COLUMN_NAME,
            type: row.COLUMN_TYPE
        }))); // Extract column names)
        return result.map(row => ({
            primaryKey: row.COLUMN_NAME,
            type: row.COLUMN_TYPE
        })); // Extract column names     
    } catch (error) {
        console.error(` Error fetching primary key for ${tableName}:`, error);
        return [];
    } finally {
        if (conn) conn.release(); // Release the connection
    }
}

function columnPartOfPrimaryKey(column, primaryKey) {
    for (let i = 0; i < primaryKey.length; i++) {
        if (primaryKey[i].primaryKey === column) {
            return true;
        }
    }
    return false;
}

async function createProc(tableName, key, conditions, variableChange) {
    const columnNamesAndTypes = await getTableColumns(tableName)
    let proc = "DROP PROCEDURE IF EXISTS BulkUpdate; \n" + "DELIMITER |\n" +"CREATE PROCEDURE BulkUpdate() \n" + "BEGIN \n"
    //declaring local variables
    proc += "DECLARE done INT DEFAULT FALSE;\n"
    columnNamesAndTypes.forEach(({ column, type }) => {
        proc += "DECLARE row_" + column + " " + type + ";\n"
    })

    proc += "\nDECLARE curs CURSOR FOR SELECT"
    columnNamesAndTypes.forEach(({ column, type }) => {
        proc += " " + column + ", "
    });
    proc = proc.slice(0, -2) // Remove the last comma and space
    proc += " FROM " + tableName + " ORDER BY "
    key.forEach(({ primaryKey, type }) => {
        proc += primaryKey + ", "
    })
    proc = proc.slice(0, -2) // Remove the last comma and space
    proc += ";\n"

    proc += "\nDECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;\nOPEN curs;\n"

    proc += "\nread_loop: LOOP\n"
    proc += "FETCH curs INTO "
    columnNamesAndTypes.forEach(({ column, type }) => {
        proc += "row_" + column + ", "
    });
    proc = proc.slice(0, -2) // Remove the last comma and space
    proc += ";\n"
    proc += "IF done THEN\n"
    proc += "LEAVE read_loop;\n"
    proc += "END IF;\n"


    //making the case statement(s)
    proc += "\nCASE \n"

    for (let j = 0; j < conditions.length; j++) {
        //checking conditions for each column in a row one at a time
        proc += "WHEN " + conditions[j] + " THEN INSERT INTO " + tableName + " VALUES ("
        columnNamesAndTypes.forEach(({ column, type }) => {
            proc += "row_" + column + ", "
        });
        proc = proc.slice(0, -2) // Remove the last comma and space
        proc += ") ON DUPLICATE KEY UPDATE "
        inputIndex = 0;
        for (let i = 0; i < variableChange[j].length; i++) {
            if (columnPartOfPrimaryKey(columnNamesAndTypes[i].column, key)) {
                continue;
            } else {
                proc += variableChange[j][inputIndex] + ", "
                inputIndex++;
            }

        }
        proc = proc.slice(0, -2) // Remove the last comma and space
        proc += ";\n"

        // + variableChange[j][i] + " \n"

    }


    if (conditions.length < variableChange.length) {
        //if this is true that means an else statement is intended

        proc += "ELSE INSERT INTO " + tableName + " VALUES ("
        columnNamesAndTypes.forEach(({ column, type }) => {
            proc += "row_" + column + ", "
        });
        proc = proc.slice(0, -2) // Remove the last comma and space
        proc += ") ON DUPLICATE KEY UPDATE "

        let inputIndex = 0;
        for (let i = 0; i < columnNamesAndTypes.length; i++) {
            if (columnPartOfPrimaryKey(columnNamesAndTypes[i].column, key)) {
                proc += columnNamesAndTypes[i].column + " = row_" + columnNamesAndTypes[i].column + ", "

            } else {
                proc += variableChange[conditions.length][inputIndex] + ", "
                inputIndex++;
            }
        }
        proc = proc.slice(0, -2) // Remove the last comma and space

    } else {

        proc += "ELSE INSERT INTO " + tableName + " VALUES ("
        columnNamesAndTypes.forEach(({ column, type }) => {
            proc += "row_" + column + ", "
        });
        proc = proc.slice(0, -2); // Remove the last comma and space
        proc += ") ON DUPLICATE KEY UPDATE "
        for (let i = 0; i < columnNamesAndTypes.length; i++) {

            proc += columnNamesAndTypes[i].column + " = row_" + columnNamesAndTypes[i].column + ", "

        }
        proc = proc.slice(0, -2) // Remove the last comma and space

    }
    proc += ";\n"
    proc += "END CASE;\n";

    proc += "END LOOP;\n"
    proc += "CLOSE curs;\n"

    proc += "\n" + "END | \n"
    proc += "DELIMITER ;\n"
    return proc;
}



async function updateTable(tableName, conditions, variableChange) {
    let conn;
    try {
        const primaryKey = await getPrimaryKey(tableName);
        const proc = await createProc(tableName, primaryKey, conditions, variableChange);
        console.log(proc);
        conn = await pool.getConnection(); // Get a connection
        await conn.query(proc); // Execute the query
        console.log("Procedure created successfully.");

    } catch (error) {
        console.error(` Error creating procedure for ${tableName}:`, error);
    } finally {
        if (conn) conn.release(); // Release the connection
    }


}



// const conditions = ["Capacity>100", "Capacity<80", `Location="Pine Street"`]
// const variableChange = [[`Location="Main Street"`, "Capacity=1000"], [`Location="Jesper Street"`, "Capacity=802"], [`Location="Main Street"`, "Capacity=200"]]
// const variableChange = [["Location=Main Street", "Capacity=1000"], ["Location=Jesper Street", "Capacity=802"], [`Location="Main Street"`, "Capacity=200"], [`Location="Else Street"`, "Capacity=400"]];
// updateTable("Center", conditions, variableChange);

module.exports = {
    getPool,
    createMDBPool,
    updateTable,
    deleteFromTable,
    addToTable,
    fetchTable
}
