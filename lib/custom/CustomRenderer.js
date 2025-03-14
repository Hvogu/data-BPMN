import inherits from "inherits";

import BpmnRenderer from "bpmn-js/lib/draw/BpmnRenderer";

//import { componentsToPath } from "diagram-js/lib/util/RenderUtil";



import {
  getRoundRectPath,
  getSemantic,
  getFillColor,
  getStrokeColor
} from "bpmn-js/lib/draw/BpmnRenderUtil";

import { isObject, assign } from "min-dash";

import {
  append as svgAppend,
  attr as svgAttr,
  create as svgCreate,
  classes as svgClasses
} from "tiny-svg";

/**
 * A renderer that knows how to render custom elements.
 */
export default function CustomRenderer(
  config,
  eventBus,
  styles,
  pathMap,
  canvas,
  textRenderer
) {
  BpmnRenderer.call(
    this,
    config,
    eventBus,
    styles,
    pathMap,
    canvas,
    textRenderer,
    2000
  );

  var defaultFillColor = config && config.defaultFillColor,
    defaultStrokeColor = config && config.defaultStrokeColor;

  var computeStyle = styles.computeStyle;

  function drawRect(p, width, height, r, offset, attrs) {
    if (isObject(offset)) {
      attrs = offset;
      offset = 0;
    }

    offset = offset || 0;

    attrs = computeStyle(attrs, {
      stroke: "black",
      strokeWidth: 2,
      fill: "white"
    });

    var rect = svgCreate("rect");
    svgAttr(rect, {
      x: offset,
      y: offset,
      width: width - offset * 2,
      height: height - offset * 2,
      rx: r,
      ry: r
    });
    svgAttr(rect, attrs);

    svgAppend(p, rect);

    return rect;
  }

  function renderLabel(p, label, options) {
    options = assign(
      {
        size: {
          width: 100
        }
      },
      options
    );

    var text = textRenderer.createText(label || "", options);

    svgClasses(text).add("djs-label");

    svgAppend(p, text);

    return text;
  }

  function renderEmbeddedLabel(p, element, align) {
    var semantic = getSemantic(element);

    return renderLabel(p, semantic.name, {
      box: element,
      align: align,
      padding: 5,
      style: {
        fill: getStrokeColor(element, defaultStrokeColor)
      }
    });
  }

  function drawPath(p, d, attrs) {
    attrs = computeStyle(attrs, ["no-fill"], {
      strokeWidth: 2,
      stroke: "black"
    });

    var path = svgCreate("path");
    svgAttr(path, { d: d });
    svgAttr(path, attrs);

    svgAppend(p, path);

    return path;
  }

  function renderer(type) {
    return handlers[type];
  }

  var handlers = (this.handlers = {
    "bpmn:Activity": function (p, element, attrs) {
      attrs = attrs || {};

      if (!("fillOpacity" in attrs)) {
        attrs.fillOpacity = 0.95;
      }

      return drawRect(p, element.width, element.height, 10, attrs);
    },

    "bpmn:Task": function (p, element) {
      var attrs = {
        fill: getFillColor(element, defaultFillColor),
        stroke: getStrokeColor(element, defaultStrokeColor)
      };

      var rect = renderer("bpmn:Activity")(p, element, attrs);

      renderEmbeddedLabel(p, element, "center-middle");

      return rect;
    }
  });

  this.drawDataTask = function (p, element) {
    var task = renderer("bpmn:Task")(p, element);
    
  
    return task;
  };
  

  this.getDataTaskPath = function (element) {
    return getRoundRectPath(element, 10);
  };
}

inherits(CustomRenderer, BpmnRenderer);

CustomRenderer.$inject = [
  "config.bpmnRenderer",
  "eventBus",
  "styles",
  "pathMap",
  "canvas",
  "textRenderer"
];

CustomRenderer.prototype.canRender = function (element) {
  return /^ta:/.test(element.type);
};

CustomRenderer.prototype.drawShape = function (p, element) {
  var type = element.type;

  if (type === "ta:DataTask") {
    return this.drawDataTask(p, element);
  }
};

CustomRenderer.prototype.getShapePath = function (shape) {
  var type = shape.type;

  if (type === "ta:DataTask") {
    return this.getDataTaskPath(shape);
  }
};
