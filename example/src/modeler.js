import TokenSimulationModule from '../..';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import AddExporter from '@bpmn-io/add-exporter';

//anton og jesper imports 

/* My Imports */
import SimulationSupportModule from '../../lib/simulation-support';

import customModule from '../../lib/custom';
import taPackage from '../../ta.json';
import data_store from '../../resources/data-store.js';
import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';
import messageService from './messageService';
import { evalPreCondition, executeEffects } from '../../lib/custom/parsers/effExuecute.js'


import { PauseIcon, PlayIcon, ExclamationTriangleIcon, CheckCircleIcon, TimesCircleIcon } from '../../lib/icons/index.js';
import { getLogger } from '../../lib/features/log/logger.js';
import { getCurrentScope } from '../../lib/features/log/Log.js';



import getAll from "../../lib/custom/parsers/finalPreEff.js";
import getTextBoxes from '../../lib/custom/parser2/textBox.js';
import handleEffect from '../../lib/custom/parser2/effect.js';
import handlePreCon from '../../lib/custom/parser2/preCon.js';
import { processVarParser, inputVarParser, chooseSelRes } from '../../lib/custom/parser2/varriableChanger.js';

import { processVar, setPro } from '../../lib/custom/parsers/processVar.js';
import { db, setCol, setDb, setTables, col, tables, tableData, extractTableAttributes } from '../../lib/custom/parsers/db.js';

import parseExpression from '../../lib/custom/parsers/parser.js'
const toggle = document.getElementById('bts-toggle-mode')
const containerE2 = document.getElementById('textContainer')
const init = document.getElementById('init')
const jsonData = document.getElementById('jsonData')
const process = document.getElementById('process-button')
let con = false;

import fileDrop from 'file-drops';
import fileOpen from 'file-open';
import download from 'downloadjs';
import exampleXML from '../resources/jobApplication.bpmn';
import { has } from 'min-dash';
import { RESET_SIMULATION_EVENT, TOGGLE_MODE_EVENT } from '../../lib/util/EventHelper.js';
import { event } from 'min-dom';

const url = new URL(window.location.href);
const persistent = url.searchParams.has('p');
const active = url.searchParams.has('e');
const presentationMode = url.searchParams.has('pm');
let fileName = 'diagram.bpmn';








