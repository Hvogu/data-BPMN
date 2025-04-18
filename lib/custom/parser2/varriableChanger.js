import { processVar, setPro } from "../parsers/processVar";

export function processVarParser(string) {
    console.log("Processing variables in string:", string);
    processVar.forEach(([varName, varValue]) => {
        const regex = new RegExp(varName, 'g'); // Match whole words only
        console.log(`Replacing ${varName} with ${varValue}`);
        console.log("Regex:", regex);
        string = string.replace(regex, varValue);
    });
    console.log("Processed string:", string);
    return string;
}

export function inputVarParser(string) {
    console.log("Processing input variables in string:", string);
    const match = string.match(/@\w+/g); // Match whole words starting with @
    if (match) {
        match.forEach((varName) => {
            const regex = new RegExp(varName, 'g'); // Match whole words only
            const varValue = setPro.get(varName);
            console.log(`Replacing ${varName} with ${varValue}`);
            string = string.replace(regex, varValue);
        });
    }
}