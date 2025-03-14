import TokenSimulationModule from '../..';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import AddExporter from '@bpmn-io/add-exporter';


/* My Imports */
import SimulationSupportModule from '../../lib/simulation-support';
import customModule from '../../lib/custom';
import taPackage from '../../ta.json';
import data_store from '../../resources/data-store.js';
import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';
import messageService from './messageService';
import { evalPreCondition,executeEffects} from '../../lib/custom/parsers/effExuecute.js'

import getAll from "../../lib/custom/parsers/finalPreEff.js";

import { processVar,setPro } from '../../lib/custom/parsers/processVar.js';
import { db,setCol,setDb, setTables,col,tables, tableData ,extractTableAttributes} from '../../lib/custom/parsers/db.js';

import parseExpression  from '../../lib/custom/parsers/parser.js'
const toggle = document.getElementById('bts-toggle-mode')
const containerE2 = document.getElementById('textContainer')
const init = document.getElementById('init')
const jsonData = document.getElementById('jsonData')
const process = document.getElementById('process-button')
let con = false;

import fileDrop from 'file-drops';
import fileOpen from 'file-open';
import download from 'downloadjs';
import exampleXML from '../resources/example.bpmn';
import { has } from 'min-dash';

const url = new URL(window.location.href);
const persistent = url.searchParams.has('p');
const active = url.searchParams.has('e');
const presentationMode = url.searchParams.has('pm');
let fileName = 'diagram.bpmn';


function extractAttributesAndTables(jsonText) {
  const result = {
      attributeNames: [],
      tables: []
  };

  try {
      const jsonData = JSON.parse(jsonText);

      if (typeof jsonData === 'object') {
          for (const key in jsonData) {
              if (jsonData.hasOwnProperty(key) && Array.isArray(jsonData[key])) {
                  result.tables.push(key);

                  if (jsonData[key].length > 0 && typeof jsonData[key][0] === 'object') {
                      const attributes = Object.keys(jsonData[key][0]);
                      result.attributeNames.push(...attributes);
                  }
              }
          }
      }
  } catch (error) {
      console.error('Error parsing JSON:', error.message);
  }

  return result;
}
init.addEventListener('click',()=>{

   setDb(JSON.parse(jsonData.value))
   extractTableAttributes(jsonData.value)
   console.log(tableData)
   const res = extractAttributesAndTables(jsonData.value)
   setCol(res.attributeNames);
   setTables(res.tables);
   console.log(db)
   
  if (!con){
  
  const customDate = JSON.parse(jsonData.value)
  checkDatabaseStatus()
    .then(databaseStatus => {
        if (databaseStatus === 'no') {
            // Database is not initialized, proceed with saving custom data
            return saveDataToServer(customDate);
        } else {
            // Database is initialized, log a message or perform other actions
            console.log('Database is already initialized.');
            con = true
        }
    })
    .catch(error => {
        // Handle errors from checkDatabaseStatus or saveDataToServer
        console.error('Error:', error);
    });
  }
  else{
    console.log('Database is already initialized.');
  }
  
  
})

// Function to check if the database is initialized
async function checkDatabaseStatus() {
  try {
    const response = await fetch('http://localhost:3000/check_database');
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.error('Error checking database status:', error);
    throw error; // Propagate the error to the next catch block if needed
  }
}

// Function to save data to the server
async function saveDataToServer(data) {
  try {
    const response = await fetch('http://localhost:3000/populate_database', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ customData: data }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data_1 = await response.json();
    console.log('Data saved successfully:', data_1);
    con = true;
  } catch (error) {
    console.error('Error saving data:', error);
    throw error; // Propagate the error to the next catch block if needed
  }
}

