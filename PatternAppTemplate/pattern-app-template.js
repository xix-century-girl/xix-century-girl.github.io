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
		EXAMPLE_INPUT_CODE_LABEL: "Use example input code",
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

function drawEl(el, type) {
	if(typeof el === undefined) {
		return "?";
	} else if(type == "html") {
		return el;
	} else if(type == "cm") {
		return prepareResult(el) + " cm";
	} else if(type == "float") {
		return prepareResult(el, 2);
	} else {
		return el;
	}
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
						var res = definition.recipe(values, definition.args);
						if(res !== res) throw definition.id + " is NaN!";
						if(res == undefined) throw definition.id + " is undefined!";
						if(typeof res === undefined) throw definition.id + " is undefined!";
						if(res instanceof Array) {
							for(var i = 0; i<res.length; ++i)
								if(res[i] == null)
									throw "Array value of " + definition.id + " is null!";
						}
						values[definition.id] = res;
						changedEl += 1;
					} catch(ex) {
						//skip
						console.log(ex)
					}
				}
			} catch(ex) {
				//skip
				console.log(ex)
			}
		});
	} while(changedEl > 0);
	
	return values;
}

class Validator {
	constructor(id, label, type, func) {
		this.id = id;
		this.label = label;
		this.type = type;
		this.func = func;
	}
	
	_addAlert(elId, exception = null) {
		var content = "";
		var newType = "";
		if(exception) {
			content = "<strong>Error!</strong> " + exception;
			newType = "danger";
		} else {
			content = this.label;
			newType = this.type;
		}
		
		document.getElementById(elId).innerHTML += "<div class=\"alert alert-" + newType.toLowerCase() + " alert-dismissable alertSpaced\"> \
			<button type=\"button\" class=\"close\" data-dismiss=\"alert\" aria-hidden=\"true\">&times;</button> \
			" + content + " \
		</div>";
	}
	
	validate(elId, value) {
		console.log(value)
		try {
			if (!this.func(value)) {
				this._addAlert(elId);
				return false;
			}
		} catch(e) {
			this._addAlert(elId, e);
			return false;
		}
		return true;
	}
}

var NOT_EMPTY = new Validator('notEmpty', '<strong>Error!</strong> Value required.', 'danger', function (value) {return !(typeof value === 'undefined' || !value)});
var MUST_BE_FLOAT = new Validator('mustBeFloat', '<strong>Error!</strong> Value must be float.', 'danger', function (value) {return !isNaN(parseFloat(value))});
var GT_ZERO = new Validator('gtZero', '<strong>Error!</strong> Value must be greater than zero.', 'danger', function (value) {return parseFloat(value) > 0});

class InputDefinition {
	constructor(id, label, validators = [NOT_EMPTY, MUST_BE_FLOAT, GT_ZERO]) {
		this.id = id;
		this.label = label;
		this.validators = validators;
	}
}

class Input {
	constructor(inputDefinition) {
		this.id = inputDefinition.id;
		this.label = inputDefinition.label;
		this.validators = inputDefinition.validators;
	}
	
	draw() {
		document[this.id + "_validate"] = this.validate.bind(this);
		return "<div class=\"form-group\" style=\"margin-bottom: 5px\"> \
			<div class=\"col-sm-8 control-label\">" + this.label + ":</div> \
			<div class=\"col-sm-4\"> \
				<input id=\"" + this.id + "\" type=\"number\" step=\"0.01\" min=\"0\" class=\"form-control\" onfocusout=\"document." + this.id + "_validate()\"></input> \
			</div> \
			<div id=\"" + this.id + "Alerts\" class=\"col-sm-12\"></div> \
		</div>";
	}
	
	getRawValue() {
		return document.getElementById(this.id).value;
	}
	
	getValue() {
		return parseFloat(this.getRawValue());
	}
	
	setValue(value) {
		document.getElementById(this.id).value = value;
	}
	
	validate() {
		document.getElementById(this.id + "Alerts").innerHTML = "";
		for(var i = 0; i < this.validators.length; ++i) {
			if(!this.validators[i].validate(this.id + "Alerts", this.getRawValue()))
				break;
		}
	}
}

