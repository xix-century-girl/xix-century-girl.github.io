function renderSvgLine(x1, x2, y1, y2, strokeColor, strokeOpacity, strokeWidth, opacity=1, onMouseOver="", onMouseOut="") {
	return "<line x1=\"" + x1 + "\" x2=\"" + x2 + "\" y1=\"" + y1 + "\" y2=\"" + y2 + "\" \
	stroke=\"" + strokeColor + "\" stroke-opacity=\"" + strokeOpacity + "\" stroke-width=\"" + strokeWidth + "\" \
	opacity=\"" + opacity + "\" onMouseOver=\"" + onMouseOver + "\" onMouseOut=\"" + onMouseOut + "\" />";
}

function renderText(id, x, y, str, fill="red", fillOpacity, fontSize=2, display='block', textAnchor='start') {
	var lines = str.split('\n')
	var yMod = lines.length > 1 ? fontSize*(1.2*(lines.length + 1)+1)/2 : fontSize*1.2;
	return "<text id=\"" + id + "\" y=\"" + (y - yMod) + "\" font-size=\"" + fontSize + "\" opacity=\"" + fillOpacity + "\" display=\"" + display + "\" > \
			" + lines.map(function(txtPiece){
				return "<tspan x=\"" + x + "\" fill=\"" + fill + "\" text-anchor=\"" + textAnchor + "\" dy=\"" + fontSize*1.2 + "\">" + txtPiece + "</tspan>";
			}).join("") + " \
		</text>";
}

function renderCircle(cx, cy, r, fillColor, opacity=1, onMouseOver="", onMouseOut="") {
	return "<circle cx=\"" + cx + "\" cy=\"" + cy + "\" r=\"" + r + "\" fill=\"" + fillColor + "\" opacity=\"" + opacity + "\" \
	onMouseOver=\"" + onMouseOver + "\" onMouseOut=\"" + onMouseOut + "\" />";
}

function renderShape(id, points, fillColor, fillOpacity, borderColor, borderOpacity, borderWidth, opacity=1, onMouseOver="", onMouseOut="") {
	return "<polygon id=\"" + id + "\" points=\"" + points.join(" ") + "\" style=\"fill:" + fillColor + ";fill-opacity:" + fillOpacity + ";\
	stroke:" + borderColor + ";stroke-opacity:" + borderOpacity + ";stroke-width:" + borderWidth + "\" opacity=\"" + opacity + "\" \
	onMouseOver=\"" + onMouseOver + "\" onMouseOut=\"" + onMouseOut + "\" />";
}

class GridSVGElement {
	render(viewportConfiguration) {
		var vc = viewportConfiguration;
		var result = "";
		
		var xFloor = Math.floor(vc.xShift);
		var xS = vc.xShift - xFloor;
		var yFloor = Math.floor(vc.yShift);
		var yS = vc.yShift - yFloor;
		
		
		
		for(var i=0; i < vc.width; ++i) {
			var width = (i-xFloor)%10 == 0 ? 0.2 : 0.1;
			result += renderSvgLine(i + xS, i + xS, 0, vc.height, "gray", 0.3, width);
		}
		for(var i=0; i < vc.height; ++i) {
			var width = (i-yFloor)%10 == 0 ? 0.2 : 0.1;
			result += renderSvgLine(0, vc.width, (i + yS), (i + yS), "gray", 0.3, width);
		}
		return result;
	}
}

class SVGPoint {
	constructor(id, x, y, color="black", size=1, label="", reactiveColor="red", reactiveSize=2, reactiveLabel="") {
		this.id = id;
		this.x = x;
		this.y = y;
		this.color = color;
		this.size = size;
		this.label = label;
		this.reactiveColor = reactiveColor;
		this.reactiveSize = reactiveSize;
		this.reactiveLabel = reactiveLabel;
	}
	
	getTransformedX(viewportConfiguration) {
		return this.x + viewportConfiguration.xShift;
	}
	
