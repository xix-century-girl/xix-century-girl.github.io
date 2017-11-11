function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

function t(str, languageId = "eng") {
	window.t_eng = {
		BASIC_INPUT: "Basic input",
		LOAD_INPUT: "Load input",
		CALCULATE_PATTERN: "Calculate pattern",
		INPUT_CODE: "Input code",
		INPUT_CODE_DESCRIPTION: "Input code is generated during pattern processing. Next time, instead of entering your measurements again from scratch, you can load input code to provide your measurements into the program.",
		GENERATED_INPUT_CODE: "Generated input code",
		PREVIEW: "Preview"
	};
	
	try {
		return window["t_" + languageId][str];
	} catch(ex) {
		console.log(ex);
		return window.t_eng[str];
	}
}

function prepareResult(res, precision = 1) {
	return Math.floor(res*Math.pow(10, precision))/Math.pow(10, precision);
}

function computeUpdatedValues(definitions, initialValues) {
	var changedEl = 0;
	var values = JSON.parse(JSON.stringify(initialValues));
	do {
		changedEl = 0;
		definitions.map(function (definition) {
			try {
				if(!(definition.id in values)) {
					try {
						values[definition.id] = definition.recipe(values);
						changedEl += 1;
					} catch(ex) {
						//skip
					}
				}
			} catch(ex) {
				//skip
			}
		});
	} while(changedEl > 0);
	
	return values;
}

class InputDefinition {
	constructor(id, label) {
		this.id = id;
		this.label = label;
	}
	
	generateEl() {
		return "<input id=\"" + this.id + "\" type=\"number\" step=\"0.01\" min=\"0\" class=\"form-control\"></input>";
	}
	
	generateWarnings(id) {
		//TODO
	}
}

class OutputDefinition {
	constructor(id, label, recipe, type, visible = true) {
		this.id = id;
		this.label = label;
		this.recipe = recipe;
		this.type = type;
		this.visible = visible;
	}
	
	generateEl(inputObject) {
		try {
			return this.recipe(inputObject);
		} catch(ex) {
			return null;
		}
	}
	
	generateWarnings(id) {
		//TODO
	}
}

class HoldingTable {
	constructor(elems, values) {
		this.elems = elems;
		this.values = values;
	}
	
	draw(el, type = "html") {
		if(!el) {
			return "<div class=\"text-left control-label\">?</div>";
		} else if(type == "html") {
			return el;
		} else if(type == "cm") {
			return "<div class=\"text-left control-label\">" + prepareResult(el) + " cm</div>";
		} else if(type == "float") {
			return "<div class=\"text-left control-label\">" + prepareResult(el, 2) + "</div>";
		} else {
			return "<div class=\"text-left control-label\">" + el + "</div>";
		}
	}
	
	mount(id, param = null) {
		var ctx = this;
		
		document.getElementById(id).innerHTML = 
		"<div class=\"form-horizontal slimSpace twoColumns\">"
			+
			this.elems.map(function (el) {
				if(typeof el.visible === 'undefined' || el.visible)
					return "<div class=\"form-group\" style=\"margin-bottom: 5px\"><div class=\"col-sm-8 control-label\">" + el.label + ":</div><div class=\"col-sm-4\">" + ctx.draw((ctx.values ? ctx.values[el.id] : el.generateEl(param)), el.type) + "</div></div>";
				else
					return "";
			}).join("")
			+
		"</div>";
	}
}

class PointDefinition {
	constructor(id, recipe) {
		this.id = id;
		this.recipe = recipe;
	}
}

class PathDefinition {
	constructor(points) {
		this.points = points;
	}
}