class OutputDefinition {
	constructor(id, label, recipe, type, visible = true, args = null, validators = [NOT_EMPTY, MUST_BE_FLOAT, GT_ZERO]) {
		this.id = id;
		this.label = label;
		this.recipe = recipe;
		this.type = type;
		this.visible = visible;
		this.args = args;
		this.validators = validators;
	}
}

class Output {
	constructor(outputDefinition) {
		this.id = outputDefinition.id;
		this.label = outputDefinition.label;
		this.recipe = outputDefinition.recipe;
		this.type = outputDefinition.type;
		this.visible = outputDefinition.visible;
		this.args = outputDefinition.args;
		this.validators = this.visible ? outputDefinition.validators : [];
		this.value = null;
	}
	
	draw() {
		if(!this.visible)
			return "";
		else
			return "<div class=\"form-group\" style=\"margin-bottom: 5px\"> \
				<div class=\"col-sm-8 control-label\">" + this.label + ":</div> \
				<div class=\"col-sm-4\"><div class=\"text-left control-label\">" + drawEl(this.value, this.type) + "</div></div> \
				<div id=\"" + this.id + "Alerts\" class=\"col-sm-12\"></div> \
			</div>";
	}
	
	validate() {
		if(!this.visible)
			return;
		else {
			document.getElementById(this.id + "Alerts").innerHTML = "";
			for(var i = 0; i < this.validators.length; ++i) {
				if(!this.validators[i].validate(this.id + "Alerts", this.value.toString()))
					break;
			}
		}
	}
}

class TwoColumnList {
	constructor(elems, draw) {
		this.elems = elems;
		this.draw = draw;
	}
	
	mount(id, param = null) {
		var ctx = this;
		
		document.getElementById(id).innerHTML = 
		"<div class=\"form-horizontal slimSpace twoColumns\">"
			+
			this.elems.map(function (el) {
				return ctx.draw(el);
			}).join("")
			+
		"</div>";
	}
}

class PointDefinition {
	constructor(id, recipe, args) {
		this.id = id;
		this.recipe = recipe;
		this.args = args;
	}
}

class PathDefinition {
	constructor(points) {
		this.points = points;
	}
}

class GuideLineDefinition {
	constructor(space, coord) {
		this.space = space;
		this.coord = coord;
	}
}

class SVGPreview {
	constructor(previewConfiguration, values) { //TODO no definitions
		var ctx = this;
		this.previewConfiguration = previewConfiguration;
		console.log(values)
		values = computeUpdatedValues(previewConfiguration.pointsDefinitions, values);
		this.points = {};
		previewConfiguration.pointsDefinitions.forEach(function (pointDefinition) {
			ctx.points[pointDefinition.id] = values[pointDefinition.id];
		});
		console.log(this.points)
		this.spacingPercents = previewConfiguration.spacingPercents;
		this.scale = previewConfiguration.scale;
		
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
		
		function xTrans(v) {
			return ctx.scale*(v - ctx.xMin) + xSpacing;
		}
		
		function yTrans(v) {
			return ctx.scale*(v - ctx.yMin) + ySpacing;
		}
		
		document.getElementById(id).innerHTML =
		"<svg class=\"previewBorder\" width=\"" + (xSize + 2*xSpacing) + "\" height=\"" + (ySize + 2*ySpacing) + "\" viewBox=\"0 0 " + (xSize + 2*xSpacing) + " " + (ySize + 2*ySpacing) + "\">" + 
		this.previewConfiguration.pathsDefinitions.map(function (pathDefinition) {
			return "<polygon points=\"" + pathDefinition.points.map(function (pointId) {
				return xTrans(ctx.points[pointId][0]) + "," + yTrans(ctx.points[pointId][1]);
			}).join(" ") + "\" \
			style=\"fill:transparent;stroke:black;stroke-width:1px;fill-rule:evenodd;\" />"
		}) +
		Object.keys(this.points).map(function (pointId) {
			return "<circle cx=\"" + xTrans(ctx.points[pointId][0]) + "\" cy=\"" + yTrans(ctx.points[pointId][1]) + "\" r=\"2\" stroke=\"transparent\" fill=\"black\"/> \
			<circle cx=\"" + xTrans(ctx.points[pointId][0]) + "\" cy=\"" + yTrans(ctx.points[pointId][1]) + "\" r=\"3\" stroke=\"transparent\" fill=\"transparent\" onMouseOver=\"evt.target.setAttribute('fill', 'red'); document.getElementById('label_" + pointId.replace("'", "_prim") + "').setAttribute('fill', 'red')\" onMouseOut=\"evt.target.setAttribute('fill', 'transparent'); document.getElementById('label_" + pointId.replace("'", "_prim") + "').setAttribute('fill', 'transparent')\" /> \
			<text x=\"" + (xTrans(ctx.points[pointId][0]) +2) + "\" y=\"" + (yTrans(ctx.points[pointId][1]) -2) + "\"><tspan id=\"label_" + pointId.replace("'", "_prim") + "\" fill=\"transparent\">" + pointId + "</tspan></text>";
		}) +
		(this.guideLinesDefinitions ?
			this.guideLinesDefinitions.map(function (guideLineDefinition) {
				if(guideLineDefinition.space == "x")
					return "<>";
				else if(guideLineDefinition.space == "y")
					return "<line x1=\"0\" x2=\"" + (xSize + 2*xSpacing) + "\" y1=\"" + (ySpacing + guideLineDefinition.coord) + "\" y2=\"" + (ySpacing + guideLineDefinition.coord) + "\" stroke=\"red\" stroke-width=\"1\"/>";
				else {
					console.log("Space: " + guideLineDefinition.space + " is not valid.");
					return "<line x1=\"" + (xSpacing + guideLineDefinition.coord) + "\" x2=\"" + (xSpacing + guideLineDefinition.coord) + "\" y1=\"0\" y2=\"" + (ySize + 2*ySpacing) + "\" stroke=\"red\" stroke-width=\"1\"/>";
				}
			}) : "")
		 + "</svg>";
	}
}

