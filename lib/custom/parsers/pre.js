
import parseExpression from './parser.js'
import { processVar } from './processVar.js';
import { col,tables,tableData } from './db.js';

export function validateQuery(query,col1,tables1,processVar1){

    
    //regular to match specifc patterns
    const selectPattern = /SELECT\s+([^]+?)\s+FROM/i;
    const fromPattern = /FROM\s+([^]+?)(?:\s+WHERE|$)/i;
    const wherePattern = /WHERE\s+(.+)/i;

    const selectMatch = selectPattern.exec(query)
    const fromMatch = fromPattern.exec(query)
    const whereMatch = wherePattern.exec(query)

    //checks for spelling of keywords
    if(!selectMatch || !fromMatch || !whereMatch){
        throw new Error('Syntax Error'+ ' Mispelled or missing either SELECT, FROM, or WHERE.');
        
    }
    

    const selectAttributes = selectMatch[1].split(/\s*,\s*/);
    const fromTables = fromMatch[1].trim().split(/\s*,\s*/);

   

    //Checks for comma errors
    for(let j =0; j<selectAttributes.length;j++){
        if(/(\S+\s)+\S+/.test(selectAttributes[j])){
          
            throw new Error('Syntax Error'+ ' Missing commas and spaces between attributes or tables in the query.');
          
        }
    }
    for(let j =0; j<fromTables.length;j++){
        if(/(\S+\s)+\S+/.test(fromTables[j])){
            throw new Error('Syntax Error'+  ' Missing commas and spaces between attributes or tables in the query.');
            
        }
    }
   
  
    const usedTables = new Set();
    const ambiguousAttributes = new Set();

    // Cross-references with metadata
    for (const a of selectAttributes) {
        const [tableName, attributeName] = a.split('.');

        if (tableName && attributeName) {
            // Check if the table and attribute exist in the database
            if (!(tableName in tableData) || !tableData[tableName].includes(attributeName)) {
                throw new Error('Attribute Error '+ `Attribute ${a} does not exist in the database.`);
            }

            if (!fromTables.includes(tableName)) {
                throw new Error('Table Error '+ `Table ${tableName} is missing in the FROM clause.`);
            }

            if (hasDuplicates(fromTables)) {
                throw new Error('Table Error '+ `Table has dublicates.`);
            } 
        } else {
            if (!col.includes(a)) {
                throw new Error('Attribute Error '+ `Attribute ${a} does not exist in the database.`);
            }

            const conflictingTables = fromTables.filter(
                (table) => tableData[table]?.includes(a)
            );

            if (conflictingTables.length > 1) {
                ambiguousAttributes.add(a);
            }
        }
    }

    if (ambiguousAttributes.size > 0) {
        throw new Error('Attribute Error '+ `Ambiguous attributes found in multiple tables: ${Array.from(ambiguousAttributes).join(', ')}. Specify the table using the 'table.attribute' syntax.`);
    }

    for(const t of fromTables){
        if(!tables.includes(t)){
            throw new Error('Table Error '+ 'Table ' + t + ' does not exist in the database.');
        }
    }

    
    if(whereMatch==null){
      throw new Error('FILTER ERROR '+'Missing Filter.')
    }
   
    parseFilter(whereMatch[1],processVar,col,tables,query)

    return true;
  
  
}

function hasDuplicates(arr) {
    const uniqueElements = new Set();
  
    for (const element of arr) {
      if (uniqueElements.has(element)) {
        // This element is repeated
        return true;
      } else {
        uniqueElements.add(element);
      }
    }
  
    // No repeated elements found
    return false;
  }
function splitExpression(expression) {
    return  expression.split(/\b(AND|OR)\b/).map(token => token.trim());
    
  }

function parseFilter(expression,processVar,col,tables,text) {
    const tokens = splitExpression(expression)
    console.log(tokens)
    const andOr = ['AND', 'OR']
    const match = /SELECT\s+([^]+?)\s+FROM\s+([^]+?)(?:\s+WHERE|$)/i.exec(text);
    const tableNames = match[2].split(',');
    
    // Step 2 and 3: Retrieve table information and extract attributes
    let attributeList = [];
    tableNames.forEach(tableName => {
      tableName = tableName.trim(); // Remove leading/trailing spaces
      if (tableData.hasOwnProperty(tableName)) {
        
        tableData[tableName].forEach(attribute => {
          const formattedAttribute = `${tableName}.${attribute}`;
          attributeList.push(formattedAttribute);
        });
      }
    });
    if(tokens.includes('')) {
        throw new Error('Syntax Error', 'fliter cannot begin or end with logical operator')
       
    }

    for(let token of tokens){

        if(andOr.includes(token)) continue;
        if(isCondition(token)){
            console.log('cond')
            try{
                let n = parseExpression(token,processVar,attributeList)
                console.log(n)
            }catch(Err){
                throw new Error('Condition Error',Err)
            }
        }
        else if(isTuple(token,tables)){
            console.log('Tupple')
        }
        else{
            throw new Error('Syntax Error', 'Invalid filter')
        }
    }
    

  }
  
  export function isCondition(inputString) {
    const legalOperators = ["<", "<=", ">", ">=", "==", "!=", "=", "+", "-", "*", "/", "&&", "||", "!"];
    const operatorRegex = new RegExp(legalOperators.map(op => `\\${op}`).join('|'));
    const operators = inputString.match(operatorRegex);

  return (operators !== null && operators.length > 0)&&!(/\bTUPLE\b/i.test(inputString)||inputString.includes('IN')||inputString.includes('NOT')||inputString.includes('SELECT')||inputString.includes('FROM')||inputString.includes('WHERE'));
}
  
function isTuple(expression, tables) {
    console.log(expression);
    const tupleMatch = expression.match(/TUPLE\s*\(\s*([^)]+)\s*\)\s+(IN|NOT\s+IN)\s+(\w+)/);

    if (tupleMatch === null) {
        return false;
    }

    if (tupleMatch) {
        // Extract the components of the TUPLE expression
        const attributes = tupleMatch[1].split(',').map(attr => attr.trim());
        const operator = tupleMatch[2];
        const relation = tupleMatch[3].trim();

        console.log('tup');
        console.log(attributes);
        console.log(operator);
        console.log(relation);

        if (!tables.includes(relation)) {
            throw new Error('TABLE ERROR: The table ' + relation + ' does not exist in the database.');
        }

        const tableAttributes = tableData[relation];

        if (tableAttributes && attributes.length !== tableAttributes.length) {
            throw new Error('ATTRIBUTE COUNT ERROR: The number of attributes in the TUPLE does not match the number of attributes in the table ' + relation + '.');
        }

        return true;
    } else {
        throw new Error('Syntax Error: Invalid TUPLE expression.');
    }
}

  

 