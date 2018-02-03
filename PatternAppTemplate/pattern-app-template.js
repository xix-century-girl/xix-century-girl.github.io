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
		//console.log(ex);
		return window.t_eng[str];
	}
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
						//console.log(ex)
					}
				}
			} catch(ex) {
				//skip
				//console.log(ex)
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
		
		document.getElementById(elId).innerHTML +=
		"<a href=\"#\" data-toggle=\"tooltip\" data-html=\"true\" data-placement=\"bottom\" title=\"" + content + "\"><span class=\"glyphicon glyphicon-remove glyphiconButton text-" + newType.toLowerCase() + "\" aria-hidden=\"true\"></span></a>"

		$("[data-toggle=tooltip").tooltip();
	}
	
	validate(elId, value) {
		//console.log(value)
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
		window["_" + this.id + "_validate"] = this.validate.bind(this);
		return "<div class=\"form-group\" style=\"margin-bottom: 5px\"> \
			<div class=\"col-sm-6 control-label\">" + this.label + ":</div> \
			<div class=\"col-sm-6\" style=\"padding: 0;\"> \
				<div class=\"col-sm-8\"> \
					<input id=\"" + this.id + "\" type=\"number\" step=\"0.01\" min=\"0\" class=\"form-control\" onfocusout=\"window._" + this.id + "_validate()\"></input> \
				</div> \
				<div class=\"col-sm-4\" style=\"padding: 0;\"> \
					<div id=\"" + this.id + "Alerts\"></div> \
				</div> \
			</div> \
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
				return false;
		}
		return true;
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
				<div class=\"col-sm-6 control-label\">" + this.label + ":</div> \
				<div class=\"col-sm-6\" style=\"padding: 0;\"> \
					<div class=\"col-sm-8\"> \
						<div class=\"text-left control-label\">" + drawEl(this.value, this.type) + "</div> \
					</div> \
					<div class=\"col-sm-4\" style=\"padding: 0;\"> \
						<div id=\"" + this.id + "Alerts\"></div> \
					</div> \
				</div> \
			</div>";
	}
	
	validate() {
		if(!this.visible)
			return true;
		else {
			document.getElementById(this.id + "Alerts").innerHTML = "";
			for(var i = 0; i < this.validators.length; ++i) {
				if(!this.validators[i].validate(this.id + "Alerts", this.value.toString()))
					return false;
			}
		}
		return true;
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
		var valid = true;
		this.inputs.forEach(function (input) {
			if(!input.validate()) {
				valid = false;
			}
		});
		if(!valid) {
			// TODO show alert
			return;
		}
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