class SVGPreview {
	constructor(previewConfiguration, values, spacingPercents = 10, scale = 5) { //TODO no definitions
		var ctx = this;
		this.previewConfiguration = previewConfiguration;
		values = computeUpdatedValues(previewConfiguration.pointsDefinitions, values);
		this.points = {};
		previewConfiguration.pointsDefinitions.forEach(function (pointDefinition) {
			ctx.points[pointDefinition.id] = values[pointDefinition.id];
		});
		this.spacingPercents = spacingPercents;
		this.scale = scale;
		
		var pointsCoords = Object.keys(this.points).map(function (key) {
			return ctx.points[key];
		});
		this.xMin = pointsCoords.reduce(function(previousValue, currentValue) {
			return previousValue < currentValue[0] ? previousValue : currentValue[0];
		}, pointsCoords[0][0]);
		this.yMin = pointsCoords.reduce(function(previousValue, currentValue) {
			return previousValue < currentValue[1] ? previousValue : currentValue[1];
		}, pointsCoords[0][1]);
		this.xMax = pointsCoords.reduce(function(previousValue, currentValue) {
			return previousValue > currentValue[0] ? previousValue : currentValue[0];
		}, pointsCoords[0][0]);
		this.yMax = pointsCoords.reduce(function(previousValue, currentValue) {
			return previousValue > currentValue[1] ? previousValue : currentValue[1];
		}, pointsCoords[0][1]);
	}
	
	mount(id) {
		var ctx = this;
		var xSize = this.scale*(this.xMax - this.xMin);
		var ySize = this.scale*(this.yMax - this.yMin);
		var xSpacing = xSize*(this.spacingPercents/100.0);
		var ySpacing = ySize*(this.spacingPercents/100.0);
		document.getElementById(id).innerHTML =
		"<svg class=\"previewBorder\" width=\"" + (xSize + 2*xSpacing) + "\" height=\"" + (ySize + 2*ySpacing) + "\" viewBox=\"0 0 " + (xSize + 2*xSpacing) + " " + (ySize + 2*ySpacing) + "\">" + 
		this.previewConfiguration.pathsDefinitions.map(function (pathDefinition) {
				return "<polygon points=\"" + pathDefinition.points.map(function (pointId) {
					return (ctx.scale*(ctx.points[pointId][0] - ctx.xMin) + xSpacing) + "," + (ctx.scale*(ctx.points[pointId][1] - ctx.yMin) + ySpacing);
				}).join(" ") + "\" \
				style=\"fill:transparent;stroke:black;stroke-width:1px;fill-rule:evenodd;\" />"
			});
		 + "</svg>";
	}
}

class PreviewConfiguration {
	constructor(pointsDefinitions, pathsDefinitions) {
		this.pointsDefinitions = pointsDefinitions;
		this.pathsDefinitions = pathsDefinitions;
	}
}

class Preview {
	constructor(previewConfiguration, values) {
		this.previewConfiguration = previewConfiguration;
		this.values = values;
	}
	
	mount(id) {
		document.getElementById(id).innerHTML = 
		"<label for=\"svg_preview\">" + t("PREVIEW") + ":</label> \
		<div id=\"svg_preview\"></div>";
		var svg = new SVGPreview(this.previewConfiguration, this.values);
		svg.mount("svg_preview");
	}
}

class CalculatedPattern {
	constructor(inputDefinitions, outputDefinitions, previewConfiguration, values) {
		this.inputDefinitions = inputDefinitions;
		this.outputDefinitions = outputDefinitions;
		this.previewConfiguration = previewConfiguration;
		this.values = values;
	}
	
	mount(id) {
		document.getElementById(id).innerHTML = 
		"<div> \
			<div id=\"input_code_output\"></div> \
			<div id=\"output_table\"></div> \
			<div id=\"preview\"></div> \
		 </div>";
		 
		var outputTable = new HoldingTable(this.outputDefinitions, this.values);
		var inputCodeGenerator = new InputCodeGenerator(this.values);
		var preview = new Preview(this.previewConfiguration, this.values);
		
		outputTable.mount("output_table", this.values);
		inputCodeGenerator.mount("input_code_output");
		preview.mount("preview");
	}
}

