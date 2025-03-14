'use strict';

var domClasses = require('min-dom').classes;

// eslint-disable-next-line no-undef
var elementHelper = require('../../util/ElementHelper'),
    is = elementHelper.is,
    SUPPORTED_ELEMENTS = ['bpmn:Association',
    'bpmn:BoundaryEvent',
    'bpmn:BusinessRuleTask',
    'bpmn:CallActivity',
    'bpmn:DataInputAssociation',
    'bpmn:DataObjectReference',
    'bpmn:DataOutputAssociation',
    'bpmn:DataStoreReference',
    'bpmn:EndEvent',
    'bpmn:EventBasedGateway',
    'bpmn:ExclusiveGateway',
    'bpmn:IntermediateCatchEvent',
    'bpmn:IntermediateThrowEvent',
    'bpmn:ManualTask',
    'bpmn:ParallelGateway',
    'bpmn:Process',
    'bpmn:ScriptTask',
    'bpmn:SendTask',
    'bpmn:ReceiveTask',
    'bpmn:SequenceFlow',
    'bpmn:StartEvent',
    'bpmn:SubProcess',
      'bpmn:Task',
    'bpmn:TextAnnotation',
    'bpmn:UserTask',
      'ta:DataTask'];

var events = require('../../util/EventHelper'),
    TOGGLE_MODE_EVENT = events.TOGGLE_MODE_EVENT,
    GENERATE_TOKEN_EVENT = events.GENERATE_TOKEN_EVENT;

var IGNORED_ELEMENTS = [
  'bpmn:Process',
  'bpmn:Collaboration',
  'bpmn:Participant',
  'bpmn:Lane',
  'bpmn:TextAnnotation',
  'bpmn:MessageFlow',
  'bpmn:Group'
];

function isLabel(element) {
  return element.labelTarget;
}

function ElementSupport(eventBus, elementRegistry, canvas, notifications, elementNotifications) {
  var self = this;

  this._eventBus = eventBus;
  this._elementRegistry = elementRegistry;
  this._elementNotifications = elementNotifications;
  this._notifications = notifications;

  this.canvasParent = canvas.getContainer().parentNode;

  eventBus.on(GENERATE_TOKEN_EVENT, 20000, function(context) {
    var element = context.element;

    if (!is(element, 'bpmn:StartEvent')) {
      return;
    }

    if (!self.allElementsSupported()) {
      self.showWarnings();

      domClasses(self.canvasParent).add('warning');

      // cancel event
      return true;
    }
  });

  eventBus.on(TOGGLE_MODE_EVENT, function(context) {
    var simulationModeActive = context.simulationModeActive;

    if (!simulationModeActive) {
      domClasses(self.canvasParent).remove('warning');
    }
  });
}

ElementSupport.prototype.allElementsSupported = function() {
  var allElementsSupported = true;

  this._elementRegistry.forEach(function(element) {
    if (!is(element, IGNORED_ELEMENTS)
        && !is(element, SUPPORTED_ELEMENTS)
        && !isLabel(element)
    ) {
      allElementsSupported = true;
    }
  });

  return allElementsSupported;
};

ElementSupport.prototype.showWarnings = function(elements) {
  var self = this;

  var warnings = [];

  this._elementRegistry.forEach(function(element) {
    if (!is(element, IGNORED_ELEMENTS)
        && !is(element, SUPPORTED_ELEMENTS)
        && !isLabel(element)
    ) {
      self.showWarning(element);

      if (warnings.indexOf(element.type)) {
        self._notifications.showNotification(element.type + ' not supported', 'warning');

        warnings.push(element.type);
      }
    }
  });
};

ElementSupport.prototype.showWarning = function(element) {
  this._elementNotifications.addElementNotification(element, {
    type: 'warning',
    icon: 'fa-exclamation-triangle',
    text: 'Not supported'
  });
};

ElementSupport.$inject = [ 'eventBus', 'elementRegistry', 'canvas', 'notifications', 'elementNotifications' ];

module.exports = ElementSupport;