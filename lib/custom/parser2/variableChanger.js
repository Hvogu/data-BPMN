import { processVar, setPro } from "../parsers/processVar";

const popup = document.getElementById('popup');
const variableFields = document.getElementById('variableForm');
const dropdownFields = document.getElementById('dropdownFields');

export function processVarParser(string) {
    processVar.forEach(([varName, varValue]) => {
        const regex = new RegExp(varName, 'g'); // Match whole words only
        console.log(`Replacing ${varName} with ${varValue}`);
        string = string.replace(regex, varValue);
    });
    return string;
}

export async function inputVarParser(string, results = null) {
    variableFields.innerHTML = '';
    dropdownFields.innerHTML = '';

    return new Promise((resolve) => {
        if (Array.isArray(results) && results.length > 0) {
            console.log('Processing dropdown options');
            createDropdown(results);

            // Show the popup
            popup.style.display = 'flex';

            // Add event listener for "Continue" button
            setupContinueButton(resolve, string, null, results);
        } else {
            console.log("Processing input variables in string:", string);
            const matches = [...new Set(string.match(/@\w+/g))]; // Match whole words starting with @

            if (matches.length > 0) {
                console.log("Matches found:", matches);

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

                // Add event listener for "Continue" button
                setupContinueButton(resolve, string, matches, null);
            } else {
                console.log("No matches found in the string.");
                resolve(string);
            }
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

function setupContinueButton(resolve, string, matches, results) {
    const continueButton = document.getElementById('continue');
    continueButton.onclick = () => {
        resolve(parseUserInput(string, matches, results));
        popup.style.display = 'none';
    };
}

function parseUserInput(string, matches, results) {
    if (matches) {
        const inputValues = Array.from(variableFields.querySelectorAll('input')).map((input) => input.value);
        matches.forEach((match, index) => {
            const regex = new RegExp(match, 'g'); // Match whole words only
            string = string.replace(regex, inputValues[index]);
        });
    }

    if (Array.isArray(results) && results.length > 0) {
        const dropVal = JSON.parse(dropdownFields.querySelector('select').value);
        console.log("Parsed results:", dropVal);

        Object.entries(dropVal).forEach(([key, value]) => {
            const regex = new RegExp(key, 'g'); // Match whole words only
            string = string.replace(regex, value);
        });
    }

    return string;
}