const { pool, updateTable,
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


app.listen(3000, () => {
    console.log(`Server is running on port 3000`);
});

// const conditions = ["Capacity>100", "Capacity<80", `Location="Pine Street"`]
// const variableChange = [["Centerid=10", "Location=Main Street", "Capacity=1000"], ["CenterID=20", "Location=Jesper Street", "Capacity=802"], ["CenterID=30", `Location="Main Street"`, "Capacity=200"], ["CenterID=40", `Location="Else Street"`, "Capacity=400"]];
// updateTable("Center", conditions, variableChange);
//getTableColumns("Center");
// getPrimaryKey("Center");