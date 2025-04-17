import { processVar, setPro } from "../parsers/processVar";

export function VarChanger(string) {
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