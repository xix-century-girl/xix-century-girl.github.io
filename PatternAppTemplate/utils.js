function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

function prepareResult(res, precision = 1) {
	return Math.floor(res*Math.pow(10, precision))/Math.pow(10, precision);
}

class AlertedColumnElement {
	constructor(id, label, alertId, validate) {
		this.id = id;
		this.label = label;
		this.alertId = alertId;
		this.validate = validate;
	}
	
	draw() {
		window["_" + this.id + "_validate"] = this.validate;
		return "<div class=\"form-group\" style=\"margin-bottom: 5px\"> \
			<div class=\"col-sm-6 control-label\">" + this.label + ":</div> \
			<div class=\"col-sm-6\" style=\"padding: 0;\"> \
				<div class=\"col-sm-8\"> \
					<input id=\"" + this.id + "\" type=\"number\" step=\"0.01\" min=\"0\" class=\"form-control\" onfocusout=\"window._" + this.id + "_validate()\"></input> \
				</div> \
				<div class=\"col-sm-4\" style=\"padding: 0;\"> \
					<div id=\"" + this.alertId + "\"></div> \
				</div> \
			</div> \
		</div>";
	}
}

class AlertedColumnTable {
	constructor(elems) {
		this.elems = elems;
	}
	
	mount(id, param = null) {
		var ctx = this;
		
		document.getElementById(id).innerHTML = 
		"<div class=\"form-horizontal slimSpace twoColumns\">"
			+
			this.elems.map(function (el) {
				return el.draw();
			}).join("")
			+
		"</div>";
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