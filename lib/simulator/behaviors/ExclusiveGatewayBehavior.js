import {
  filterSequenceFlows
} from '../util/ModelUtil';

import { resetSimInModeller } from '../../../example/src/modeler.js';
import {
  is,
  getBusinessObject
} from 'bpmn-js/lib/util/ModelUtil';
import { getLogger } from '../../features/log/logger.js';
import { getCurrentScope } from '../../features/log/Log.js';
import { ExclamationTriangleIcon } from '../../icons/index.js';

import messageService from '../../../example/src/messageService';
import { get } from 'min-dash';

export default function ExclusiveGatewayBehavior(simulator, scopeBehavior) {
  this._scopeBehavior = scopeBehavior;
  this._simulator = simulator;

  simulator.registerBehavior('bpmn:ExclusiveGateway', this);
}

ExclusiveGatewayBehavior.prototype.enter = function (context) {
  this._simulator.exit(context);
};

ExclusiveGatewayBehavior.prototype.exit = function (context) {
debugger;
  const {
    element,
    scope
  } = context;

  // depends on UI to properly configure activeOutgoing for
  // each exclusive gateway

  const outgoings = filterSequenceFlows(element.outgoing);
  console.log("out: " + outgoings)


  // if (outgoings.length === 1) {
  //   return this._simulator.enter({
  //     element: outgoings[0],
  //     scope: scope.parent
  //   });
  // }

  // const {
  //   activeOutgoing
  // } = this._simulator.getConfig(element);


  let outgoing;

  const validIds = getValidOutgoings(outgoings);
  outgoings.forEach((element) => {
    if (!/.*data$/.test(element.id)) {
      validIds.push(element);
    }
  });
  console.log("validIds: " + validIds)

  if (validIds.length == 0) {
    noValidOutgoing();
  }
  else if (validIds.length == 1) {
    if (!/.*data$/.test(validIds[0].id)) {
      outgoing = validIds[0];
    }
    else if (messageService.getValue(getBusinessObject(validIds[0]).id)) {
      outgoing = validIds[0];
    } else {
      noValidOutgoing();
    }
  }
  else {
    try {
      const result = getIdsWithTrueValues(validIds);
      console.log(result)
      if (result.length == 0) {
        noValidOutgoing();
      }
      else if (result.length == 1) {
        outgoing = result[0];
        getLogger().log({
          text: "Choosing: " + outgoing.id,
          icon: ExclamationTriangleIcon(),
          scope: getCurrentScope()
        });
      }
      else {
        outgoing = getRandomItemFromArray(result);
        getLogger().log({
          text: "Choosing: " + outgoing.id,
          icon: ExclamationTriangleIcon(),
          scope: getCurrentScope()
        });
      }
    }
    catch (err) {
      getLogger().log({
        text: "Error: " + err,
        icon: ExclamationTriangleIcon(),
        scope: getCurrentScope()
      });
      setTimeout(() => {
        //document.querySelector('.bts-toggle-mode').dispatchEvent(new Event('click'));
        resetSimInModeller();
      }, 2000); // 3000 milliseconds = 3 seconds 
    }
  }

  return this._simulator.enter({
    element: outgoing,
    scope: scope.parent
  });
};

function noValidOutgoing() {
  getLogger().log({
    text: "Reseting: No valid outgoing sequence flows",
    icon: ExclamationTriangleIcon(),
    scope: getCurrentScope()
  });

  setTimeout(() => {
    //document.querySelector('.bts-toggle-mode').dispatchEvent(new Event('click'));
    resetSimInModeller();
  }, 2000); // 3000 milliseconds = 3 seconds 
}

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
    if (!/.*data$/.test(id.id)) {
      result.push(id);
      continue;
    }
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