	getTransformedY(viewportConfiguration) {
		return this.y + viewportConfiguration.yShift;
	}
	
	render(viewportConfiguration) {
		var vc = viewportConfiguration;
		return renderCircle(this.getTransformedX(vc), this.getTransformedY(vc), this.size/10, this.color) +
			renderCircle(this.getTransformedX(vc), this.getTransformedY(vc), this.reactiveSize/10, this.reactiveColor, 0,
				"evt.target.setAttribute('opacity', 1); document.getElementById('label_" + this.id.replace("'", "_prim") + "').setAttribute('display', 'block')",
				"evt.target.setAttribute('opacity', 0); document.getElementById('label_" + this.id.replace("'", "_prim") + "').setAttribute('display', 'none')") +
			renderText("label_" + this.id.replace("'", "_prim"), this.getTransformedX(vc) + this.reactiveSize/10, this.getTransformedY(vc) - this.reactiveSize/10,
				this.id, "red", 1, 1.5, 'none');
	}
}

class SVGLine {
	constructor(pointA, pointB, color, width, reactiveColor, reactiveWidth) {
		this.pointA = pointA;
		this.pointB = pointB;
		this.color = color;
		this.width = width;
		this.reactiveColor = reactiveColor;
		this.reactiveWidth = reactiveWidth;
		this.id = "line_" + pointA.id + "_" + pointB.id;
	}
	
	render(viewportConfiguration) {
		var vc = viewportConfiguration;
		
		var labelX = (this.pointA.getTransformedX(vc) + this.pointB.getTransformedX(vc))/2;
		var labelY = (this.pointA.getTransformedY(vc) + this.pointB.getTransformedY(vc))/2;
		var lineLength = Math.sqrt(Math.pow(this.pointA.getTransformedX(vc) - this.pointB.getTransformedX(vc), 2) + Math.pow(this.pointA.getTransformedY(vc) - this.pointB.getTransformedY(vc), 2));
		var label = prepareResult(lineLength) + "cm";
		
		var textAnchor = 'start';
		if(this.pointA.getTransformedX(vc) == this.pointB.getTransformedX(vc)){
			labelX += this.reactiveWidth/10;
		} else if(this.pointA.getTransformedY(vc) == this.pointB.getTransformedY(vc)){
			textAnchor = 'middle';
			labelY -= this.reactiveWidth/10;
		} else {
			labelX += this.reactiveWidth/10;
			labelY -= this.reactiveWidth/10;
		}
		
		return renderSvgLine(this.pointA.getTransformedX(vc), this.pointB.getTransformedX(vc),
				this.pointA.getTransformedY(vc), this.pointB.getTransformedY(vc), this.color, 1, this.width/10) +
			renderSvgLine(this.pointA.getTransformedX(vc), this.pointB.getTransformedX(vc),
				this.pointA.getTransformedY(vc), this.pointB.getTransformedY(vc), this.reactiveColor, 1, this.reactiveWidth/10, 0,
				"evt.target.setAttribute('opacity', 1); document.getElementById('label_" + this.id.replace("'", "_prim") + "').setAttribute('display', 'block')",
				"evt.target.setAttribute('opacity', 0); document.getElementById('label_" + this.id.replace("'", "_prim") + "').setAttribute('display', 'none')") +
			renderText("label_" + this.id.replace("'", "_prim"), labelX, labelY, label, "red", 1, 1.5, 'none', textAnchor);
	}
}

