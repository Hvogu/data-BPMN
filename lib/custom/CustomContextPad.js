export default class CustomContextPad {
  constructor(config, contextPad, create, elementFactory, injector, translate) {
    this.create = create;
    this.elementFactory = elementFactory;
    this.translate = translate;

    if (config.autoPlace !== false) {
      this.autoPlace = injector.get("autoPlace", false);
    }

    contextPad.registerProvider(this);
  }

  getContextPadEntries(element) {
    const { autoPlace, create, elementFactory, translate } = this;

    function appendCustomTask(event, element) {
      if (autoPlace) {
        const shape = elementFactory.createShape({ type: "ta:DataTask" });

        autoPlace.append(element, shape);
      } else {
        appendCustomTaskStart(event, element);
      }
    }

    function appendCustomTaskStart(event) {
      const shape = elementFactory.createShape({ type: "ta:DataTask" });

      create.start(event, shape, element);
    }

    return {
      "append.data-task": {
        group: "model",
        className: "bpmn-icon-data-store gold",
        title: translate("Append DataTask"),
        action: {
          click: appendCustomTask,
          dragstart: appendCustomTaskStart
        }
      }
    };
  }
}

CustomContextPad.$inject = [
  "config",
  "contextPad",
  "create",
  "elementFactory",
  "injector",
  "translate"
];
