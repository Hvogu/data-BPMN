let db;
let col;
let tables;

let tableData;

function setDb(newDb){
   db = newDb
}
function setCol(newCol){
   col=newCol.concat(['*']);
}
function setTables(newTables){
   tables=newTables;
}


export {db,setDb,col,setCol,tables,setTables,tableData,extractTableAttributes}

function extractTableAttributes(jsonText) {
   try {
     const jsonObject = JSON.parse(jsonText);
     const result = {};
 
     for (const tableName in jsonObject) {
       if (jsonObject.hasOwnProperty(tableName)) {
         const attributes = [];
 
         jsonObject[tableName].forEach((item) => {
           for (const key in item) {
             if (!attributes.includes(key)) {
               attributes.push(key);
             }
           }
         });
 
         result[tableName] = attributes;
       }
     }
 
     tableData= result;
   } catch (error) {
     console.error("Error parsing JSON text:", error.message);
     tableData=  null;
   }
 }