class SVGShape {
	constructor(points, fillColor, label="", fillOpacity=0.3, borderColor=null, borderOpacity=0.6, borderWidth=2,
		reactiveFillColor=null, reactiveFillOpacity=0.4, reactiveBorderColor=null, reactiveBorderOpacity=1, reactiveBorderWidth=3) {
		this.points = points;
		this.fillColor = fillColor;
		this.fillOpacity = fillOpacity;
		this.borderColor = borderColor == null ? fillColor : borderColor;
		this.borderOpacity = borderOpacity;
		this.borderWidth = borderWidth;
		this.reactiveFillColor = reactiveFillColor == null ? fillColor : reactiveFillColor;
		this.reactiveFillOpacity = reactiveFillOpacity;
		this.reactiveBorderColor = reactiveBorderColor == null ? fillColor : reactiveBorderColor;
		this.reactiveBorderOpacity = reactiveBorderOpacity;
		this.reactiveBorderWidth = reactiveBorderWidth;
		this.label = label;
	}
	
	render(viewportConfiguration) {
		var vc = viewportConfiguration;
		var points = this.points.map(function(point) {
			return point.getTransformedX(vc) + "," + point.getTransformedY(vc);
		});
		var basicShapeGuid = "shape_" + guid();
		var highlightedShapeGuid = basicShapeGuid + "_2";
		var labelId = "label_" + basicShapeGuid;
		
		var labelX = this.points.reduce(function(prev, curr){
			return prev + curr.getTransformedX(vc);
		}, 0)/this.points.length;
		var labelY = this.points.reduce(function(prev, curr){
			return prev + curr.getTransformedY(vc);
		}, 0)/this.points.length;
		
		return renderShape(basicShapeGuid, points, this.fillColor, this.fillOpacity, this.borderColor, this.borderOpacity, this.borderWidth/10) +
			renderShape(highlightedShapeGuid, points, this.reactiveFillColor, this.reactiveFillOpacity, this.reactiveBorderColor, this.reactiveBorderOpacity,
			this.reactiveBorderWidth/10, 0,
			"evt.target.setAttribute('opacity', 1); document.getElementById('" + basicShapeGuid + "').setAttribute('opacity', 0); document.getElementById('" + labelId + "').setAttribute('display', 'block')",
			"evt.target.setAttribute('opacity', 0); document.getElementById('" + basicShapeGuid + "').setAttribute('opacity', 1); document.getElementById('" + labelId + "').setAttribute('display', 'none')") +
			renderText(labelId, labelX, labelY, this.label, "black", 0.5, 2, "none", "middle");
	}
}

class ViewportConfiguration {
	constructor(xShift, yShift, vieportWidth, viewportHeight, scale, units="px") {
		this.xShift = xShift;
		this.yShift = yShift;
		this.width = vieportWidth;
		this.height = viewportHeight;
		this.scale = scale;
		this.units = units;
	}
}

class Viewport {
	render(viewportConfiguration, children) {
		var vc = viewportConfiguration;
		return "<svg class=\"previewBorder\" width=\"" + (vc.scale * vc.width) + vc.units + "\" height=\"" + (vc.scale * vc.height) + vc.units + "\" viewBox=\"0 0 " + vc.width + " " + vc.height + "\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\">" + 
			children.map(function(child) {
				return child.render(vc);
			}).join("") +
			"</svg>";
	}
}

class DownloadData {
	constructor(filename, content) {
		this.filename = filename;
		this.content = content;
	}
}

function findPointById(points, pointId) {
	return points.find(function(point) {
		return point.id == pointId
	});
}

