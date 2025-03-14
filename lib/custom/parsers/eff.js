

import { processVar } from "./processVar";
import { tables } from "./db";
export default function parseExpressions(value,processVar1,attributes,tableData) {
   
    console.log(attributes)
    const expressions = value.split(';');

    expressions.forEach(expression => {
        expression = expression.trim();
        if (expression.startsWith('INSERT')) {
            const matches = expression.match(/INSERT \(([^)]+)\) INTO (\w+)/);
            if (matches && matches.length === 3) {
                const values = matches[1].split(',').map(value => value.trim());
                const tableName = matches[2];
                console.log(values)
                if (!tables.includes(tableName)) {
                    throw new Error('Error. Table does not exist.')
                } else {
                    const firstRow = tableData[tableName][0];
                    const columnDefinitions = Object.keys(firstRow)
                        .map((columnName) => `${columnName} ${getType(firstRow[columnName],processVar)}`)
                        .join(', ');
        
                    const expectedColumnCount = Object.keys(firstRow).length;
        
                    // Check if the number of values matches the number of columns
                    if (values.length !== expectedColumnCount) {
                        throw new Error(`Error. Number of values provided (${values.length}) does not match the number of columns in the table (${expectedColumnCount}).`);
                    }
        
                    // Check if the types of values match the column definitions
                    const columnTypes = columnDefinitions.split(',').map(colDef => colDef.trim().split(' ')[1]);
                    for (let i = 0; i < values.length; i++) {
                        console.log(values[i])
                        if(!attributes.includes(values[i])){
                        if(/^[a-zA-Z_]\w*\.[a-zA-Z_]\w*$/.test(values[i])){
                            throw new Error('Value Error.')
                        }
                        let expectedType;
                        if(!isNaN(values[i])){
                            expectedType = getType(Number.parseInt(values[i]),processVar)
                        } else if (/^(true|false)$/i.test(values[i])){
                            if(values[i].toLowerCase()==='true')
                                expectedType = getType(true,processVar)
                            else
                                expectedType = getType(false,processVar)
                        } else 
                            expectedType = getType(values[i],processVar);
                        if (columnTypes[i] !== expectedType&&expectedType!='Fine') {
                            throw new Error(`Error. Type of value at index ${i + 1} does not match the expected type (${columnTypes[i]}).`);
                        }
                    }
                   
                    }
        
                    // Continue with database handling
                }
            } else {
                throw new Error('Error. Invalid INSERT expression')
            }
        } else if (expression.startsWith('DELETE')) {
            const matches = expression.match(/DELETE \(([^)]+)\) FROM (\w+)/);
            if (matches && matches.length === 3) {
                const values = matches[1].split(',').map(value => value.trim());
                const tableName = matches[2];

                if (!tables.includes(tableName)) {
                    throw new Error('Error. Table does not exist.')
                } else {
                    const firstRow = tableData[tableName][0];
                    const columnDefinitions = Object.keys(firstRow)
                        .map((columnName) => `${columnName} ${getType(firstRow[columnName],processVar)}`)
                        .join(', ');
        
                    const expectedColumnCount = Object.keys(firstRow).length;
        
                    // Check if the number of values matches the number of columns
                    if (values.length !== expectedColumnCount) {
                        throw new Error(`Error. Number of values provided (${values.length}) does not match the number of columns in the table (${expectedColumnCount}).`);
                    }
        
                    // Check if the types of values match the column definitions
                    const columnTypes = columnDefinitions.split(',').map(colDef => colDef.trim().split(' ')[1]);
                    for (let i = 0; i < values.length; i++) {
                        console.log(values[i])
                        let expectedType;
                        if(!isNaN(values[i])){
                            expectedType = getType(Number.parseInt(values[i]),processVar)
                        } else if (/^(true|false)$/i.test(values[i])){
                            if(values[i].toLowerCase()==='true')
                                expectedType = getType(true,processVar)
                            else
                                expectedType = getType(false,processVar)
                        } else 
                            expectedType = getType(values[i],processVar);
                        if (columnTypes[i] !== expectedType&&expectedType!='Fine') {
                            throw new Error(`Error. Type of value at index ${i + 1} does not match the expected type (${columnTypes[i]}).`);
                        }
                    }
        
                    // Continue with database handling
                }
            } else {
            
                throw new Error('Error. Invalid DELETE expression')
            }
        }
        else if (expression.startsWith('#')) {
            const matches = expression.trim().split('=');
            console.log(matches)
            if (matches && matches.length === 2) {
                const variableName = matches[0].trim();
                const variableValue = matches[1].trim();
         
                if (!(processVar.find(([key]) => key === variableName))) {
                   
                    throw new Error('Error. Process variable does not exist.')
                } else {
                    const isNumber = /^[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?$/.test(variableValue)
                    console.log(isNumber)
                    if(!isNumber){
                        console.log((/^'[^']*'|"[^"]*"$/.test(variableValue)))
                        if(attributes.includes(variableValue)){

                        }

                        else if(variableValue[0]=='@'&&variableValue.length>1){

                        }
                        else if(!(/^'[^']*'|"[^"]*"$/.test(variableValue))){
                       
                            throw new Error('Invalid assignment value. Strings should be enclosed in single or double quotes, or it should be a valid number.');
                        }

                    }

                    for (let i = 0; i < processVar.length; i++) {
                        if (processVar[i][0] === variableName) {
                            processVar[i][1] = variableValue;
                            console.log(processVar)
                            break; // Exit the loop once the update is done
                        }
                    }
                }
            } else {
                throw new Error('Invalid assignment.')
            }
        } else {
            throw new Error('Invalid expression')
        }
    });

    return true;

   
}

const getType = (value,processVar) => {

    if(value[0]=='#'){
        console.log(value)
        
        if (!(processVar.find(([key]) => key === value))){
    
            throw new Error('Error. Process variable does not exist.')
    }
    else
        return 'Fine'
    }
    else if (value[0]=='@'){
       
        return 'Fine'
    }
    
    if (typeof value === 'number') {
      return 'INTEGER';
    } else if (typeof value === 'string') {
      return 'TEXT';
    } else if (typeof value === 'boolean') {
      return 'BOOLEAN';
    } else {
      return 'TEXT'; // Default to TEXT for other types
    }
  };
  