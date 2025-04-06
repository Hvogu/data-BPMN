const { getPool, createMDBPool, updateTable,
    deleteFromTable,
    addToTable,
    fetchTable } = require('./db'); // Import MariaDB connection
const express = require('express');
const getSchema = require('./ERD-diagram/getSchema');
const generateErd = require('./ERD-diagram/generateErd');
const cors = require('cors');
const path = require('path');
const { forEach } = require('min-dash');
const { get } = require('http');
const mariadb = require('mariadb');


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

app.use(express.json());
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
        const pool = getPool(); // Get the connection pool
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
        const pool = getPool(); // Get the connection pool
        const conn = await pool.getConnection();
        const rows = await conn.query(`SELECT * FROM \`${tableName}\``);
        conn.release();
        res.json(safeJson(rows));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch table data' });
    }
});
function safeJson(data) {
    return JSON.parse(JSON.stringify(data, (_, v) =>
        typeof v === 'bigint' ? v.toString() : v
    ));
}


app.post("/api/checkMDBConnection", async (req, res) => {
    const { host, port, user, password, database } = req.body;

    if (!host || !port || !user || !password || !database) {
        return res.status(400).json({ error: "Missing connection parameters" });
    }
    try {
        const testConn = await mariadb.createConnection({ host, port, user, password, database });
        await testConn.query("SELECT 1");
        await testConn.end();

        // ✅ Connection test passed, now create actual pool
        createMDBPool(host, port, user, password, database);

        res.json({ success: true });

    } catch (error) {
        console.error("❌ Connection error:", error);
        res.status(500).json({ success: false, message: "Database connection failed." });
    }
});


app.get("/api/fetchTable", async (req, res) => {
    const { tableName } = req.query;
    if (!tableName || tableName === "") {
        return res.status(400).json({ error: "Missing statement" });
    }
    try {
        const rows = await fetchTable(tableName);
        res.json(rows);
    } catch (error) {
        console.error("❌ Error fetching table:", error);
        res.status(500).json({ error: "Failed to fetch table data" });
    }
});

app.post("/api/addToTable", async (req, res) => {
    const { tableName, data } = req.body;

    if (!tableName || !data) {
        return res.status(400).json({ error: "Missing statements" });
    }
    try {
        await addToTable(tableName, data);
        res.json({ success: true });
    } catch (error) {
        console.error("❌ Error adding to table:", error);
        res.status(500).json({ error: "Failed to add data to table" });
    }
}
);
app.post("/api/deleteFromTable", async (req, res) => {
    const { tableName, parameter, value } = req.body;

    if (!tableName || !parameter || value === undefined) {
        return res.status(400).json({ error: "Missing tableName, parameter, or value" });
    }
    try {
        await deleteFromTable(tableName, parameter, value);
        res.json({ success: true });
    } catch (error) {
        console.error("❌ Error deleting from table:", error);
        res.status(500).json({ error: "Failed to delete data from table" });
    }
}
);
app.post("/api/updateTable", async (req, res) => {
    const { tableName, conditions, variableChange } = req.body;

    if (!tableName || !conditions || !variableChange) {
        return res.status(400).json({ error: "Missing tableName, conditions, or variableChange" });
    }
    try {
        await updateTable(tableName, conditions, variableChange);
        res.json({ success: true });
    } catch (error) {
        console.error("❌ Error updating table:", error);
        res.status(500).json({ error: "Failed to update data in table" });
    }
}
);


app.listen(3000, () => {
    console.log(`Server is running on port 3000`);
});

// const conditions = ["Capacity>100", "Capacity<80", `Location="Pine Street"`]
// const variableChange = [["Centerid=10", "Location=Main Street", "Capacity=1000"], ["CenterID=20", "Location=Jesper Street", "Capacity=802"], ["CenterID=30", `Location="Main Street"`, "Capacity=200"], ["CenterID=40", `Location="Else Street"`, "Capacity=400"]];
// updateTable("Center", conditions, variableChange);
//getTableColumns("Center");
// getPrimaryKey("Center");