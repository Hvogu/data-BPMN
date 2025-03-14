 let processVar =[]
 let processVarNames =[]
 function setPro(newPro){
    processVar = newPro
    processVarNames = processVar.map(item => item[0]);
 }

 export {processVar,processVarNames,setPro}
