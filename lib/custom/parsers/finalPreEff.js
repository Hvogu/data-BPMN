import {validateQuery,isCondition} from './pre.js'
import parsesqlEditoression from './parser.js'
import parseExpressions from './eff.js'
import { db ,col,tables, tableData} from './db.js'
import { processVar ,processVarNames} from './processVar.js'

export default function getAll(container,col1,tables1,processVar1,tableData1){
  
   const topDiv = document.createElement('div')
   const sqlEditor = document.createElement('textarea'); sqlEditor.id = container.id+'pre'
   sqlEditor.className='pre'
   const suggestTop = document.createElement('ul')
   topDiv.appendChild(sqlEditor);topDiv.appendChild(suggestTop);

   const bottomDiv = document.createElement('div')
   const effEditor = document.createElement('textarea'); effEditor.id = container.id+'eff'
   effEditor.className = 'eff'
   const suggestBottom = document.createElement('ul'); suggestBottom.style.textAlign='left'
   bottomDiv.appendChild(effEditor);bottomDiv.appendChild(suggestBottom);
   
   container.appendChild(topDiv);container.appendChild(bottomDiv);
   container.style.display= 'flex';
   container.style.flexDirection= 'column';
   container.style.justifyContent = 'center';
   container.style.alignItems = 'center';

   effEditor.addEventListener('input',function(){

    if(db!=null){
    effEditor.classList.remove('parsed')
    let valid = false
    

    try{
      let attributeList = [];

      if (container.pre !== undefined) {
        if (container.pre.isPared) {
          if (container.pre.n.includes('SELECT')) {
            // Extract attributes and table from the SQL SELECT statement
            const match = /SELECT\s+([^]+?)\s+FROM\s+([^]+?)(?:\s+WHERE|$)/i.exec(container.pre.n);
      
            if (match) {
              const attributes = match[1].split(/\s*,\s*/);
              const tableName = match[2];
      
              // Combine table name and attributes to form the attribute list
              const newAttributes = attributes.map(attribute => {
                // Check if attribute already includes a dot, indicating it's in the format table.attribute
                return attribute.includes('.') ? attribute : `${tableName}.${attribute}`;
              });
      
              // Add the new attributes to the existing attributeList
              attributeList = attributeList.concat(newAttributes);
            }
          }
        }
      }
        
        valid = parseExpressions(effEditor.value,processVar,attributeList,db)
        sqlEditor.classList.remove("error");
       
    }catch(error){
        console.log(error)
 
    
    }
    
    if(valid){
        effEditor.classList.add('parsed')
        let n = effEditor.value
        container.eff={'isPared':true,n}
    }
  }
  else{
    console.error('Error: Database must be initalized')
  alert('Error: Database must be initalized')

  }
   
});
sqlEditor.addEventListener('input', function () {
  
  if(db!=null){
    // Clear previous errors and error highlights
    sqlEditor.classList.remove('parsed')
    let valid = false
    let inputValue = sqlEditor.value;
    // Check for errors and highlight them
    if (isCondition(inputValue, [])) {
        try {
            parsesqlEditoression(inputValue, processVar,col);
            valid = true;
        } catch (Err) {
            console.error(Err);
            
        }
    } else {
        try{
            valid = validateQuery(inputValue,col,tables,processVar);
        }catch(Err){
            console.log(Err)
        }

    }

    if(valid) { 
        console.log('PARSED!')
        sqlEditor.classList.add('parsed')
        let n = sqlEditor.value
        container.pre={'isPared':true,n}
}       
else{
  let n = sqlEditor.value
        container.pre={'isPared':false,n}
}
} else{
  console.error('Error: Database must be initalized')
  alert('Error: Database must be initalized')
}
  });
sqlEditor.addEventListener('input', function() {
    // Get the current query

    const query = sqlEditor.value;
    const cursorPosition = sqlEditor.selectionStart
   
    // Get the current word being typed
    
  
    // Clear existing suggestions
    clearSuggestions(suggestTop);
  
    // Provide suggestions based on the current word
    suggest(sqlEditor,cursorPosition,suggestTop)

    
  });
  effEditor.addEventListener('input',function(){
    clearSuggestions(suggestBottom)
 
    suggestEff(effEditor,effEditor.selectionStart,suggestBottom)
  });


  effEditor.addEventListener('keydown',function(event){
    let pro;
    if(event.code==='Space'){
      event.preventDefault();
  
      const cursorPos = this.selectionStart;
      const textBeforeCursor = this.value.substring(0, cursorPos);
      const textAfterCursor = this.value.substring(cursorPos);

      // Insert a space at the cursor position
      this.value = textBeforeCursor + " " + textAfterCursor;

      // Move the cursor position after the inserted space
      this.setSelectionRange(cursorPos + 1, cursorPos + 1);
    }
    else if(event.key ==='Tab'){
        event.preventDefault();

        const selectedSuggestion = suggestBottom.firstChild;

        if(selectedSuggestion){
            let word = selectedSuggestion.textContent;
            if(['insert','into','delete','from'].includes(word)){
                insertSuggestion(word.toUpperCase(),effEditor,suggestBottom)
            }
            else if(word.indexOf(0)=='#'){
                console.log('hrl')
            }
            else{
                insertSuggestion(word,effEditor,suggestBottom)
            }
        }
        
        else{
            pro = parseQueryProgressEff(effEditor.value,effEditor.selectionStart);
            console.log(pro)

            if(pro.cursorAt=='INSERT'&&!pro.INTO){
                let tupleSugestions =[]

                for (let t of tables) {
                  const tableName = t; // Replace this with the actual variable or expression representing the table name
                  const firstRow = db[t][0];
                  const columnNames = Object.keys(firstRow).join(', ');
                
                  tupleSugestions.push(`( ${columnNames} ) INTO ${tableName}`);
                }
                showSuggestions(tupleSugestions,suggestBottom,effEditor)
            }
            else if(pro.cursorAt=='INSERT'&&pro.INTO){
              let inputString = getCurrentWord('',effEditor)
              inputString = removeParentheses(inputString)
              const startsWithTableNameAndDot = tables.some(tableName => {
                const prefix = tableName.trim() + '.'; // Trim the table name
   
                return inputString.trim().startsWith(prefix) && inputString.trim().length == prefix.length && inputString.trim()[prefix.length-1] === '.';
              });
              
             
              if(startsWithTableNameAndDot){
                  let att = tableData[inputString.split('.')[0]]
                  showSuggestions(att,suggestBottom,effEditor)
              }else 
                showSuggestions(tables,suggestBottom,effEditor)
          }
        
            else if(pro.cursorAt=='INTO'){
                showSuggestions(tables,suggestBottom,effEditor)
            }
            else if(pro.cursorAt=='DELETE'&&!pro.FROM){
          
              let tupleSugestions =[]

                for (let t of tables) {
                  const tableName = t; // Replace this with the actual variable or expression representing the table name
                  const firstRow = db[t][0];
                  const columnNames = Object.keys(firstRow).join(', ');
                
                  tupleSugestions.push(`(${columnNames}) FROM ${tableName}`);
                }
                showSuggestions(tupleSugestions,suggestBottom,effEditor)
            }
            else if (pro.cursorAt=='DELETE'&&pro.FROM){
              let inputString = getCurrentWord('',effEditor)
              inputString = removeParentheses(inputString)
              const startsWithTableNameAndDot = tables.some(tableName => {
                const prefix = tableName.trim() + '.'; // Trim the table name
   
                return inputString.trim().startsWith(prefix) && inputString.trim().length == prefix.length && inputString.trim()[prefix.length-1] === '.';
              });
              
             
              if(startsWithTableNameAndDot){
                  let att = tableData[inputString.split('.')[0]]
                  showSuggestions(att,suggestBottom,effEditor)
              }else 
                showSuggestions(tables,suggestBottom,effEditor)
            }
            else if(pro.cursorAt=='FROM')
                showSuggestions(tables,suggestBottom,effEditor)
        }
    }
  });

  sqlEditor.addEventListener('keydown', function(event) {
      let pro;
      if (event.code === "Space") {
        event.preventDefault();
  
        const cursorPos = this.selectionStart;
        const textBeforeCursor = this.value.substring(0, cursorPos);
        const textAfterCursor = this.value.substring(cursorPos);
  
        // Insert a space at the cursor position
        this.value = textBeforeCursor + " " + textAfterCursor;
  
        // Move the cursor position after the inserted space
        this.setSelectionRange(cursorPos + 1, cursorPos + 1);
      }
    else if (event.key === 'Tab') {
   
      event.preventDefault();
      const selectedSuggestion = suggestTop.firstChild;
      console.log(selectedSuggestion)
      pro = parseQueryProgress(sqlEditor.value,sqlEditor.selectionStart);
      console.log(pro)
     
      if (selectedSuggestion) {
        let word = selectedSuggestion.textContent
        if(['select','from','where','and', 'in', 'not', 'tuple','or'].includes(word))
          insertSuggestion(word.toUpperCase(),sqlEditor,suggestTop);
          else
          insertSuggestion(word,sqlEditor,suggestTop);
      }
      else {
          
         
        let inputString = getCurrentWord('',sqlEditor)
          if(pro.cursorAt=='SELECT'){
              

              const startsWithTableNameAndDot = tables.some(tableName => {
                const prefix = tableName.trim() + '.'; // Trim the table name
   
                return inputString.trim().startsWith(prefix) && inputString.trim().length == prefix.length && inputString.trim()[prefix.length-1] === '.';
              });
              
             
              if(startsWithTableNameAndDot){
                  let att = tableData[inputString.split('.')[0]]
                  showSuggestions(att,suggestTop,sqlEditor)
              }else 
                showSuggestions(tables,suggestTop,sqlEditor)
          }
          else if(pro.cursorAt=='FROM'){
              showSuggestions(tables,suggestTop,sqlEditor)
          }
          else if(pro.cursorAt=='WHERE'){
            const startsWithTableNameAndDot = tables.some(tableName => {
              const prefix = tableName.trim() + '.'; // Trim the table name
 
              return inputString.trim().startsWith(prefix) && inputString.trim().length == prefix.length && inputString.trim()[prefix.length-1] === '.';
            });
            
           
            if(startsWithTableNameAndDot){
                let att = tableData[inputString.split('.')[0]]
                showSuggestions(att,suggestTop,sqlEditor)
            }else 
              showSuggestions(tables,suggestTop,sqlEditor)
          }
      }
    }
  });

  ////////////////
  const suggestionsList = document.getElementById('suggestions');
  const keywords = ['select', 'and', 'or', 'not', 'in', 'tuple','from','where'];
  const keywordsEff = ['insert', 'into', 'delete', 'from']
  let currentKeyWordsEff = keywordsEff

  let currentKeyWords = keywords
 
 
  function removeParentheses(str) {
    // Remove leading parentheses
    while (str.startsWith('(')) {
      str = str.slice(1);
    }
  
    // Remove trailing parentheses
    while (str.endsWith(')')) {
      str = str.slice(0, -1);
    }
  
    return str;
  }
  
  function getCurrentWord(q,Editor) {
    const caretPosition = Editor.selectionStart;
  
    const textBeforeCaret = Editor.value.substring(0, caretPosition);
    const wordsBeforeCaret = textBeforeCaret.split(/\s/);

    return  wordsBeforeCaret[wordsBeforeCaret.length - 1];
    
  }
  
  function getMatchingKeywords(prefix,currentKeyWords) {
    // Filter keywords that start with the current word
    return currentKeyWords.filter(keyword => keyword.startsWith(prefix));
  }
  
  function showSuggestions(suggestions,suggestionsList,editor) {
    suggestions.forEach(suggestion => {
      const li = document.createElement('li');li.style.width='300px';li.style.paddingLeft = '0';
      li.textContent = suggestion;
      li.addEventListener('click', () => {insertSuggestion(suggestion,editor); });
      suggestionsList.appendChild(li);
    });
  }
  
  function insertSuggestion(suggestion,Editor,suggestionsList) {
   
    const currentQuery = Editor.value;
    const currentWord = getCurrentWord(currentQuery,Editor);
    console.log(currentWord)
    const startIndex = Editor.selectionStart-currentWord.length
  
    // Check if the current word ends with an operator
    const operators = ['+', '-', '*', '/', '==', '!=', '<', '>', '<=', '>=', '&&', '||',',','.'];
    const endsWithOperator = operators.some(operator => currentWord.endsWith(operator));
  
    let updatedQuery;
  
    if (endsWithOperator) {
      // Insert the suggestion after the current word without removing it
      updatedQuery = currentQuery.substring(0, startIndex + currentWord.length) + suggestion + currentQuery.substring(startIndex + currentWord.length);
    } else {
      // Insert the suggestion in the default manner
      updatedQuery = currentQuery.substring(0, startIndex) + suggestion + currentQuery.substring(startIndex + currentWord.length);
    }
    if(keywords.includes(suggestion)){
        Editor.value = updatedQuery.toUpperCase()
    }
    else {Editor.value = updatedQuery;}
    let i= startIndex+suggestion.length
    Editor.setSelectionRange(i,i)
    clearSuggestions(suggestionsList);
  }
  
  function clearSuggestions(suggestionsList) {
    while (suggestionsList.firstChild) {
      suggestionsList.removeChild(suggestionsList.firstChild);
    }
  }
  
  function suggest(editor,cursorPosition,suggestionsList){
    console.log(currentKeyWords)
    let sel_keyWords;
      const currentWord = getCurrentWord(sqlEditor.value,editor);
      if (currentWord.length > 0) {

        if(currentWord[0]=='#'){
            
            currentKeyWords = processVarNames;
        }
      const matchingKeywords = getMatchingKeywords(currentWord,currentKeyWords);
      showSuggestions(matchingKeywords,suggestionsList,editor);
    }
    const pro = parseQueryProgress(sqlEditor.value,cursorPosition)
  
    
    if(pro.cursorAt=='SELECT'){
      let inputString = getCurrentWord('',editor)
      const startsWithTableNameAndDot = tables.some(tableName => {
        const prefix = tableName.trim() + '.'; // Trim the table name

        return inputString.trim().startsWith(prefix) && inputString.trim().length >= prefix.length && inputString.trim()[prefix.length-1] === '.';
      });
      console.log(startsWithTableNameAndDot)
      if(startsWithTableNameAndDot){
        let word = inputString.split('.')
        console.log(tableData[word[0]])
          sel_keyWords = tableData[word[0]].map(att => word[0]+'.'+att)

      }else{
        sel_keyWords =['from'].concat(tables)
      }
      
      currentKeyWords = sel_keyWords
    }
    else if(pro.cursorAt=='FROM'){
      currentKeyWords = ['where'].concat(tables)
    }
    else if(pro.cursorAt=='WHERE'){
      let inputString = getCurrentWord('',editor)
      const startsWithTableNameAndDot = tables.some(tableName => {
        const prefix = tableName.trim() + '.'; // Trim the table name

        return inputString.trim().startsWith(prefix) && inputString.trim().length >= prefix.length && inputString.trim()[prefix.length-1] === '.';
      });
      console.log(startsWithTableNameAndDot)
      if(startsWithTableNameAndDot){
        let word = inputString.split('.')
        console.log(tableData[word[0]])
          currentKeyWords = tableData[word[0]].map(att => word[0]+'.'+att)

      }else
        currentKeyWords = ['and', 'or', 'not', 'in', 'tuple'].concat(tables);
    }
    
    else currentKeyWords=keywords
  }
  
  function suggestEff(editor,cursorPosition,suggestionsList){
   
    let sel_keyWords;
      const currentWord = getCurrentWord(editor.value,editor);
      console.log(currentWord)
      if (currentWord.length > 0) {
        if(currentWord[0]=='#'){
            
            currentKeyWordsEff = processVarNames;
        }
      const matchingKeywords = getMatchingKeywords(currentWord,currentKeyWordsEff);
      
      showSuggestions(matchingKeywords,suggestionsList,editor);
    }
    const pro = parseQueryProgressEff(editor.value,cursorPosition)
    console.log(pro)
    if(pro.cursorAt=='INSERT'){
      let inputString=currentWord
      const startsWithTableNameAndDot = tables.some(tableName => {
        const prefix = tableName.trim() + '.'; // Trim the table name

        return inputString.trim().startsWith(prefix) && inputString.trim().length >= prefix.length && inputString.trim()[prefix.length-1] === '.';
      });
      
      console.log(startsWithTableNameAndDot)
      console.log(inputString)
      if(startsWithTableNameAndDot){
        let word = inputString.split('.')
        console.log(tableData[word[0]])
        currentKeyWordsEff = tableData[word[0]].map(att => word[0]+'.'+att)
      }
      else{
      sel_keyWords =['into'].concat(tables)
      currentKeyWordsEff = sel_keyWords
      }
    }
    else if(pro.cursorAt=='INTO'){
      
      currentKeyWordsEff = tables
    }
    else if(pro.cursorAt=='DELETE'){
      let inputString=currentWord
      const startsWithTableNameAndDot = tables.some(tableName => {
        const prefix = tableName.trim() + '.'; // Trim the table name

        return inputString.trim().startsWith(prefix) && inputString.trim().length >= prefix.length && inputString.trim()[prefix.length-1] === '.';
      });
      
      console.log(startsWithTableNameAndDot)
      console.log(inputString)
      if(startsWithTableNameAndDot){
        let word = inputString.split('.')
        console.log(tableData[word[0]])
        currentKeyWordsEff = tableData[word[0]].map(att => word[0]+'.'+att)
      }
      else{
      sel_keyWords =['from'].concat(tables)
      currentKeyWordsEff = sel_keyWords
      }
      
    }
    else if(pro.cursorAt=='FROM'){
        currentKeyWordsEff=tables
    }
    else if(currentWord.indexOf(0)=='#'){
        currentKeyWordsEff = processVar.map(item => item[0]);
    }
    else currentKeyWordsEff=keywordsEff
  }

  function parseQueryProgress(queryText, cursorPosition) {
  const keyWords = ['SELECT', 'FROM', 'WHERE'];
  let progress = {};
  let cursorPositionInfo = '';
  
  for (const keyword of keyWords) {
  const keywordIndex = queryText.indexOf(keyword);
  if (keywordIndex !== -1 && cursorPosition >= keywordIndex + keyword.length) {
    cursorPositionInfo = keyword;
  }
  
  progress[keyword] = keywordIndex !== -1;
  }
  
  progress.cursorAt = cursorPositionInfo;
  return progress;
  }


  function parseQueryProgressEff(queryText, cursorPosition) {
    console.log(queryText)
    const keywordsForInsert = ['INSERT', 'INTO'];
    const keywordsForDelete = ['DELETE', 'FROM'];
    let progress = {};
    let cursorPositionInfo = '';
  
    for (const keyword of keywordsForInsert) {
      const keywordIndex = queryText.indexOf(keyword);
      if (keywordIndex !== -1 && cursorPosition >= keywordIndex + keyword.length) {
        cursorPositionInfo = keyword;
      }
  
      progress[keyword] = keywordIndex !== -1;
    }
  
    if (!progress.INSERT) {
      for (const keyword of keywordsForDelete) {
        const keywordIndex = queryText.indexOf(keyword);
        if (keywordIndex !== -1 && cursorPosition >= keywordIndex + keyword.length) {
          cursorPositionInfo = keyword;
        }
  
        progress[keyword] = keywordIndex !== -1;
      }
    }
  
    progress.cursorAt = cursorPositionInfo;
    return progress;
  }
  
  


};






