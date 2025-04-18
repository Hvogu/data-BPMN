import { processVarParser } from './varriableChanger.js';

export default function handleEffect(effect) {



    const match = effect.match(/^\s*(\S+)/);
    if (!match) throw new Error("Invalid effect format");

    const typeofEffect = match[1].toUpperCase()
    console.log(typeofEffect);

    if (typeofEffect.startsWith('#')) {

        return handleHashTag(effect);

    } else {
        if (effContainssHashTag(effect)) {

        }
        if (effContainssAtSign(effect)) {

        }

        switch (true) {
            case typeofEffect === 'INSERT':
                return handleInsert(effect);
            case typeofEffect === 'UPDATE':
                return handleUpdate(effect);
            case typeofEffect === 'DELETE':
                return handleDelete(effect);
            default:
                throw new Error(`Unknown effect type: ${typeofEffect}`);
        }

    }



}



async function handleInsert(effect) {

    const apiParts = extractAPIPartsForInsertDelete(effect, /^INSERT\s+(.+?)\s+INTO\s+(\w+)/i);
    console.log("unparsed data", apiParts);
    apiParts.data = parseDataString(apiParts.data);
    console.log("Parsed Data: ", apiParts.data);
    const res = await fetch('http://localhost:3000/api/addToTable', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            tableName: apiParts.table,
            data: apiParts.data
        })
    });

    const response = await res.json();
    if (!response.success) {
        alert("❌ Insert failed: " + response.error);
        console.error("Server error:", response.error);
    } else {
        console.log("✅ Insert successful");
    }
}

async function handleDelete(effect) {
    const apiParts = extractAPIPartsForInsertDelete(effect, /^DELETE\s+(.+?)\s+FROM\s+(\w+)/i);
    //make api call 
    const res = await fetch('http://localhost:3000/api/deleteFromTable', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            tableName: apiParts.table,
            data: apiParts.data
        })
    });

    const response = await res.json();
    if (!response.success) {
        alert("❌ Delete failed: " + response.error);
        console.error("Server error:", response.error);
    } else {
        console.log("✅ Delete successful");
    }
}

async function handleUpdate(effect) {
    console.log(effect);
    const apiParts = parseUpdateCaseStatement(effect);
    console.log(apiParts);


    const res = await fetch('http://localhost:3000/api/updateTable', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            tableName: apiParts.tableName,
            conditions: apiParts.conditions,
            variableChanges: apiParts.variableChanges
        })
    });

    const response = await res.json();
    if (!response.success) {
        alert("❌ update failed: " + response.error);
        console.error("Server error:", response.error);
    } else {
        console.log("✅ update successful");
    }
}

function extractAPIPartsForInsertDelete(effect, regex) {
    //splits up the whole effect string into two parts: the data and the table name
    // e.g. INSERT INTO tableName (key1=value1, key2=value2) => {data: "(key1=value1, key2=value2)", table: "tableName"}

    const match = effect.match(regex);

    if (match) {
        const data = match[1].trim();
        const table = match[2].trim();
        return { data, table };
    } else {
        throw new Error("Invalid statement format.");
    }
}




function parseUpdateCaseStatement(effect) {
    // 1. Extract table name

    effect = effect.replace(/\n/g, ' ').replace(/\r/g, ' ');

    const tableMatch = effect.match(/UPDATE\s+(\w+)/i);
    const tableName = tableMatch ? tableMatch[1] : null;

    const conditions = [];
    const variableChanges = [];

    // 2. Match all WHEN ... THEN ... blocks
    const whenThenRegex = /WHEN\s+(.+?)\s+THEN\s+([\s\S]*?)(?=\bWHEN\b|\bELSE\b|$)/gi;

    let match;
    while ((match = whenThenRegex.exec(effect)) !== null) {
        const condition = match[1].trim();
        const changeSet = match[2].trim();
        conditions.push(condition);
        variableChanges.push(changeSet);
    }

    // 3. Safely parse ELSE block, if it's not inside a string
    const elseMatch = effect.match(/\bELSE\b\s+([\s\S]*)$/i);
    if (elseMatch && elseMatch[1].trim().length > 0) {
        variableChanges.push(elseMatch[1].trim());
    }

    return {
        tableName,
        conditions,
        variableChanges
    };
}



function handleHashTag(effect) {
    console.log("this is a hashtag");
}

function effContainssHashTag(effect) {
    processVarParser(effect);
    return regex.test(effect);
}
function effContainssAtSign(effect) {
    const regex = /@\w+/g;
    return regex.test(effect);
}

function parseDataString(dataString) {
    const obj = {};

    // Match key=value or key='value with spaces'
    const pairs = dataString.match(/(\w+)=('.*?'|\d+|\w+)/g);

    if (!pairs) return obj;

    for (let pair of pairs) {
        const [key, rawValue] = pair.split('=');
        let value = rawValue;

        // Remove quotes if needed
        if (/^'.*'$/.test(value)) {
            value = value.slice(1, -1); // remove surrounding quotes
        } else if (!isNaN(value)) {
            value = Number(value);
        }

        obj[key.trim()] = value;
    }

    return obj;
}



