import parseExpression from "../parsers/parser.js";
import { getLogger } from '../../features/log/logger.js';
import { getCurrentScope } from '../../features/log/Log.js';
import { TimesCircleIcon, CheckCircleIcon, ResetIcon } from '../../icons/index.js';

export default async function handlePreCon(precon) {
    let evalPre = {
        isTrue: false,
        result: []
    };
    if(evalPre.result.length > 0) {
        evalPre.result = [];
    }
    if (/select/gi.exec(precon)) {
        console.log("precon is a select statement")
        //first caputre everything after from
        const tableSection = precon.match(/from\s+(.+)/i)[1].trim();
        console.log("tableSection", tableSection);
        //capture the attributes between sel and from
        const attributes = precon.match(/select\s+(.+?)\s+from/i)[1].trim();
        console.log("atrributs", attributes);
        evalPre.result = await fetch(`http://localhost:3000/api/selQry?tableNames=${tableSection}&attributes=${attributes}`)
            .then(async response => {
                const body = await response.json();
                if (!response.ok) {
                    getLogger().log({
                        text: "Error in precon: " + (body.error || "Unknown error"),
                        icon: TimesCircleIcon(),
                        scope: getCurrentScope()
                    });
                    throw new Error(`HTTP error! ${response.status} - ${body.error}`);
                }
                return body; // success case: parsed JSON
            });
        if (evalPre.result.length > 0) {
            evalPre.isTrue = true;
        }
        console.log(evalPre.result);
    }
    else {
        console.log("precon is a expression")
        try {
            let n = parseExpression(precon, "test", []);
            evalPre.isTrue = n;
            evalPre.result = [];
        } catch (Err) {
            console.error(Err)
            evalPre.isTrue = false;
            evalPre.result = [];
        }
    }
    return evalPre;
}