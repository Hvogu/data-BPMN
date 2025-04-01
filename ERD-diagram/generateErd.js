const fs = require('fs');
const { exec } = require('child_process');
const chokidar = require('chokidar'); // Auto-watch schema.json changes

async function generateErd() {
    try {
        // Read the database schema from schema.json
        const schema = JSON.parse(fs.readFileSync('schema.json', 'utf8'));

        // Start building the Graphviz DOT file content
        let dotContent = `digraph ERD {\n  rankdir=LR;\n  node [shape=box];\n`;

        // Generate nodes for tables
        schema.tables.forEach(table => {
            dotContent += `  ${table.TABLE_NAME} [label="{ ${table.TABLE_NAME} | ${schema.tables
                .filter(t => t.TABLE_NAME === table.TABLE_NAME)
                .map(col => `${col.COLUMN_NAME}: ${col.DATA_TYPE}`)
                .join(" | ")} }" shape=Mrecord];\n`;
        });

        // Generate relationships (foreign keys)
        schema.foreignKeys.forEach(fk => {
            dotContent += `  ${fk.TABLE_NAME} -> ${fk.REFERENCED_TABLE_NAME} [label="${fk.COLUMN_NAME} -> ${fk.REFERENCED_COLUMN_NAME}"];\n`;
        });

        // Close the DOT structure
        dotContent += `}`;

        // Save the DOT file
        fs.writeFileSync('erd-diagram.dot', dotContent);

        console.log("✅ DOT file generated successfully: erd-diagram.dot");

        // Convert DOT file to an SVG ERD diagram using Graphviz
        exec('dot -Tsvg erd-diagram.dot -o erd-diagram.svg', (err, stdout, stderr) => {
            if (err) {
                console.error("❌ Error generating ERD:", stderr);
                return;
            }
            console.log("✅ ERD diagram updated: erd-diagram.svg");
        });

    } catch (error) {
        console.error("❌ Error generating ERD diagram:", error);
    }
}

module.exports = generateErd;

// Watch for changes in schema.json and regenerate ERD automatically
chokidar.watch('schema.json').on('change', () => {
    console.log("🔄 Detected schema change, regenerating ERD...");
    generateErd();
});
generateErd(); // Initial call to generate ERD on startup
