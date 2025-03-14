import { processVar } from "./processVar";
import { col } from "./db";
export default function parseExpression(expr,processVar1,attributeList) {

  if(attributeList==undefined){
    attributeList=[]
  }
  let legalOp = [
    "<", "<=", ">", ">=", "==", "!=", "=", "+", "-", "*", "/", "&&", "||", "!"
  ];

  // Define regular expression patterns
  let numPattern = /\d+(\.\d+)?/; // Match numbers, including decimals
  let opPattern = new RegExp(`(?:${legalOp.map(escapeRegExp).join('|')})`);
  let stringPattern = /'([^']+)'/;

  // Add parentheses around subexpressions enclosed in parentheses
  expr = addParenthesesAroundSubexpressions(expr);

  let tokens = tokenize(expr.trim());
  console.log('tokes')
  console.log(tokens)
 
  for(let j =0;j<tokens.length;j++){
    let token = tokens[j];
    if(token[0]=="#"){
      
      let exists = false;
      for(let i =0;i<processVar.length;i++){
        let tuple = processVar[i];
       
          if(tuple[0]==token){
            exists=true;
            if(isNaN(tuple[1]))
              tokens[j]="'"+tuple[1]+"'";
            else
              tokens[j]=tuple[1];

          }
      }
      if(!exists){
        console.log(processVar)
        throw new Error("Process variable does not exists.");
      }
    }
  }
  console.log(tokens)
  // Helper function to check if a token is a logical operator or NOT operator
  function isLogicalOperator(token) {
    return ["&&", "||", "!"].includes(token);
  }

  // Helper function to check if an operator is a logical "and" or "or" operator or NOT operator
  function isLogicalAndOrNotOperator(operator) {
    return operator === "&&" || operator === "||" || operator === "!";
  }

  // Helper function to check if an operator is a unary operator
  function isUnaryOperator(operator) {
    return operator === "!";
  }

  // Helper function to check if an operator has higher precedence
  function hasHigherPrecedence(op1, op2) {
    let precedence = {
      "!": 1,
      "||": 2,
      "&&": 3,
      "==": 4,
      "!=": 4,
      "<": 5,
      "<=": 5,
      ">": 5,
      ">=": 5,
      "+": 6,
      "-": 6,
      "*": 7,
      "/": 7,
    };
    return precedence[op1] >= precedence[op2];
  }

  // Evaluate the boolean expression using a stack
  let valueStack = [];
  let operatorStack = [];

  for (let token of tokens) {
    console.log(token)
    if (numPattern.test(token)) {
      valueStack.push(parseFloat(token));
    } else if (stringPattern.test(token)) {
      
      // For simplicity, treat variables as undefined
      valueStack.push(token);
    } 
    else if(attributeList.includes(token)){
      valueStack.push(token);
    }
    else if (opPattern.test(token)) {
      if (token === "(") {
        operatorStack.push(token);
      } else if (token === ")") {
        while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== "(") {
          let operator = operatorStack.pop();
          let operand2 = valueStack.pop();
          let operand1 = valueStack.pop();
          if(operand1==undefined){
            throw new Error('Missing right term.')
          }
          if(operand2==undefined){
            throw new Error('Missing left term.')
          }
          if (isLogicalOperator(operator)) {
            // Evaluate the logical expression
            switch (operator) {
              case "&&":
                valueStack.push(operand1 && operand2);
                break;
              case "||":
                valueStack.push(operand1 || operand2);
                break;
              case "!":
                valueStack.push(!operand2);
                break;
            }
          } else {
            // Evaluate other operators
            switch (operator) {
              case "+":
                valueStack.push(operand1 + operand2);
                break;
              case "-":
                valueStack.push(operand1 - operand2);
                break;
              case "*":
                valueStack.push(operand1 * operand2);
                break;
              case "/":
                valueStack.push(operand1 / operand2);
                break;
              case "<":
                valueStack.push(operand1 < operand2);
                break;
              case "<=":
                valueStack.push(operand1 <= operand2);
                break;
              case ">":
                valueStack.push(operand1 > operand2);
                break;
              case ">=":
                valueStack.push(operand1 >= operand2);
                break;
              case "==":
                valueStack.push(operand1 === operand2);
                break;
              case "!=":
                valueStack.push(operand1 !== operand2);
                break;
            }
          }
        }
        // Pop the open parenthesis "("
        operatorStack.pop();
      } else {
        while (
          operatorStack.length > 0 &&
          !isLogicalAndOrNotOperator(token) &&
          hasHigherPrecedence(operatorStack[operatorStack.length - 1], token)
        ) {
          let operator = operatorStack.pop();
          let operand2 = valueStack.pop();
          let operand1 = valueStack.pop();
          if(operand1==undefined){
            throw new Error('Missing right term.')
          }
          if(operand2==undefined){
            throw new Error('Missing left term.')
          }
          if (isLogicalOperator(operator)) {
            // Evaluate the logical expression
            switch (operator) {
              case "&&":
                valueStack.push(operand1 && operand2);
                break;
              case "||":
                valueStack.push(operand1 || operand2);
                break;
              case "!":
                valueStack.push(!operand2);
                break;
            }
          } else {
            // Evaluate other operators
            switch (operator) {
              case "+":
                valueStack.push(operand1 + operand2);
                break;
              case "-":
                valueStack.push(operand1 - operand2);
                break;
              case "*":
                valueStack.push(operand1 * operand2);
                break;
              case "/":
                valueStack.push(operand1 / operand2);
                break;
              case "<":
                valueStack.push(operand1 < operand2);
                break;
              case "<=":
                valueStack.push(operand1 <= operand2);
                break;
              case ">":
                valueStack.push(operand1 > operand2);
                break;
              case ">=":
                valueStack.push(operand1 >= operand2);
                break;
              case "==":
                valueStack.push(operand1 === operand2);
                break;
              case "!=":
                valueStack.push(operand1 !== operand2);
                break;
            }
          }
        }
        operatorStack.push(token);
      }
    } else  {
      // Handle string literals starting with '#'
      throw new Error('Invalid string not in quoutes.');
    }
  
  }

  if(operatorStack.length==0){
    throw new Error('Missing logical operator.')
  }
  console.log('value '+valueStack)
  console.log(operatorStack)
  while (operatorStack.length > 0) {
    let operator = operatorStack.pop();
    let operand2 = valueStack.pop();
    let operand1 = valueStack.pop();

    if (operand1==undefined&&operand2==undefined){
      throw new Error('Missing right and left term.')
    }
    if(operand1==undefined){
      throw new Error('Missing right term.')
    }
    if(operand2==undefined){
      throw new Error('Missing left term.')
    }
    if (isLogicalOperator(operator)) {
      // Evaluate the logical expression
      switch (operator) {
        case "&&":
          valueStack.push(operand1 && operand2);
          break;
        case "||":
          valueStack.push(operand1 || operand2);
          break;
        case "!":
          valueStack.push(!operand2);
          break;
      }
    } else {
      // Evaluate other operators
      switch (operator) {
     
        case "+":
          valueStack.push(operand1 + operand2);
          break;
        case "-":
          valueStack.push(operand1 - operand2);
          break;
        case "*":
          valueStack.push(operand1 * operand2);
          break;
        case "/":
          valueStack.push(operand1 / operand2);
          break;
        case "<":
          valueStack.push(operand1 < operand2);
          break;
        case "<=":
          valueStack.push(operand1 <= operand2);
          break;
        case ">":
          valueStack.push(operand1 > operand2);
          break;
        case ">=":
          valueStack.push(operand1 >= operand2);
          break;
        case "==":
          valueStack.push(operand1 === operand2);
          console.log(operand1+' '+operand2)
          break;
        case "!=":
          valueStack.push(operand1 != operand2);
          break;
      }
    }
  }

  if (valueStack.length === 1) {
    
    return valueStack[0] ;
  } else {
    // Handle invalid expressions here
    throw new Error("Invalid expression");
  }
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function tokenize(input) {
  const operators = [
    /<=|>=|==|!=|&&|\|\|/, // Multi-character operators
    /[-+*/<>=!]/, // Single-character operators
    /=/, // Single-character operator '='
  ];

  // Create a regular expression pattern to match operators, identifiers, numbers, strings, parentheses, and single-quoted terms
  const pattern = new RegExp(
    `(${operators.map(op => op.source).join('|')})|\\w+\\.\\w+|\\w+|\\d+|#\\w+|\\s+|\\(|\\)|'[^']*'`, 'g'
  );

  // Tokenize the input string
  const tokens = input.match(pattern) || [];

  // Remove any whitespace tokens
  const filteredTokens = tokens.filter(token => !/^\s+$/.test(token));

  // Check for two operators in a row
  for (let i = 0; i < filteredTokens.length - 1; i++) {
    if (filteredTokens[i].match(/^(<=|>=|==|!=|&&|\|\||[-+*/<>=!]=?)$/) && filteredTokens[i + 1].match(/^(<=|>=|==|!=|&&|\|\||[-+*/<>=!]=?)$/)) {
      throw new Error("Two operators in a row are not allowed.");
    }
  }
  console.log(filteredTokens)
  return filteredTokens;
}


function addParenthesesAroundSubexpressions(expr) {
  const pattern = /(\([^\(\)]*\))/g;
  const matches = expr.match(pattern);

  if (matches) {
    for (const match of matches) {
      expr = expr.replace(match, `(${match})`);
    }
  }

  return expr;
}