import parseExpression from "../parsers/parser.js";
export default async function handlePreCon(precon) {
    let evalPre = {
        isTrue:false,
        result:[]
    };
    if (/select/gi.exec(precon)){
        console.log("precon is a select statement")
        //first caputre everything after from
        const tableSection = precon.match(/from\s+(.+)/i)[1].trim();
        console.log("tableSection",tableSection);
        //capture the attributes between sel and from
        const attributes = precon.match(/select\s+(.+?)\s+from/i)[1].trim();
        console.log("atrributs",attributes);
        evalPre.result = await fetch(`http://localhost:3000/api/selQry?tableNames=${tableSection}&attributes=${attributes}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
            // format json [{ attr1: value1, attr2: value2, ...}, {...}]
        });
        if (evalPre.result.length > 0) {
            evalPre.isTrue = true;
        }
        console.log(evalPre.result);
    }
    else{   
        console.log("precon is a expression")
        try {
            let n = parseExpression(precon,"test",[]);
            console.log(n);
            evalPre.isTrue = n;
            evalPre.result = [];
        } catch(Err){
            console.error(Err)
            evalPre.isTrue = false;
            evalPre.result = [];
        }
    }
    return evalPre;
}