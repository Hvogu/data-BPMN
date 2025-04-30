import { processVarParser } from './varriableChanger.js';
import { processVar, setPro } from "../parsers/processVar.js";
import { getLogger } from '../../features/log/logger.js';
import { getCurrentScope } from '../../features/log/Log.js';
import { TimesCircleIcon, CheckCircleIcon, ResetIcon } from '../../icons/index.js';


export default function handleEffect(effect) {
    const match = effect.match(/^\s*(\S+)/);
    if (!match) throw new Error("Invalid effect format");

    const typeofEffect = match[1].toUpperCase()
    console.log(typeofEffect);

    if (typeofEffect.startsWith('#')) {
        const regex = /#(\w+)\s*=\s*#(\w+)/g;
        effect = effect.replace(regex, (match, p1, p2) => {
            const value = processVar.find(([key]) => key === `#${p2}`)?.[1];
            return `#${p1} = ${value}`;
        });
        console.log("effect after replacing", effect);
        return handleHashTag(effect);

    } else {

        effect = processVarParser(effect);


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

    getLogger().log({
        text: "DataTask sql:" + effect,
        icon: 'bpmn-icon-data-store gold',
        scope: getCurrentScope()
    });

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

        console.error("Server error:", response.error);
        getLogger().log({
            text: "Error in insert:" + response.error,
            icon: TimesCircleIcon(),
            scope: getCurrentScope()
        });
        throw new Error(response.error);

    } else {
        console.log("✅ Insert successful");
        console.log(response.data);
        getLogger().log({
            text: "insert Successful!",
            icon: CheckCircleIcon(),
            scope: getCurrentScope()
        });
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

        console.error("Server error:", response.error);
        getLogger().log({
            text: "Error in Delete:" + response.error,
            icon: TimesCircleIcon(),
            scope: getCurrentScope()
        });
        throw new Error(response.error);
    } else {
        console.log("✅ Delete successful");
        getLogger().log({
            text: "Delete Successful! Affected Rows: " + response.affectedRows,
            icon: CheckCircleIcon(),
            scope: getCurrentScope()
        });
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

        console.error("Server error:", response.error);
        getLogger().log({
            text: "Error in Update syntax: check Github for more information",
            icon: TimesCircleIcon(),
            scope: getCurrentScope()
        });
        throw new Error(response.error);
    } else {
        console.log("✅ update successful");
        getLogger().log({
            text: "Update Successful!",
            icon: CheckCircleIcon(),
            scope: getCurrentScope()
        });
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
    console.log("effect", effect);
    const matches = effect.match(/#\w+(?==)/g);
    console.log("matches", matches);
    console.log("processVar", processVar);
    var pvars = [];
    processVar.forEach((item) => {
        matches.forEach((match) => {
            if (item[0] === match) {
                pvars.push({
                    name: item[0],
                    value: item[1]
                }
                );
            }
        });
    });



    console.log("pvar", pvars);

    const newPro = updateVariableValue(processVar, effect);
    setPro(newPro);
    console.log("Updated processVar:", newPro);
    console.log("Updated processVar:", processVar);
    newPro.forEach((pro) => {
        pvars.forEach((pvar) => {
            console.log("pro", pro[1], "pvar", pvar);
            if (pro[0] === pvar.name) {

                getLogger().log({
                    text: `Variable change: ${pro[0]} = ${pvar.value} → ${pro[0]} = ${pro[1]}`,
                    icon: ResetIcon(),
                    scope: getCurrentScope()
                });
            }
        });

    });

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

function updateVariableValue(processVar, inputString) {
    const regex = /#(\w+)\s*=\s*(.+)/;
    const updates = {};

    const parts = inputString.split(','); // <== Split on commas first

    for (const part of parts) {
        const match = part.trim().match(regex);
        if (match) {
            const variableIdentifier = `#${match[1]}`;
            const newValue = match[2].trim();
            updates[variableIdentifier] = newValue;
        }
    }

    const updatedProcessVar = processVar.map(([key, val]) => {
        if (updates.hasOwnProperty(key)) {
            return [key, updates[key]];
        }
        return [key, val];
    });

    return updatedProcessVar;
}
