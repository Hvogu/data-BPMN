

export default class CustomPalette {
  constructor(bpmnFactory, create, elementFactory, palette, translate) {
    this.bpmnFactory = bpmnFactory;
    this.create = create;
    this.elementFactory = elementFactory;
    this.translate = translate;

    palette.registerProvider(this);
  }

  getPaletteEntries(element) {
    const {
      bpmnFactory,
      create,
      elementFactory,
      translate
    } = this;

    function createTask() {
      return function(event) {
        const businessObject = bpmnFactory.create('ta:DataTask');

        const shape = elementFactory.createShape({
          type: 'ta:DataTask',
          businessObject: businessObject
        });

        create.start(event, shape);
      };
    }

    return {
      'create.data-task': {
        group: 'model',
        className: 'bpmn-icon-data-store gold',
        title: translate('Create Data Task'),
        action: {
          dragstart: createTask(),
          click: createTask
        }
      }
    };
  }
}

CustomPalette.$inject = [
  'bpmnFactory',
  'create',
  'elementFactory',
  'palette',
  'translate'
];