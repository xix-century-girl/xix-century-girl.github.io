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

class BasicInputProvider {
	constructor(inputDefinitions) {
		this.inputs = inputDefinitions.map(function (inputDefinition) {
			return new Input(inputDefinition);
		});
	}
	
	getInput() {
		var input = {};
		this.inputs.forEach(function(inEl) {
			input[inEl.id] = inEl.getValue();
		});
		
		return input;
	}
	
	validate() {
		this.inputs.forEach(function(inEl) {
			if(!inEl.validate()) {
				return false;
			}
		});
		return true;
	}
	
	setValues(newValues) {
		this.inputs.forEach(function (input) {
			input.setValue(newValues[input.id]);
		});
	}
	
	mount(id) {
		var ctx = this;
		var table = new AlertedColumnTable(this.inputs.map(function(el) {
			return new AlertedColumnElement(el.id, el.label, el.id + "Alerts", el.validate.bind(el));
		}));
		table.mount(id);
	}
}