class PreviewConfiguration {
	constructor(pointsDefinitions, pathsDefinitions, guideLinesDefinitions, spacingPercents = 10, scale = 5) {
		this.pointsDefinitions = pointsDefinitions;
		this.pathsDefinitions = pathsDefinitions;
		this.guideLinesDefinitions = guideLinesDefinitions;
		this.spacingPercents = spacingPercents;
		this.scale = scale;
	}
}

class Preview {
	constructor(previewConfiguration, values) {
		this.previewConfiguration = previewConfiguration;
		this.values = values;
	}
	
	mount(id) {
		if(this.previewConfiguration.pointsDefinitions && this.previewConfiguration.pointsDefinitions.length > 0) {
			document.getElementById(id).innerHTML = 
			"<label for=\"svg_preview\">" + t("PREVIEW") + ":</label> \
			<div id=\"svg_preview\"></div>";
			var svg = new SVGPreview(this.previewConfiguration, this.values);
			svg.mount("svg_preview");
		} else {
			//TODO warning?
		}
	}
}

class CalculatedPattern {
	constructor(inputs, outputs, previewConfiguration, values, outputDescriptionId) {
		this.inputs = inputs;
		this.outputs = outputs;
		this.previewConfiguration = previewConfiguration;
		this.values = values;
		this.outputDescriptionId = outputDescriptionId;
	}
	
	mount(id) {
		document.getElementById(id).innerHTML = 
		"<div> \
			<div id=\"input_code_output\"></div> \
			<div id=\"outputDescriptionId\"></div> \
			<div id=\"output_table\"></div> \
			<div id=\"preview\"></div> \
		 </div>";
		 
		var outputTable = new TwoColumnList(this.outputs, function (el) {return el.draw()});
		var inputCodeGenerator = new InputCodeGenerator(this.inputs);
		
		if(this.outputDescriptionId) {
			document.getElementById("outputDescriptionId").innerHTML = document.getElementById(this.outputDescriptionId).innerHTML + "<br /><br />";
		}
		
		outputTable.mount("output_table", this.values);
		inputCodeGenerator.mount("input_code_output");
		
		this.outputs.forEach(function (output) {
			output.validate();
		})
		
		if(this.previewConfiguration) {
			var preview = new Preview(this.previewConfiguration, this.values);
			preview.mount("preview");
		}
	}
}

class InputCodeLoader {
	constructor(inputs, exampleInputCode) {
		this.inputs = inputs;
		this.exampleInputCode = exampleInputCode;
	}
	
