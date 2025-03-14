import { is } from "bpmn-js/lib/util/ModelUtil";

export default class ReplaceProvider {
  constructor(modeling, popupMenu) {
    this.modeling = modeling;

    popupMenu.registerProvider("bpmn-replace", this);
  }

  getPopupMenuEntries(element) {
    if (!is(element, "bpmn:SequenceFlow")) {
      return;
    }

    return {
      "entry-1": {
        className: "bpmn-icon-connection",
        label: "Conditional Sequence Flow",
        action: () => {
          // TODO: set custom property that turns sequence flow into custom sequence flow
          
          this.modeling.updateProperties(element, {
            name: "cond",
            id: element.id+'data'
          });
        }
      },
      "entry-2": {
        className: "bpmn-icon-connection",
        label: "Standard Sequence Flow",
        action: () => {
          // TODO: set custom property that turns sequence flow into custom sequence flow
          
          this.modeling.updateProperties(element, {
            name: "",
            id: calculateNewId(element)
          });
        }
      }
    };
  }
}
function calculateNewId(element) {
    if (/.*data$/.test(element.id)) {
      return element.id.slice(0, -4);
    }
    return element.id; 
  }
ReplaceProvider.$inject = ["modeling", "popupMenu"];