class SVGPreview {
	constructor(previewConfiguration, values) {
		var ctx = this;
		this.previewConfiguration = previewConfiguration;
		values = computeUpdatedValues(previewConfiguration.pointsDefinitions, values);
		
		this.points = previewConfiguration.pointsDefinitions.map(function (pointDefinition) {
			var coords = values[pointDefinition.id];
			return new SVGPoint(pointDefinition.id, coords[0], coords[1], "black", 2, "", "red", 5, pointDefinition.id);
		});
		
		this.lines = previewConfiguration.constructionLinesDefinitions.map(function (lineDefinition) {
			return new SVGLine(
				findPointById(ctx.points, lineDefinition.pointA),
				findPointById(ctx.points, lineDefinition.pointB),
				"black", 1, "red", 5
			);
		});
		
		this.shapes = previewConfiguration.shapesDefinitions.map(function(definition) {
			var points = definition.points.map(function(pointId) {
				return findPointById(ctx.points, pointId)
			});
			return new SVGShape(points, "orange", definition.id);
		});
		
		this.spacingPercents = previewConfiguration.spacingPercents;
		this.scale = previewConfiguration.scale;
		
		this.xMin = this.points.reduce(function(previousValue, currentValue) {
			return previousValue < currentValue.x ? previousValue : currentValue.x;
		}, this.points[0].x);
		this.yMin = this.points.reduce(function(previousValue, currentValue) {
			return previousValue < currentValue.y ? previousValue : currentValue.y;
		}, this.points[0].y);
		this.xMax = this.points.reduce(function(previousValue, currentValue) {
			return previousValue > currentValue.x ? previousValue : currentValue.x;
		}, this.points[0].x);
		this.yMax = this.points.reduce(function(previousValue, currentValue) {
			return previousValue > currentValue.y ? previousValue : currentValue.y;
		}, this.points[0].y);
	}
	
	render(scale=null, units=null) {
		var viewportWidth = 2*this.previewConfiguration.spacing + this.xMax - this.xMin;
		var viewportHeight = 2*this.previewConfiguration.spacing + this.yMax - this.yMin;
		
		var viewportConfiguration = new ViewportConfiguration(
				this.previewConfiguration.spacing - this.xMin,
				this.previewConfiguration.spacing - this.yMin,
				viewportWidth,
				viewportHeight,
				scale == null ? this.previewConfiguration.scale : scale,
				units == null ? this.previewConfiguration.units : units
			);
		
		var children = [];
		children.push(new GridSVGElement());
		children = children.concat(this.shapes);
		children = children.concat(this.lines);
		children = children.concat(this.points);
		
		this.viewport = new Viewport()
		return this.viewport.render(viewportConfiguration, children);
	}
	
	mount(id) {
		var rendered = this.render();
		document.getElementById(id).innerHTML = rendered;
	}
}

class PreviewConfiguration {
	constructor(pointsDefinitions, constructionLinesDefinitions, shapesDefinitions, guideLinesDefinitions, spacing = 5, scale=5, units="px") {
		this.pointsDefinitions = pointsDefinitions;
		this.constructionLinesDefinitions = constructionLinesDefinitions;
		this.shapesDefinitions = shapesDefinitions;
		this.guideLinesDefinitions = guideLinesDefinitions;
		this.spacing = spacing;
		this.scale = scale;
		this.units = units;
	}
}

class Preview {
	constructor(previewConfiguration, values) {
		this.previewConfiguration = previewConfiguration;
		this.values = values;
		this.svgPreview = new SVGPreview(this.previewConfiguration, this.values);
		window["_downloadPattern"] = this.downloadPattern.bind(this);
	}
	
	prepareDownloadData() {
		return new DownloadData("pattern.svg", "<?xml version=\"1.0\" standalone=\"no\"?>\n \
			<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \
			\"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\n" + this.svgPreview.render(1, "cm"))
	}
	
	downloadPattern() {
		var downloadData = this.prepareDownloadData();
		var element = document.createElement('a');
		element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(downloadData.content));
		element.setAttribute('download', downloadData.filename);
		element.style.display = 'none';
		document.body.appendChild(element);
		element.click();
		document.body.removeChild(element);
	}
	
	mount(id) {
		if(this.previewConfiguration.pointsDefinitions && this.previewConfiguration.pointsDefinitions.length > 0) {
			document.getElementById(id).innerHTML = 
			"<label for=\"svg_preview\">" + t("PREVIEW") + ":</label> \
			<div id=\"svg_preview\" class=\"normalCursor\"></div><br/> \
			<button type='button' class='btn' onClick='window._downloadPattern()'>Download pattern</button>";
			this.svgPreview.mount("svg_preview");
		} else {
			//TODO warning?
		}
	}
}