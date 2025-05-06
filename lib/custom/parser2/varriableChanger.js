import { processVar, setPro } from "../parsers/processVar";
const popup = document.getElementById('popup');
const variableFields = document.getElementById('variableForm');
const dropdownFields = document.getElementById('dropdownFields');

variableFields.addEventListener('submit', (e) => {
    e.preventDefault();
});

dropdownFields.addEventListener('submit', (e) => {
    e.preventDefault();
});


export function processVarParser(string) {
    processVar.forEach(([varName, varValue]) => {
        const regex = new RegExp(varName, 'g'); // Match whole words only
        console.log(`Replacing ${varName} with ${varValue}`);
        string = string.replace(regex, varValue);
    });
    return string;
}

export async function chooseSelRes(string, results) {
    return new Promise((resolve) => {
        variableFields.innerHTML = '';
        dropdownFields.innerHTML = '';
        if (results != null && results.length > 0) {
            console.log('no: 2');
            createDropdown(results);
            // Show the popup
            popup.style.display = 'flex';

            // Resolve the promise when the user clicks "Continue"
            document.getElementById('continue').addEventListener('click', () => {
                resolve(parseUserInput(string, null, results));
                popup.style.display = 'none';
            });
        }
        else {
            console.log('yes: 2');
            resolve(string);
        }
    });
}

export async function inputVarParser(string) {

    variableFields.innerHTML = '';
    dropdownFields.innerHTML = '';

    return new Promise((resolve) => {
        console.log("Processing input variables in string:", string);
        let matches = string.match(/@\w+/g); // Match whole words starting with @
        //console.log("Matches found:", matches);
        if (matches != undefined && matches != null) {
            console.log('yes: 1');
            matches = [...new Set(matches)];

            // Create text fields for each variable
            matches.forEach((match) => {
                const div = document.createElement('div');
                div.style.display = 'flex';
                const label = document.createElement('label');
                label.textContent = match;

                const input = document.createElement('input');
                input.type = 'text';
                input.placeholder = match;

                div.appendChild(label);
                div.appendChild(input);
                variableFields.appendChild(div);
            });

            // Show the popup
            popup.style.display = 'flex';

            // Resolve the promise when the user clicks "Continue"
            document.getElementById('continue').addEventListener('click', () => {

                resolve(parseUserInput(string, matches, null));
                popup.style.display = 'none';
            });
        }
        else {
            console.log('no: 1');
            resolve(string);
        }
    });
}


function createDropdown(results) {
    const topFiveResults = results.slice(0, 5);
    console.log("Top five results:", topFiveResults);

    const div = document.createElement('div');
    div.style.display = 'flex';
    const label = document.createElement('label');
    label.textContent = 'Select an option:';
    const select = document.createElement('select');

    topFiveResults.forEach((result) => {
        const option = document.createElement('option');
        option.value = JSON.stringify(result);
        option.textContent = JSON.stringify(result).replace(/[{}]/g, '');
        select.appendChild(option);

    });

    div.appendChild(label);
    div.appendChild(select);
    dropdownFields.appendChild(div);

}

/* */
function parseUserInput(string, matches, results) {
    if (matches != null) {
        const inputValues = Array.from(variableFields.elements).map((input) => input.value);
        matches.forEach((match, index) => {
            const regex = new RegExp(match, 'g'); // Match whole words only
            string = string.replace(regex, inputValues[index]);
        });
    }
    console.log("HERE: ", results);

    if (results != null && results.length > 0) {
        let dropVal = dropdownFields.querySelector('select').value;
        console.log("Results found:", dropdownFields.querySelector('select').value);
        dropVal = JSON.parse(dropVal);
        console.log("Parsed results:", dropVal);
        Object.entries(dropVal).forEach(([key, value]) => {
            const regex = new RegExp(`${key}\\s*=\\s*${key}`, 'g'); // Match: key = key
            console.log("Replacing:", key, "with:", value);
            string = string.replace(regex, (match) => {
              return `${key} = ${value}`;
            });
          });
          console.log("String after replacement:", string);
          
    }
    return string;
}