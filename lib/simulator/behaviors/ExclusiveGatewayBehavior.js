import {
  filterSequenceFlows
} from '../util/ModelUtil';

import {
  is,
  getBusinessObject
} from 'bpmn-js/lib/util/ModelUtil';


import messageService from '../../../example/src/messageService';

export default function ExclusiveGatewayBehavior(simulator, scopeBehavior) {
  this._scopeBehavior = scopeBehavior;
  this._simulator = simulator;

  simulator.registerBehavior('bpmn:ExclusiveGateway', this);
}

ExclusiveGatewayBehavior.prototype.enter = function(context) {
  this._simulator.exit(context);
};

ExclusiveGatewayBehavior.prototype.exit = function(context) {

  const {
    element,
    scope
  } = context;

  // depends on UI to properly configure activeOutgoing for
  // each exclusive gateway

  const outgoings = filterSequenceFlows(element.outgoing);

  

  if (outgoings.length === 1) {
    return this._simulator.enter({
      element: outgoings[0],
      scope: scope.parent
    });
  }

  const {
    activeOutgoing
  } = this._simulator.getConfig(element);

  
  let outgoing;
  
  if (outgoings.length>2){
    const validIds = getValidOutgoings(outgoings);
    const notValidIds =getItemsInListAOnly(outgoings,validIds);
    const trueValues = getIdsWithTrueValues(validIds);

    if(trueValues.length==0){
      if (notValidIds.length==0){
        document.querySelector('.bts-toggle-mode').dispatchEvent(new Event('click'));
        alert('ERROR: No valid outgoing sequence flows');
      }
      else{
        outgoing = getRandomItemFromArray(notValidIds);
      }
      
    }
    else{
        outgoing = getRandomItemFromArray(trueValues);
    }

  }
  else if (outgoings.length==2) {
 
    const validIds = getValidOutgoings(outgoings);
   
    if(validIds.length==0){
      
      outgoing=activeOutgoing;
    }

    else if(validIds.length==1){
      if(messageService.getValue(getBusinessObject(validIds[0]).id)){
        outgoing=validIds[0]
      } else{
        
        outgoing=getItemsInListAOnly(outgoings,validIds)[0];
      }
    }
    else{
      const result = getIdsWithTrueValues(validIds);
   
      if(result.length==0){
        document.querySelector('.bts-toggle-mode').dispatchEvent(new Event('click'));
        alert('ERROR: All conditions evalutate to false.');
      }
      else if (result.length==1){
        outgoing=result[0];
      }
      else{
        outgoing=getRandomItemFromArray(result);
      }
    }

  }
  else {
    outgoing = activeOutgoing
  }
   
 
   


  return this._simulator.enter({
    element: outgoing,
    scope: scope.parent
  });
};

function getValidOutgoings(ids) {
  const result = [];

  for (const id of ids) {
    const exists = messageService.exist(getBusinessObject(id).id);
    
    if (exists !== null) {
      result.push(id);
    }
  }

  return result;
}

function getIdsWithTrueValues(ids) {
  const result = [];

  for (const id of ids) {
   
    const condValue = messageService.getValue(getBusinessObject(id).id);

    if (condValue !== true && condValue !== false) {
      throw new Error(condValue);
    }
    if (condValue === true) {
      result.push(id);
    }
  }

  return result;
}
function getItemsInListAOnly(listA, listB) {
  return listA.filter(item => !listB.includes(item));
}

function getRandomItemFromArray(arr) {
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
}
ExclusiveGatewayBehavior.$inject = [
  'simulator',
  'scopeBehavior'
];