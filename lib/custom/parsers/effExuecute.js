import { processVar ,setPro} from "./processVar";
import parseExpression from "./parser";
import { db ,tables} from "./db";
const popup = document.getElementById('popup');
const form = document.getElementById('variableForm');
const variableFields = document.getElementById('variableForm');
const dropdownFields = document.getElementById('dropdownFields')


let updatedPlaceholder =[]
export async function evalPreCondition(pre,col){
    let evalPre ={
        isTrue:false,
        result:[]
    }
   
    console.log('in')
    const updatedPre = processVar.reduce((acc, [varName, varValue]) => {
        const regex = new RegExp(varName, 'g');
        return acc.replace(regex, varValue);
    }, pre);
    console.log(updatedPre)

    if(updatedPre.includes('SELECT')){

        evalPre= await queryDatabase(updatedPre)
        console.log(evalPre.isTrue)
    }

    else{
        try{
            let n = parseExpression(updatedPre,processVar,col)
            console.log(n)
            evalPre.isTrue=n;
        }catch(Err){
        console.error(Err)
        }
    }

    return evalPre;
}

export async function executeEffects(eff,res,attributeList){
    console.log(eff)
    console.log(res)
    
    
  
    let effects;
  
    const placeholderList = [];
    const attributes = [];

    
    // Split the text into words using both spaces and commas
    const words = eff.split(/[,;\s]+/);
    
    // Iterate through each word
    words.forEach(word => {
        // Remove parentheses from the word
        const cleanedWord = word.replace(/[()]/g, "");
    
        // Check if the cleaned word starts with "@"
        if (cleanedWord.startsWith("@")) {
            // Remove "@" and add to placeholderList
            placeholderList.push('@'+cleanedWord.substring(1));
        }
    
        // Check if the cleaned word is in attributeList
        if (attributeList.includes(cleanedWord)) {
            attributes.push(cleanedWord);
        }
    });
    
    console.log("Placeholder List:", placeholderList);
    console.log("Attributes:", attributes);

if (attributes.length !== 0||placeholderList.length!==0) {
    console.log('Found attributes:', attributes);
    console.log('Simulation paused.');
    
 

    await openPopup(placeholderList, attributes, res).then((userInput) => {
        console.log('User Input:', userInput);
        updatedPlaceholder = userInput;
    });

    effects = replaceAllVariables(eff,placeholderList.concat(attributes),updatedPlaceholder).split(';');
} else {
    effects = eff.split(';');
}
    

    

    for(let effect of effects){

        if(effect.trim()[0]=='#'){
           
            let newPro = updateVariableValue(processVar,effect)
            console.log(newPro)
            setPro(newPro)
        }
        else{

        if(effect.includes('INSERT')) {
        const regex = /(FROM|INTO)\s+(.+)/i;
        let tableName = effect.match(regex)[2]
        console.log(db[tableName.trim()])
        const firstRow = db[tableName.trim()][0];
        const columnDefinitions = Object.keys(firstRow)
            .map((columnName) => `${columnName}`)
            .join(', ');
        
        let t = transformInsertString(tableName,effect,columnDefinitions.split(','));
        console.log(t)
        await queryDatabase(t)
        }
        else{
            const regex = /(FROM|INTO)\s+(.+)/i;
            let tableName = effect.match(regex)[2]
            console.log(db[tableName.trim()])
            const firstRow = db[tableName.trim()][0];
            const columnDefinitions = Object.keys(firstRow)
                .map((columnName) => `${columnName}`)
                .join(', ');
            
            let t = transformDeleteString(tableName,effect,columnDefinitions.split(','));
            console.log(t)
            await queryDatabase(t)
        }
        }

    }




}
function replaceAllVariables(text, variableNames, values) {
    for (let i = 0; i < variableNames.length; i++) {
        const variableName = variableNames[i];
        const value = values[i];

        // Escape special characters in the variable name for RegExp
        const escapedVariableName = variableName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Create a regular expression to match the variable name in the text
        const regex = new RegExp(`(${escapedVariableName})\\b`, 'g');

        // Replace all occurrences of the variable name with the corresponding value
        text = text.replace(regex, value);
    }

    console.log(text);
    return text;
}
function transformDeleteString(tableName, deleteString, columns) {
    // Extract values from the deleteString using regex
    const valuesMatch = deleteString.match(/\((.*?)\)/);

    if (!valuesMatch || valuesMatch.length < 2) {
        throw new Error('Invalid DELETE string format');
    }

    const values = valuesMatch[1].split(',');

    for (let i = 0; i < values.length; i++) {
        let j = values[i];

        if (isNaN(j)) {
            if (j[0] == '#') {
                values[i] = processVar.find(item => item[0] === j)[1];
            } else if (j == 'false' || j == 'true') {
                // Handle boolean values if needed
            } else {
                values[i] = "'" + values[i] + "'";
            }
        }
    }

    // Build the SQL DELETE statement with a WHERE clause
    if (columns.length !== values.length) {
        throw new Error('Number of columns and values do not match');
    }

    const whereConditions = columns.map((col, index) => `${col.trim()} = ${values[index]}`).join(' AND ');
    const sqlDelete = `DELETE FROM ${tableName} WHERE ${whereConditions};`;

    return sqlDelete;
}
function transformInsertString(tableName,insertString, columns) {
    // Extract values from the insertString using regex
    console.log(insertString)
    console.log(columns)
    const valuesMatch = insertString.match(/\((.*?)\)/);
    
    if (!valuesMatch || valuesMatch.length < 2) {
      throw new Error('Invalid INSERT string format');
    }
  
    const values = valuesMatch[1].split(',');
    console.log(values)
    for(let i =0;i< values.length;i++){
      let j = values[i]
      if(isNaN(j)){
        if(j[0]=='#'){
          values[i]=processVar.find(item => item[0] === j)[1];
        }

        else if (j=='false'||j=='true'){}
  
        else{
          values[i]="'"+values[i]+"'"
        }
        
      }
    }
    console.log(values)
    // Build the SQL INSERT statement
    const sqlInsert = `INSERT INTO ${tableName} (${columns}) VALUES (${values.join(', ')});`;
  
    return sqlInsert;
  }

  function updateVariableValue(processVar, inputString) {
    // Extract the variable identifier and new value from the input string
    console.log(inputString)
    const match = inputString.trim().match(/#(\w+)\s*=\s*(\w+)/);


    if (match) {
        const variableIdentifier = match[1];
        const newValue = match[2];

        // Update the value in the processVar list
        const updatedProcessVar = processVar.map(item => {
            if (item[0] === `#${variableIdentifier}`) {
                return [`#${variableIdentifier}`, newValue];
            }
            return item;
        });

        return updatedProcessVar;
    } else {
        throw new Error('Invalid input string format.');
    }
}

async function queryDatabase(query) {

    let evalPre ={
        isTrue:false,
        result:[]
    }
    try {
      const response = await fetch('http://localhost:3000/executeQuery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query }),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log('Query Result:', data);
  
      // Handle the retrieved data as needed (e.g., update the UI)
      if (!(data == [])) {
        evalPre.isTrue = true;
        evalPre.result = data;
      }
  
      return evalPre;
    } catch (error) {
      console.error('Fetch error:', error);
      // You might want to handle the error accordingly, e.g., show an error message
    }
  }

  async function openPopup(variables,attributesList, data) {
    return new Promise((resolve) => {
        // Clear previous content of the form and variableFields
        form.innerHTML = '';
        variableFields.innerHTML = '';
        dropdownFields.innerHTML = '';
        // Create text fields and dropdowns for each variable
        variables.forEach((variable) => {
            const div = document.createElement('div');div.style.display='flex'
            const label = document.createElement('label');
            label.textContent = variable;

            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = variable;

            
            div.appendChild(label);div.appendChild(input)
            variableFields.appendChild(div);
          
            
        });

        if(!attributesList==[])
            createDropdown(data,dropdownFields,attributesList);

        
        // Show the popup
        popup.style.display = 'flex';

        // Resolve the promise when the user clicks "Continue"
        document.getElementById('continue').addEventListener('click', () => {
            resolve(getUserInput());
            closePopup();
        });
    });
}

function createDropdown( data,dropdownFields,attributesList) {
    
    console.log(attributesList)
    for(let name of attributesList){
    const div = document.createElement('div');div.style.display='flex'
    const dropdown = document.createElement('select');
    const label = document.createElement('label');label.textContent=name;
    // Get unique values for the variable and take only the top five
    const uniqueValues = Array.from(new Set(data.map(obj => obj[name.split('.')[1]])));
    const topFiveValues = uniqueValues.slice(0, 5);

    // Create options for the dropdown
    topFiveValues.forEach((value) => {
        const option = document.createElement('option');
        option.value = value;
        option.text = value;
        dropdown.appendChild(option);
    });
    
    div.appendChild(label);div.appendChild(dropdown)
    dropdownFields.appendChild(div)
}
}


function getUserInput() {
    const inputValues = Array.from(form.elements).map((input) => input.value);

    // Get values from dropdowns
    const dropdownValues = Array.from(dropdownFields.querySelectorAll('select')).map((dropdown) => dropdown.value);

    // Concatenate input values and dropdown values
    return inputValues.concat(dropdownValues);
}

function closePopup() {
    // Hide the popup
    popup.style.display = 'none';
}