	loadInputObject() {
		try {
			document.getElementById("inputCodeAlerts").innerHTML = "";
			var loadedInput = JSON.parse(atob(document.getElementById("input_code").value));
			this.inputs.forEach(function (input) {
				input.setValue(loadedInput[input.id]);
			});
			$('.nav-tabs a[href="#basic"]').tab('show');
		} catch(ex) {
			document.getElementById("inputCodeAlerts").innerHTML = "<div class=\"alert alert-danger alert-dismissible alertSpaced\" role=\"alert\"><button type=\"button\" class=\"close\" data-dismiss=\"alert\" aria-label=\"Close\"><span aria-hidden=\"true\">&times;</span></button>" + ex + "</div>";
		}
	}
	
	mount(id) {
		window["_loadInputObject"] = this.loadInputObject.bind(this);
		
		document.getElementById(id).innerHTML = 
		"<p>" + t("INPUT_CODE_DESCRIPTION") + "</p>" +
		(this.exampleInputCode ? "<button type=\"button\" onClick=\"document.getElementById('input_code').value = '" + this.exampleInputCode + "'\" class=\"btn\">" + t("EXAMPLE_INPUT_CODE_LABEL") + "</button><br /><br />" : "") +
		"<div class=\"form-group\"> \
			<label for=\"input_code\">" + t("INPUT_CODE") + ":</label> \
			<textarea class=\"form-control\" id=\"input_code\"></textarea> \
		 </div> \
		 <button type=\"button\" onClick=\"window._loadInputObject()\" class=\"btn\">" + t("LOAD_INPUT") + "</button> \
		 <div id=\"inputCodeAlerts\"></div>";
	}
}

class InputCodeGenerator {
	constructor(inputs) {
		this.inputValues = inputs.reduce(function(map, obj) {
			map[obj.id] = obj.getValue();
			return map;
		}, {});
	}
	
	mount(id) {
		var str = JSON.stringify(this.inputValues);
		var encoded = btoa(str);
		document.getElementById(id).innerHTML = "<label for=\"input_code_gen\">" + t("GENERATED_INPUT_CODE") + ":</label><div id=\"input_code_gen\" class=\"well\" style=\"word-wrap: break-word\">" + encoded + "</div>";
	}
}

class PatternAppTemplate {
	constructor(title, inputDefinitions, outputDefinitions, previewConfiguration, inputDescriptionId, outputDescriptionId, exampleInputCode) {
		this.title = title;
		this.inputs = inputDefinitions.map(function (inputDefinition) {
			return new Input(inputDefinition);
		});
		this.outputs = outputDefinitions.map(function (outputDefinition) {
			return new Output(outputDefinition);
		});
		this.previewConfiguration = previewConfiguration;
		this.inputDescriptionId = inputDescriptionId;
		this.outputDescriptionId = outputDescriptionId;
		this.exampleInputCode = exampleInputCode;
		this.appId = title + "_" + guid();
	}
	
	readInput() {
		var input = {};
		this.inputs.forEach(function(inEl) {
			input[inEl.id] = inEl.getValue();
		});
		
		return input;
	}
	
	showResult() {
		var ctx = this;
		var values = computeUpdatedValues(this.outputs, this.readInput());
		this.outputs.forEach(function(output) {
			output.value = values[output.id];
		});
		var calculatedPattern = new CalculatedPattern(this.inputs, this.outputs, this.previewConfiguration, values, this.outputDescriptionId);
		calculatedPattern.mount(this.appId + "_output");
	}
	
	mount(id) {
		window["_execute"] = this.showResult.bind(this);
		
		document.getElementById(id).innerHTML = 
		"<div class=\"container\"><h1>" + this.title + "</h1> \
		 <div id=\"inputDescriptionId\"></div> \
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
		 
		if(this.inputDescriptionId) {
			document.getElementById("inputDescriptionId").innerHTML = document.getElementById(this.inputDescriptionId).innerHTML + "<br /><br />";
		}
		 
		var inputTable = new TwoColumnList(this.inputs, function (el) {return el.draw()});
		inputTable.mount(this.appId + "_input");
		
		var inputCodeLoader = new InputCodeLoader(this.inputs, this.exampleInputCode);
		inputCodeLoader.mount(this.appId + "_code_loader");
	}
}