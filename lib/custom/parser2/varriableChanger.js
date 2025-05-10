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
        string = string.replace(regex, varValue);
    });
    return string;
}

export async function chooseSelRes(string, results) {
    return new Promise((resolve) => {
        variableFields.innerHTML = '';
        dropdownFields.innerHTML = '';
        if (results != null && results.length > 0) {
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
            resolve(string);
        }
    });
}

export async function inputVarParser(string) {
    variableFields.innerHTML = '';
    dropdownFields.innerHTML = '';

    return new Promise((resolve) => {
        console.log("Processing input variables in string:", string);
        let matches = string.match(/@\w+/g);

        if (matches != undefined && matches != null) {
            matches = [...new Set(matches)];

            // Create a wrapper with two columns
            const wrapper = document.createElement('div');
            wrapper.style.display = 'flex';
            wrapper.style.gap = '20px';

            const labelCol = document.createElement('div');
            const inputCol = document.createElement('div');
            labelCol.style.display = 'flex';
            labelCol.style.flexDirection = 'column';
            inputCol.style.display = 'flex';
            inputCol.style.flexDirection = 'column';

            matches.forEach((match) => {
                const row = document.createElement('div');
                row.style.display = 'flex';
                row.style.alignItems = 'center';
                row.style.marginBottom = '10px';

                const label = document.createElement('label');
                label.textContent = match;
                label.style.marginRight = '10px';
                label.style.minWidth = '150px'; // ensures label takes up consistent space

                const input = document.createElement('input');
                input.type = 'text';
                input.placeholder = match;
                input.style.flex = '1'; // input stretches to fill remaining space
                input.style.padding = '6px';

                row.appendChild(label);
                row.appendChild(input);
                variableFields.appendChild(row);
            });


            wrapper.appendChild(labelCol);
            wrapper.appendChild(inputCol);
            variableFields.appendChild(wrapper);

            popup.style.display = 'flex';

            document.getElementById('continue').addEventListener('click', () => {
                resolve(parseUserInput(string, matches, null));
                popup.style.display = 'none';
            });
        } else {
            resolve(string);
        }
    });
}



function createDropdown(results) {
    const topFiveResults = results.slice(0, 5);

    const div = document.createElement('div');
    div.style.display = 'flex';
    const label = document.createElement('label');
    label.textContent = 'Select an option:';
    const select = document.createElement('select');

    results.forEach((result) => {
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
    // debugger
    if (results != null && results.length > 0 && dropdownFields.querySelector('select') != null) {
        let dropVal = dropdownFields.querySelector('select').value;
        console.log("Results found:", dropdownFields.querySelector('select').value);
        dropVal = JSON.parse(dropVal);
        console.log("Parsed results:", dropVal);

        string = string.replace(/([#]?\b\w+\b)\s*=\s*(\b\w+\b)/g, (match, left, right) => {
            if (right in dropVal) {
                return `${left} = ${dropVal[right]}`;
            }
            return match;
        });

    }
    console.log("String after replacement:", string);
    return string;
}