class InputCodeLoader {
	constructor(inputDefinitions) {
		this.inputDefinitions = inputDefinitions;
	}
	
	loadInputObject() {
		var loadedInput = JSON.parse(atob(document.getElementById("input_code").value));
		this.inputDefinitions.forEach(function (inputDefinition) {
			document.getElementById(inputDefinition.id).value = loadedInput[inputDefinition.id];
		});
	}
	
	mount(id) {
		window["_loadInputObject"] = this.loadInputObject.bind(this);
		
		document.getElementById(id).innerHTML = 
		"<p>" + t("INPUT_CODE_DESCRIPTION") + "</p> \
		 <div class=\"form-group\"> \
			<label for=\"input_code\">" + t("INPUT_CODE") + ":</label> \
			<textarea class=\"form-control\" id=\"input_code\"></textarea> \
		 </div> \
		 <button type=\"button\" onClick=\"window._loadInputObject()\" class=\"btn\">" + t("LOAD_INPUT") + "</button>";
	}
}

class InputCodeGenerator {
	constructor(inputValues) {
		this.inputValues = inputValues;
	}
	
	mount(id) {
		var str = JSON.stringify(this.inputValues);
		var encoded = btoa(str);
		document.getElementById(id).innerHTML = "<label for=\"input_code_gen\">" + t("GENERATED_INPUT_CODE") + ":</label><div id=\"input_code_gen\" class=\"well\" style=\"word-wrap: break-word\">" + encoded + "</div>";
	}
}

class PatternAppTemplate {
	constructor(title, inputDefinitions, outputDefinitions, previewConfiguration) {
		this.title = title;
		this.inputDefinitions = inputDefinitions;
		this.outputDefinitions = outputDefinitions;
		this.previewConfiguration = previewConfiguration;
		this.appId = title + "_" + guid();
	}
	
	readInput() {
		var input = {};
		this.inputDefinitions.forEach(function(inputDefinition) {
			input[inputDefinition.id] = parseFloat(document.getElementById(inputDefinition.id).value);
		});
		
		return input;
	}
	
	showResult() {
		var input = this.readInput();
		var values = computeUpdatedValues(this.outputDefinitions, input);
		var calculatedPattern = new CalculatedPattern(this.inputDefinitions, this.outputDefinitions, this.previewConfiguration, values);
		calculatedPattern.mount(this.appId + "_output");
	}
	
	mount(id) {
		window["_execute"] = this.showResult.bind(this);
		
		document.getElementById(id).innerHTML = 
		"<div class=\"container\"><h1>" + this.title + "</h1> \
		 <ul class=\"nav nav-tabs\"> \
			<li class=\"active\"><a data-toggle=\"tab\" href=\"#basic\">" + t("BASIC_INPUT") + "</a></li> \
			<li><a data-toggle=\"tab\" href=\"#load\">" + t("LOAD_INPUT") + "</a></li> \
		 </ul> \
		 <div class=\"tab-content\"> \
			<br /> \
			<div id=\"basic\" class=\"tab-pane fade in active\"> \
				<div id=\"" + this.appId + "_input\"></div> \
			</div> \
			<div id=\"load\" class=\"tab-pane fade\"> \
				<div id=\"" + this.appId + "_code_loader\"></div> \
			</div> \
		 </div> \
		 <br /> \
		 <button type=\"button\" onClick=\"window._execute()\" class=\"btn btn-primary\">" + t("CALCULATE_PATTERN") + "</button> \
		 <br /> \
		 <br /> \
		 <div id=\"" + this.appId + "_output\"></div></div>";
		 
		var inputTable = new HoldingTable(this.inputDefinitions);
		inputTable.mount(this.appId + "_input");
		
		var inputCodeLoader = new InputCodeLoader(this.inputDefinitions);
		inputCodeLoader.mount(this.appId + "_code_loader");
	}
}