document.addEventListener("DOMContentLoaded", function() {
  const variableInput = document.getElementById("variableInput");
  const processButton = document.getElementById("processButton");

  processButton.addEventListener("click", function() {
    const inputText = variableInput.value;
    const variables = inputText.split(";").map(variable => variable.trim());
    const tupleList = [];
    let hasError = false;

    for (const variable of variables) {
      const match = variable.match(/#(\w+):\s*(string|number|\w+)/);
      if (match) {
        const name = "#" + match[1];
        let value;
        if (Number.isInteger(parseInt(match[2]))) {
          value = parseInt(match[2]);
        } else {
          value = match[2];
        }
        tupleList.push([name, value]);
      } else {
        hasError = true;
        break;
      }
    }

    if (hasError) {
      // Handle the error here, for example, by highlighting the input field in red.
      variableInput.style.borderColor = "red";
      variableInput.style.borderWidth = "2px";
    } else {
      // If no error, remove the red highlight (if any).
      setPro(tupleList)
      variableInput.style.borderColor = "";
      variableInput.style.borderWidth = "";
    }
    console.log(processVar);
   });
});

document.getElementById('process-button').addEventListener("click", function(){

  
  if (varpanel.classList.contains('hidden')){
    varpanel.classList.remove('hidden');
  }
  else {
    varpanel.classList.add('hidden');
  }
});


const initialDiagram = (() => {
  try {
    return persistent && localStorage['diagram-xml'] || exampleXML;
  } catch (err) {
    return exampleXML;
  }
})();
/*
function showMessage(cls, message) {
  const messageEl = document.querySelector('.drop-message');
  messageEl.textContent = message;
  messageEl.className = `drop-message ${cls || ''}`;
  messageEl.style.display = 'block';
  console.log(message)
}

function hideMessage() {
  const messageEl = document.querySelector('.drop-message');
  messageEl.style.display = 'none';
}

if (persistent) {
  hideMessage();
}
*/


const modeler = new BpmnModeler({
  container: '#canvas',
  additionalModules: [

    TokenSimulationModule,
    SimulationSupportModule,
    customModule,
    {
      preserveElementColors: [ 'value', {} ]
    }
  ],
  propertiesPanel: {
    parent: '#properties-panel'
  },
  keyboard: {
    bindTo: document
  },
  moddleExtensions:{
    ta:taPackage
  }

});



function openDiagram(diagram) {


  return modeler.importXML(diagram)
    .then(() => {
      
     
    
    })
    
}



function openFile(files) {

  // files = [ { name, contents }, ... ]

  if (!files.length) {
    return;
  }

 

  fileName = files[0].name;

  openDiagram(files[0].contents);
}

document.body.addEventListener('dragover', fileDrop('Open BPMN diagram', openFile), false);

const moddle = modeler.get('moddle'), modeling = modeler.get('modeling');

function updateQueryFieldById(elementId, text1, text2) {
  // Get the BPMN model element by its ID using the element registry
  const element = modeler.get('elementRegistry').get(elementId);

  // Check if the element exists, has a business object, and is of type 'ta:DataTask'
  if (element && element.businessObject && element.businessObject.$instanceOf('ta:DataTask')) {
    // Get the business object associated with the BPMN element
    const businessObject = getBusinessObject(element);

    // Retrieve or create the ExtensionElements element
    const extensionElements = businessObject.extensionElements || moddle.create('bpmn:ExtensionElements');

let analysisDetails = getExtensionElement(businessObject, 'ta:DataTask');

if (!analysisDetails) {
  analysisDetails = moddle.create('ta:DataTask');

  extensionElements.get('values').push(analysisDetails);
}





modeling.updateProperties(element, {
  extensionElements,
  pre: text1,
  eff: text2
});

    // Ensure that the changes are reflected in the XML
    const bpmnXML = modeler.saveXML({ format: true });
    console.log(bpmnXML); // Log XML to check if the values are included
  }
}


function getExtensionElement(element, type) {
  if (!element.extensionElements) {
    return;
  }

  return element.extensionElements.values.filter((extensionElement) => {
    return extensionElement.$instanceOf(type);
  })[0];
}


// Function to download the BPMN diagram
function downloadDiagram() {



  for (var i = 0;i < dataTask_list.length;i++) {
    let text1 = document.getElementById(dataTask_list[i]+'pre').value
    let text2 = document.getElementById(dataTask_list[i]+'eff').value
    console.log(text1)
    updateQueryFieldById(dataTask_list[i].slice(0,-4), text1,text2);


  }


  // Save and download the BPMN diagram
  modeler.saveXML({ format: true }, function(err, xml) {
    if (!err) {
      download(xml, 'diagram.bpmn', 'application/xml');
    }
  });
}

var downloadButton = document.getElementById('download-button');

// Add a click event listener to the button
downloadButton.addEventListener('click', function() {

 
  downloadDiagram();
});



const propertiesPanel = document.querySelector('#properties-panel');

const propertiesPanelResizer = document.querySelector('#properties-panel-resizer');

let startX, startWidth;

function toggleProperties(open) {

  if (open) {
    url.searchParams.set('pp', '1');
  } else {
    url.searchParams.delete('pp');
  }

  history.replaceState({}, document.title, url.toString());

  propertiesPanel.classList.toggle('open', open);
}

propertiesPanelResizer.addEventListener('click', function(event) {
  toggleProperties(!propertiesPanel.classList.contains('open'));
});

propertiesPanelResizer.addEventListener('dragstart', function(event) {
  const img = new Image();
  img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  event.dataTransfer.setDragImage(img, 1, 1);

  startX = event.screenX;
  startWidth = propertiesPanel.getBoundingClientRect().width;
});

propertiesPanelResizer.addEventListener('drag', function(event) {

  if (!event.screenX) {
    return;
  }

  const delta = event.screenX - startX;

  const width = startWidth - delta;

  const open = width > 200;

  propertiesPanel.style.width = open ? `${width}px` : null;

  toggleProperties(open);
});

const remoteDiagram = url.searchParams.get('diagram');

if (remoteDiagram) {
  fetch(remoteDiagram).then(
    r => {
      if (r.ok) {
        return r.text();
      }

      throw new Error(`Status ${r.status}`);
    }
  ).then(
    text => openDiagram(text)
  ).catch(
    err => {
      console.log(err)

      openDiagram(initialDiagram);
    }
  );
} else {
  openDiagram(initialDiagram);
}

toggleProperties(url.searchParams.has('pp'));


const databaseButton = document.getElementById('database-button')

const connection = document.getElementById('connection')

databaseButton.addEventListener('click', function () {
   

    if (connection.classList.contains('hidden')){
      connection.classList.remove('hidden');
    }
    else if (!false){
      connection.classList.add('hidden');
    }
    
  
});
window.addEventListener('click', (event) => {
  const { target } = event;

  if (!connection.contains(target) && target !== databaseButton ) {
    connection.classList.add('hidden');
    
  }
  if (!varpanel.contains(target) && target !== process) {
    varpanel.classList.add('hidden');
  }
 
});

// Get the SimulationSupport service from the modeler
const simulationSupport = modeler.get('simulationSupport');

// Enable simulation
simulationSupport.toggleSimulation(true);
let isRunning = true;
let simCall = false
window.onload = function(){

  const div = document.querySelector(".bts-toggle-mode");
const myDiv = document.createElement('div');myDiv.id='bobr'
myDiv.style.width = '200px';
myDiv.style.height = '50px';
myDiv.style.padding = div.style.padding;
myDiv.style.position = 'absolute';
myDiv.style.top = '20px';
myDiv.style.left = '20px';


myDiv.addEventListener('click',function(){
    
   if(isRunning){
    isRunning=false
   }
   else{
    myDiv.style.pointerEvents='none'
    isRunning=true

    if(!simCall)
      simulateProcess()
   }

    console.log(isRunning)
    
  div.click()
  
});
document.body.appendChild(myDiv)
};

// You might want to put the simulation process in a function or event handler
async function simulateProcess() {
  console.log('Bobr Kurwa');

  while (isRunning) {
    try {
      simCall=true;
      const result = await simulationSupport.elementEnter('ta:DataTask');

      if (!isRunning) {
        console.log('Operation cancelled');
        break; // Exit the loop if isRunning is false
      }

      const datatask = document.getElementById(`${result.element.id}drop`);
   

      if (!datatask.pre || !datatask.eff || !datatask.pre.isPared || !datatask.eff.isPared) {
        alert('Preconditions and effects must both be parsed correctly.');
        document.querySelector('.bts-toggle-mode').dispatchEvent(new Event('click'));
      } else {
        const execute = document.getElementById(`${result.element.id}exe`);
        await execute.click();
        console.log('Button click event fully processed');
        console.log(result.element.id)
        simCall=false;
        // Additional actions to be performed after the button click event
      }
    } catch (error) {
      // Handle errors here
      console.error('Error:', error);
    } finally {
      document.getElementById('bobr').style.pointerEvents = 'auto';
    }
  }
}





// Call the simulation function to start the simulation process
 
const overlays = modeler.get('overlays');

var datataskTriggered = false

var dataTask_list =[];

function createDropdown(param,db) {
  const dropdown = document.createElement('div');
  dropdown.className = 'dynamicDropdown';
  dropdown.id=param+'drop'
  getAll(dropdown,col,tables,processVar,db)
  
  

  const submitButton = document.createElement('button');
  submitButton.textContent = 'Execute';
  submitButton.id = param+'exe';
  dataTask_list.push(param+'drop')
  console.log(submitButton.id)

  submitButton.addEventListener('click', async function() {
    return new Promise(async (resolve) => {

      while (datataskTriggered) {
        await new Promise(resolve => setTimeout(resolve, 100)); // Adjust the polling interval as needed
      }
      datataskTriggered = true;
  
      var elements = document.querySelectorAll(".bts-entry");
      var playPause = null
      // Iterate through the elements
      elements.forEach(function(element) {
          // Check if the element has a specific title
          if (element.getAttribute("title") === "Play/Pause Simulation") {
            playPause= element;
              // Dispatch the click event for the matching element
              playPause.dispatchEvent(new Event('click'));
          }
      });
      console.log(dropdown.pre);
      console.log(dropdown.eff);
      let n;
      if (dropdown.pre != undefined && dropdown.eff != undefined) {
        if (dropdown.pre.isPared && dropdown.eff.isPared) {
          n = await evalPreCondition(dropdown.pre.n, col);
  
          if (n.isTrue != undefined) {
            console.log('Precondition is: ' + n.isTrue);
            if (n.isTrue) {
              let attributeList = [];
  
              if (dropdown.pre.n.includes('SELECT')) {
                // Extract attributes and table from the SQL SELECT statement
                const match = /SELECT\s+([^]+?)\s+FROM\s+([^]+?)(?:\s+WHERE|$)/i.exec(dropdown.pre.n);
  
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
  
              await executeEffects(dropdown.eff.n, n.result, attributeList);
              playPause.dispatchEvent(new Event('click'));
            }
          }
        }
      }
      datataskTriggered = false;
      resolve();
    });
  });
  

  dropdown.appendChild(submitButton);

  

  return dropdown;
}

function createButton(func,param,db) {
  const button = document.createElement('button');


  const icon = document.createElement('i');
  icon.className = 'fa-solid fa-caret-down';
  button.appendChild(icon);
  button.className = 'dynamicButton';

  let dropdown =null;
  if(param==null){
    dropdown = func();
  }
  else {
    dropdown = func(param,db)
  }

  dropdown.style.visibility = 'hidden';
  dropdown.style.pointerEvents = 'none';
  
  button.appendChild(dropdown);
  dropdown.addEventListener('click', (event) => {
    event.stopPropagation();
  });
  
  button.addEventListener('click', () => {
    if (dropdown.style.visibility === 'hidden') {
      dropdown.style.visibility = 'visible';
      dropdown.style.pointerEvents = 'auto';
      icon.style.transform='rotate(180deg)';
    } else {
      dropdown.style.visibility = 'hidden';
      dropdown.style.pointerEvents = 'none';
      icon.style.transform='rotate(0deg)';
    }
  });

  return button;
}

function createCondition(id){
  const cond = document.createElement('div')
  const textarea = document.createElement('textarea');textarea.placeholder='Write condition e.g. #var !=5';textarea.style.width='178px';textarea.style.height='60px';
  textarea.position='relative';textarea.stopPropagation
  const evaluate = document.createElement('button'); evaluate.textContent='Evaluate condition'
  evaluate.addEventListener("click", function(){
    try{
      
      parseExpression(textarea.value,processVar,col)
      if(messageService.exist(id)!=null){
        messageService.remove(id)
      }
      messageService.add(id,textarea.value)
    }catch(err){
      alert(err)
    }
  })

  cond.appendChild(textarea);cond.appendChild(evaluate);
  return cond;
}

modeler.get('eventBus').on('shape.added', (event) => {
  const shape = event.element;

  /*
  if(shape.businessObject && shape.businessObject.$instanceOf('bpmn:ExclusiveGateway')) {

   
    let cond = createButton(createCondition)
    overlays.add(shape.id, 'note', {
      position: {
        bottom: 5,
        right: 67
      },
      show: {
        minZoom: 0.7
      },
      html: cond 
    });
  }
  */
  
  // Check if the shape is a BPMN element (excluding labels)
  
  if (shape.businessObject && shape.businessObject.$instanceOf('ta:DataTask')) {
    
    
    const  businessObject  = getBusinessObject(shape);

   // const extensionElements = businessObject.extensionElements;
    let datatask = getExtensionElement(businessObject, 'ta:DataTask');
    

    const extensionElements = businessObject.extensionElements || moddle.create('bpmn:ExtensionElements');

    if (!datatask) {
      datatask = moddle.create('ta:DataTask');

      extensionElements.get('values').push(datatask);
    }

    console.log(datatask)
    const button = createButton(createDropdown,shape.id,db);
   
    document.getElementById('buttonContainer').appendChild(button);

    // Use a unique event name based on the shape's ID
    const eventName = `buttonPressed:${shape.id}`;

    // Add an event listener to the button to trigger the custom event
    button.addEventListener('click', () => {
      modeler.get('eventBus').fire(eventName);
    });

   

    overlays.add(shape.id, 'note', {
      position: {
        bottom: 5,
        right: 77
      },
      show: {
        minZoom: 0.7
      },
      html: button 
    });

    overlays.add(shape.id,"note", {
      position:{
        bottom: 75,
        right:95
      },
      show:{
        minZoom: 0.7
      },
      html: data_store
    });
  }


  //alert('Must initalize database before creating datatask.')
});


modeler.get('eventBus').on('element.changed', (event) => {
  const element = event.element;

  if (/.*data$/.test(element.id)) {
    // Add the button
    let cond = createButton(createCondition,element.id);
    cond.id = element.id + 'cond';
    overlays.add(element.id, 'note', {
      position: {
        bottom: 6,
        right: 67,
      },
      show: {
        minZoom: 0.7,
      },
      html: cond,
    });
  } else if (/^SequenceFlow.*/.test(element.id)) {
    // Remove the button
    const buttonId = element.id + 'datacond';
    const button = document.getElementById(buttonId);

    if (button) {
      button.remove();
    }
  }
});


modeler.get('eventBus').on('element.added', (event) => {
  const element = event.element;
  console.log(element.id)
  if (/.*data$/.test(element.id)) {
    // Add the button
    
    let cond = createButton(createCondition,element.id);
    cond.id = element.id + 'cond';
    overlays.add(element.id, 'note', {
      position: {
        bottom: 6,
        right: 67,
      },
      show: {
        minZoom: 0.7,
      },
      html: cond,
    });
  } 
});