document.addEventListener("DOMContentLoaded", function () {
  const variableInput = document.getElementById("variableInput");
  const processButton = document.getElementById("processButton");

  processButton.addEventListener("click", function () {
    const inputText = variableInput.value;
    const variables = inputText.split(";").map(variable => variable.trim());
    const tupleList = [];
    let hasError = false;

    for (const variable of variables) {
      const match = variable.match(/#(\w+):\s*(string|number|\w+)/);
      console.log(match)
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
  processButton.click();
});

document.getElementById('process-button').addEventListener("click", function () {


  if (varpanel.classList.contains('hidden')) {
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
      preserveElementColors: ['value', {}]
    }
  ],
  propertiesPanel: {
    parent: '#properties-panel'
  },
  keyboard: {
    bindTo: document
  },
  moddleExtensions: {
    ta: taPackage,
    custom: {
      "name": "Custom",
      "uri": "http://example.com/custom",
      "prefix": "custom",
      "xml": {
        "tagAlias": "lowerCase"
      },
      "types": [
        {
          "name": "VariableInput",
          "superClass": ["Element"],
          "properties": [
            {
              "name": "value",
              "type": "String"
            }
          ]
        }
      ]
    }
  }

});



async function openDiagram(diagram) {
  try {
    // Import the XML
    const { warnings } = await modeler.importXML(diagram);
    console.log('Import warnings:', warnings);

    // Access the element registry
    const elementRegistry = modeler.get('elementRegistry');

    const dataTaskPromises = [];
    // Iterate over all elements in the diagram
    elementRegistry.forEach((element) => {
      // console.log('Element ID:', element.type);
      // Check if the element is of a data task
      if (element.businessObject && element.businessObject.$instanceOf('ta:DataTask')) {
        const p = new Promise(resolve => {
          // Custom parsing logic for the element
          document.getElementById(element.id + 'drop').sqlEditor.value = element.businessObject.text;
          document.getElementById(element.id + 'drop').label.textContent = element.businessObject.text;
          resolve();
        });
        dataTaskPromises.push(p);
      }
      else if ((/.*data$/.test(element.id))) {

        let cond = createButton(createCondition, element.id);
        cond.id = element.id + 'cond';
        console.log(cond.id, 'cond id')
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
        document.getElementById(element.id + 'cond').querySelector('textarea').value = element.businessObject.$attrs.text;
      }
    });

    await Promise.all(dataTaskPromises);

    const extensionElements = modeler.getDefinitions().extensionElements;
    if (extensionElements) {
      const variableInputElement = extensionElements.values.find(
        (el) => el.$type === 'custom:VariableInput'
      );
      if (variableInputElement) {
        document.getElementById('variableInput').value = variableInputElement.value || '';
        console.log('Variable input loaded:', variableInputElement.value);
      } else {
        document.getElementById('variableInput').value = '';
        console.log('No variable input found in extension elements.');
      }
    } else {
      document.getElementById('variableInput').value = '';
      console.log('No extension elements found.');
    }

    document.getElementById('processButton').click();

    console.log('Diagram loaded and elements parsed.');
    //jesper

    await new Promise(resolve => {
      const check = () => {
        const ready = dataTask_list.every(id => {
          const el = document.getElementById(id);
          return el && el.querySelector('textarea') && el.querySelector('button');
        });

        if (ready) {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });



    const toggleBtn = document.querySelector('.bts-toggle-mode');
    if (toggleBtn) {
      toggleBtn.click();

    }
    setTimeout(() => {
      if (!simCall) {
        console.log('Starting simulateProcess automatically...');
        simulateProcess();
      }
    }, 500);



  } catch (err) {
    console.error('Error loading diagram:', err.message, err.warnings);
  }
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

async function updateQueryFieldById(elementId, text1, text2) {
  //debugger
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
      text: text1
    });

    // Ensure that the changes are reflected in the XML
    const bpmnXML = await modeler.saveXML({ format: true });
    console.log(bpmnXML); // Log XML to check if the values are included
  }
}

function updateConditionFieldById(elementId, text) {
  const element = modeler.get('elementRegistry').get(elementId);
  if (element) {

    modeling.updateProperties(element, {
      text: text
    });
  }
}

function getExtensionElement(element, type) {
  if (!element.extensionElements) {
    return;
  }
  console.log(element.extensionElements.values);

  return element.extensionElements
}


// Function to download the BPMN diagram
async function downloadDiagram() {

  const elementRegistry = modeler.get('elementRegistry');

  elementRegistry.forEach((element) => {
    if (/.*data$/.test(element.id) && document.getElementById(element.id + 'cond') !== null) {
      const condtext = document.getElementById(element.id + 'cond').querySelector('textarea').value;
      console.log(condtext);
      try {
        updateConditionFieldById(element.id, condtext);
      }
      catch (err) {
        console.error('Error updating condition field:', err);

      }
    }
  });

  console.log('DataTask list:', dataTask_list);

  dataTask_list = dataTask_list.filter(item => document.getElementById(item) !== null);

  for (var i = 0; i < dataTask_list.length; i++) {
    let text1 = document.getElementById(dataTask_list[i]).sqlEditor.value;

    console.log(text1);
    updateQueryFieldById(dataTask_list[i].slice(0, -4), text1);
  }

  let extensionElements = modeler.getDefinitions().extensionElements;
  if (!extensionElements) {
    extensionElements = moddle.create('bpmn:ExtensionElements', {
      values: []
    });
    modeler.getDefinitions().extensionElements = extensionElements;
  }
  let variableInputElement = extensionElements.values.find(
    (el) => el.$type === 'custom:VariableInput'
  );

  if (!variableInputElement) {
    // Create a new custom element for variableInput
    variableInputElement = moddle.create('custom:VariableInput', {
      value: document.getElementById('variableInput').value,
    });
    extensionElements.values.push(variableInputElement);
  } else {
    // Update the existing custom element
    variableInputElement.value = document.getElementById('variableInput').value;
  }
  console.log(variableInputElement);

  try {
    // Use the Promise-based API for saveXML
    const { xml } = await modeler.saveXML({ format: true });
    download(xml, 'diagram.bpmn', 'application/xml');
  } catch (err) {
    console.error('Error saving XML:', err);
  }
}

var downloadButton = document.getElementById('download-button');

// Add a click event listener to the button
downloadButton.addEventListener('click', function () {
  console.log(TOGGLE_MODE_EVENT.active);
  if (TOGGLE_MODE_EVENT.active) {
    alert('Please exit simulation mode before downloading the diagram.');
    return;
  }

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

propertiesPanelResizer.addEventListener('click', function (event) {
  toggleProperties(!propertiesPanel.classList.contains('open'));
});

propertiesPanelResizer.addEventListener('dragstart', function (event) {
  const img = new Image();
  img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  event.dataTransfer.setDragImage(img, 1, 1);

  startX = event.screenX;
  startWidth = propertiesPanel.getBoundingClientRect().width;
});

propertiesPanelResizer.addEventListener('drag', function (event) {

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





const mariadbButton = document.getElementById('mariadb-button')
const tablePanel = document.getElementById('table-panel');
const tableList = document.getElementById('table-list');
const dbwindowbtn = document.getElementById('open-tables-page').addEventListener('click', () => {
  window.open("http://localhost:3000/DBWindow.html", "_blank");


});
document.getElementById('back-button').addEventListener('click', () => {
  document.getElementById('table-data-view').style.display = 'none';
  document.getElementById('table-list-view').style.display = 'block';
  document.getElementById('table-panel').classList.remove('expanded');
});

mariadbButton.addEventListener('click', async () => {

  console.log('MariaDB button clicked!');


  // Toggle popup
  if (tablePanel.classList.contains('hidden')) {
    tablePanel.classList.remove('hidden');
  } else {
    tablePanel.classList.add('hidden');
    return;
  }
  tableList.innerHTML = '<li>Loading...</li>';

  try {
    const res = await fetch('http://localhost:3000/api/allTables');
    const tables = await res.json();
    if (!Array.isArray(tables) || tables.length === 0) {
      tableList.innerHTML = '<li>No tables found</li>';
      return;
    }

    tableList.innerHTML = '';
    tables.forEach(table => {
      const li = document.createElement('li');
      li.innerHTML = `<a href="#" data-table="${table}">${table}</a>`;
      li.querySelector('a').addEventListener('click', async (e) => {
        e.preventDefault();
        const tableName = e.target.dataset.table;
        await fetchAndDisplayTableData(tableName);
        document.getElementById('table-panel').classList.add('expanded');
      });
      tableList.appendChild(li);
    });
    console.log('Tables fetched successfully:', tables);

  } catch (err) {
    console.error('Failed to fetch tables:', err);
    tableList.innerHTML = '<li>Error loading tables</li>';
  }

});

async function fetchAndDisplayTableData(tableName) {
  try {
    const res = await fetch(`http://localhost:3000/api/table/${tableName}`);
    const rows = await res.json();

    // Update title
    document.getElementById('table-title').innerText = `Rows in "${tableName}"`;

    const table = document.getElementById('table-data');
    table.innerHTML = '';

    if (rows.length === 0) {
      table.innerHTML = '<tr><td colspan="100%">No data</td></tr>';
    } else {
      // Headers
      const headers = Object.keys(rows[0]);
      const thead = document.createElement('tr');
      headers.forEach(h => {
        const th = document.createElement('th');
        th.textContent = h;
        thead.appendChild(th);
      });
      table.appendChild(thead);

      // Data rows
      rows.forEach(row => {
        const tr = document.createElement('tr');
        headers.forEach(h => {
          const td = document.createElement('td');
          td.textContent = row[h];
          tr.appendChild(td);
        });
        table.appendChild(tr);
      });
    }

    // Toggle views
    document.getElementById('table-list-view').style.display = 'none';
    document.getElementById('table-data-view').style.display = 'block';

  } catch (err) {
    console.error("Error fetching table data:", err);
  }
}



const connection = document.getElementById('connection')


window.addEventListener('click', (event) => {
  const { target } = event;


  if (!varpanel.contains(target) && target !== process) {
    varpanel.classList.add('hidden');
  }

  if (!tablePanel.contains(target) && target !== mariadbButton) {
    tablePanel.classList.add('hidden');
  }

});

// Get the SimulationSupport service from the modeler
const simulationSupport = modeler.get('simulationSupport');

// Enable simulation


//simulationSupport.toggleSimulation(true);
let isRunning = true;
let simCall = false

window.onload = function () {

  const div = document.querySelector(".bts-toggle-mode");
  const myDiv = document.createElement('div'); myDiv.id = 'bobr'
  myDiv.style.width = '200px';
  myDiv.style.height = '50px';
  myDiv.style.padding = div.style.padding;
  myDiv.style.position = 'absolute';
  myDiv.style.top = '20px';
  myDiv.style.left = '20px';


  myDiv.addEventListener('click', function () {

    if (isRunning) {
      isRunning = false
    }
    else {
      myDiv.style.pointerEvents = 'none'
      isRunning = true

      if (!simCall)
        simulateProcess()
    }

    console.log(isRunning)

    div.click()

  });
  document.body.appendChild(myDiv)
};

//starter den i false til at starte med - Jesper 
//simulationSupport.toggleSimulation(false);
let simulationLoop = null;

async function simulateProcess() {

  if (simulationLoop) {
    console.warn('Simulation already running!');
    return;
  }

  simulationLoop = (async () => {
    while (isRunning) {
      try {
        console.log('Simulation started!');
        simCall = true;
        const result = await simulationSupport.elementEnter('ta:DataTask');
        console.log('Simulation result:', result);

        const datatask = document.getElementById(`${result.element.id}drop`);

        const textarea = document.getElementById(`${datatask.id}sql`);

        const execute = document.getElementById(`${result.element.id}exe`);
        await simulateExecution(result.element.id);

        while (isPaused) {
          console.log('Simulation paused...waiting for fix.');
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        console.log('Simulation step complete:', result.element.id);

        simCall = false;
        console.log('Simulation completed successfully!');

        modeler.get('eventBus').fire('tokenSimulation.simulator.trace', {
          element: result.element,
          scope: result.scope
        });
        console.log('Element exited successfully!');

        // Additional actions to be performed after the button click event

      } catch (error) {
        // Handle errors here
        console.error('Error:', error);
      } finally {
        document.getElementById('bobr').style.pointerEvents = 'auto';
      }
    }

    simulationLoop = null;
  })();

}





// Call the simulation function to start the simulation process

const overlays = modeler.get('overlays');

var datataskTriggered = false

var dataTask_list = [];

let lastFailedDataTaskId = null;
let isPaused = false;

function extractPreAndEffect(input) {
  const pattern = /^\s*when\s+(.*?)\s+then\s+(.*)$/is;
  const match = input.match(pattern);

  if (match) {
    const pre = match[1].trim();
    const effect = match[2].trim();
    return { pre, effect };
  } else {
    // No "when ... then" pattern, treat entire string as the effect
    return { pre: undefined, effect: input.trim() };
  }
}

async function simulateExecution(elementId) {

  return new Promise(async (resolve) => {
    modeler.get('eventBus').fire('tokenSimulation.pauseSimulation');


    try {

      const dropdown = document.getElementById(`${elementId}drop`);
      const textWithUserInput = await inputVarParser(dropdown.sqlEditor.value);
      const sql = extractPreAndEffect(textWithUserInput);

      console.log("preCon: " + sql.pre);
      console.log("Effect: " + sql.effect);

      if (sql.pre != undefined) {
        sql.pre = processVarParser(sql.pre);
        console.log("cleared processVarParser")
        let preCon = await handlePreCon(sql.pre);
        console.log("cleared handlePreCon")
        if (preCon.isTrue) {
          sql.effect = await chooseSelRes(sql.effect, preCon.result);

          getLogger().log({
            text: "Precondition True: executing effect",
            icon: CheckCircleIcon(),
            scope: getCurrentScope()
          });

          await handleEffect(sql.effect);
          modeler.get('eventBus').fire('tokenSimulation.playSimulation');
          resolve(); // Move only if successful

        } else {
          getLogger().log({
            text: "Precondition false: ignoring effect",
            icon: TimesCircleIcon(),
            scope: getCurrentScope()
          });
          modeler.get('eventBus').fire('tokenSimulation.playSimulation');
          resolve(); // Move only if successful
        }
      } else {

        await handleEffect(sql.effect);
        modeler.get('eventBus').fire('tokenSimulation.playSimulation');
        resolve(); // Success


      }
    } catch (error) {
      console.error('Effect failed, waiting for user fix.', error);
      // WAIT for user to confirm new query

      waitForUserCorrection(elementId, resolve);

    }
  });
}
let hasPaused = true;

function waitForUserCorrection(elementId, resolve) {
  if (hasPaused) {
    getLogger().log({
      text: "Paused until user corrects SQL",
      icon: PauseIcon(),
      scope: getCurrentScope()
    });
    hasPaused = false;
  }


  console.log('Waiting for user to correct SQL...');
  const popup = document.getElementById('custom-sql-popup');
  const textarea = document.getElementById('custom-sql-textarea');
  const confirmButton = document.getElementById('custom-sql-confirm');
  const cancelButton = document.getElementById('custom-sql-cancel');
  const dropdown = document.getElementById(`${elementId}drop`);
  const sqlEditor = dropdown?.querySelector('textarea');
  textarea.value = sqlEditor.value; // Clear previous value
  popup.style.display = 'block';
  confirmButton.disabled = false;

  confirmButton.onclick = async function () {
    confirmButton.disabled = true;
    popup.style.display = 'none';

    const newQuery = textarea.value;

    if (sqlEditor) {
      sqlEditor.value = newQuery;
    }

    try {
      // Re-attempt the execution after user correction
      await simulateExecution(elementId);
    } catch (e) {
      console.error('Still error after correction:', e);
    }

    modeler.get('eventBus').fire('tokenSimulation.playSimulation');

    if (!hasPaused) {
      getLogger().log({
        text: "Resuming simulation!",
        icon: PlayIcon(),
        scope: getCurrentScope()
      });
      hasPaused = true; // Reset the flag for the next pause

    }

    resolve(); // <-- Important: Only resolve AFTER correction
  }

  cancelButton.onclick = function () {

    getLogger().log({
      text: "Simulation Cancelled...Reseting!",
      icon: ExclamationTriangleIcon(),
      scope: getCurrentScope()
    });

    popup.style.display = 'none';

    setTimeout(() => {
      isRunning = false;
      hasPaused = true;
      modeler.get('eventBus').fire('tokenSimulation.resetSimulation');
      resolve(); // Resolve after delay
      simulationSupport.toggleSimulation(false);
    }, 2000); // 3000 milliseconds = 3 seconds
  }
}

export function resetSimInModeller() {
  console.warn('Resetting simulation from resetSimInModeller()');
  isRunning = false;
  simCall = false;

  modeler.get('eventBus').fire('tokenSimulation.resetSimulation');
  simulationSupport.toggleSimulation(false);
  console.log('Simulation reset successfully!');
}


function createDropdown(param, db) {
  const dropdown = document.createElement('div');
  dropdown.className = 'dynamicDropdown';
  dropdown.id = param + 'drop';
  getTextBoxes(dropdown, modeler.get('eventBus'));

  dropdown.addEventListener('mousedown', function (event) {
    event.stopPropagation();
  });

  dropdown.addEventListener('click', function (event) {
    event.stopPropagation();
  });

  const submitButton = document.createElement('button');
  submitButton.textContent = 'Execute';
  submitButton.id = param + 'exe';
  dataTask_list.push(param + 'drop');

  submitButton.addEventListener('click', async function () {
    return new Promise(async (resolve) => {

      while (datataskTriggered) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      datataskTriggered = true;

      var elements = document.querySelectorAll(".bts-entry");
      var playPause = null
      // Iterate through the elements
      elements.forEach(function (element) {
        // Check if the element has a specific title
        if (element.getAttribute("title") === "Play/Pause Simulation") {
          playPause = element;
          // Dispatch the click event for the matching element
          playPause.dispatchEvent(new Event('click'));
        }
      });

      console.log("dropdownsql: " + dropdown.sqlEditor.value);
      const textWithUserInput = await inputVarParser(dropdown.sqlEditor.value);
      const sql = extractPreAndEffect(textWithUserInput);
      console.log("preCon: " + sql.pre);
      console.log("Effect: " + sql.effect);
      try {
        //vores pis kode
        if (sql.pre != undefined) {
          sql.pre = processVarParser(sql.pre);
          let preCon = await handlePreCon(sql.pre);
          if (preCon.isTrue) {
            try {
              sql.effect = await chooseSelRes(sql.effect, preCon.result);

              handleEffect(sql.effect);

            } catch (err) {
              console.error(err)
            }
          }
        }
        else {
          try {
            handleEffect(sql.effect);
          } catch (err) {
            console.error(err)
          }
        }
      } catch (err) {
        console.error(err)
        // Handle the error here, e.g., show an error message to the user
        alert('Error executing SQL: ' + err.message);
      }





      //hans pis kode 
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

  modeler.get('eventBus').on(TOGGLE_MODE_EVENT, (isToggleMode) => {
    if (isToggleMode.active) {
      submitButton.style.display = 'none';
    } else {
      submitButton.style.display = 'block';
    }
  });

  dropdown.appendChild(submitButton);

  return dropdown;
}

function createButton(func, param, db) {
  const wrapper = document.createElement('div');
  wrapper.style.position = 'relative';


  const button = document.createElement('button');

  const icon = document.createElement('i');
  icon.className = 'fa-solid fa-caret-down';
  button.appendChild(icon);
  button.className = 'dynamicButton';
  button.style.width = '30px';

  let dropdown = param == null ? func() : func(param, db);

  dropdown.style.display = 'none';
  dropdown.style.pointerEvents = 'none';

  wrapper.appendChild(button);
  wrapper.appendChild(dropdown);

  dropdown.addEventListener('mousedown', function (event) {
    event.stopPropagation();
  });

  button.addEventListener('click', function (event) {
    event.stopPropagation();

    if (dropdown.style.display === 'none') {
      dropdown.style.display = 'block';
      dropdown.style.pointerEvents = 'auto';
      icon.style.transform = 'rotate(180deg)';
    } else {
      dropdown.style.display = 'none';
      dropdown.style.pointerEvents = 'none';
      icon.style.transform = 'rotate(0deg)';
    }
  });

  return wrapper;
}

function createCondition(id) {
  const cond = document.createElement('div')
  const textarea = document.createElement('textarea'); textarea.placeholder = 'Write condition e.g. #var !=5'; textarea.style.width = '178px'; textarea.style.height = '60px';
  textarea.position = 'relative'; textarea.stopPropagation
  const evaluate = document.createElement('button'); evaluate.textContent = 'Evaluate condition'
  evaluate.addEventListener("click", function () {
    try {

      parseExpression(textarea.value, processVar, col)
      if (messageService.exist(id) != null) {
        messageService.remove(id)
      }
      messageService.add(id, textarea.value)
    } catch (err) {
      alert(err)
    }
  })

  const label = document.createElement('label');
  label.style.display = 'none';
  label.textContent = textarea.value;


  modeler.get('eventBus').on(TOGGLE_MODE_EVENT, (isToggleMode) => {
    if (isToggleMode.active) {
      textarea.style.display = 'none';
      label.style.display = 'inline-block';
      label.textContent = textarea.value;
      label.classList.add('label-expanded');
      evaluate.style.display = 'none';
      messageService.remove(id)
      messageService.add(id, textarea.value)
    } else {
      evaluate.style.display = 'block';
      textarea.style.display = 'block';
      label.style.display = 'none';
      label.classList.remove('label-expanded'); 
    }
  });

  cond.appendChild(textarea);
  cond.appendChild(evaluate);
  cond.appendChild(label);
  return cond;
}

modeler.get('eventBus').on('shape.added', (event) => {
  const shape = event.element;


  // Check if the shape is a BPMN element (excluding labels)

  if (shape.businessObject && shape.businessObject.$instanceOf('ta:DataTask')) {

    const businessObject = getBusinessObject(shape);

    // const extensionElements = businessObject.extensionElements;
    let datatask = getExtensionElement(businessObject, 'ta:DataTask');

    const extensionElements = businessObject.extensionElements || moddle.create('bpmn:ExtensionElements');

    if (!datatask) {
      datatask = moddle.create('ta:DataTask');

      extensionElements.get('values').push(datatask);
    }

    const button = createButton(createDropdown, shape.id, db);

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

    overlays.add(shape.id, "note", {
      position: {
        bottom: 75,
        right: 95
      },
      show: {
        minZoom: 0.7
      },
      html: data_store
    });
  }


  //alert('Must initalize database before creating datatask.')
});


modeler.get('eventBus').on('element.changed', (event) => {
  const element = event.element;

  // Check if the element still exists in the elementRegistry
  const elementRegistry = modeler.get('elementRegistry');
  const existingElement = elementRegistry.get(element.id);

  if (!existingElement) {
    return;
  }
  // Existing logic for handling changes
  if (/.*data$/.test(element.id) && document.getElementById(element.id + 'cond') === null) {

    let cond = createButton(createCondition, element.id);
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
  } else if (/^Flow.*/.test(element.id) && !/.*data$/.test(element.id) && !/.*label$/.test(element.id)) {
    const buttonId = element.id + 'datacond';
    const button = document.getElementById(buttonId);
    const buttons = document.querySelectorAll(`#${buttonId}`);
    if (button) {
      button.remove();
    }
  }
});