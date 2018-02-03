class GridSVGElement {
	constructor(scale, xShift, width, yShift, height) {
		this.scale = scale
		this.xShift = xShift;
		this.width = width;
		this.yShift = yShift;
		this.height = height;
	}
	
	render() {
		var result = "";
		for(var i=1; i < this.width; ++i) {
			result += "<line x1=\"" + i + "\" x2=\"" + i + "\" y1=\"0\" y2=\"" + this.height+ "\" stroke=\"grey\" stroke-width=\"1\"/>"
		}
		for(var i=1; i < this.height; ++i) {
			result += "<line x1=\"0\" x2=\"" + this.width + "\" y1=\"" + i + "\" y2=\"" + i + "\" stroke=\"grey\" stroke-width=\"1\"/>"
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
		return "<circle cx=\"" + this.getTransformedX(vc) + "\" cy=\"" + this.getTransformedY(vc) + "\" r=\"" + (this.size/10) + "\" stroke=\"transparent\" fill=\"" + this.color + "\"/> \
			<circle cx=\"" + this.getTransformedX(vc) + "\" cy=\"" + this.getTransformedY(vc) + "\" r=\"" + (this.reactiveSize/10) + "\" stroke=\"transparent\" fill=\"transparent\" onMouseOver=\"evt.target.setAttribute('fill', '" + this.reactiveColor + "'); document.getElementById('label_" + this.id.replace("'", "_prim") + "').setAttribute('fill', '" + this.reactiveColor + "')\" onMouseOut=\"evt.target.setAttribute('fill', 'transparent'); document.getElementById('label_" + this.id.replace("'", "_prim") + "').setAttribute('fill', 'transparent')\" /> \
			<text x=\"" + (this.getTransformedX(vc) + this.reactiveSize/10) + "\" y=\"" + (this.getTransformedY(vc) - this.reactiveSize/10) + "\" font-size=\"" + 2 + "\"><tspan id=\"label_" + this.id.replace("'", "_prim") + "\" fill=\"transparent\">" + this.id + "</tspan></text>";
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
		
		return "<line x1=\"" + this.pointA.getTransformedX(vc) + "\" x2=\"" + this.pointB.getTransformedX(vc) + "\" y1=\"" + this.pointA.getTransformedY(vc) + "\" y2=\"" + this.pointB.getTransformedY(vc) + "\" stroke=\"" + this.color + "\" stroke-width=\"" + (this.width/10) + "\"/> \
		<line x1=\"" + this.pointA.getTransformedX(vc) + "\" x2=\"" + this.pointB.getTransformedX(vc) + "\" y1=\"" + this.pointA.getTransformedY(vc) + "\" y2=\"" + this.pointB.getTransformedY(vc) + "\" stroke=\"transparent\" stroke-width=\"" + (this.reactiveWidth/10) + "\" onMouseOver=\"evt.target.setAttribute('stroke', '" + this.reactiveColor + "'); document.getElementById('label_" + this.id.replace("'", "_prim") + "').setAttribute('fill', '" + this.reactiveColor + "')\" onMouseOut=\"evt.target.setAttribute('stroke', 'transparent'); document.getElementById('label_" + this.id.replace("'", "_prim") + "').setAttribute('fill', 'transparent')\"/> \
		<text x=\"" + (labelX + 1) + "\" y=\"" + (labelY - 1) + "\" font-size=\"" + 2 + "\"><tspan id=\"label_" + this.id.replace("'", "_prim") + "\" fill=\"transparent\">" + label + "</tspan></text>";
	}
}

class SVGShape {
	constructor(points, fillColor, borderColor, borderWidth, label) {
		this.points = points;
		this.fillColor = fillColor;
		this.borderColor = borderColor;
		this.borderWidth = borderWidth;
		this.label = label;
	}
	
	render(viewportConfiguration) {
		var vc = viewportConfiguration;
		var points = this.points.map(function(point) {
			return point.getTransformedX(vc) + "," + point.getTransformedY(vc);
		}).join(" ");
		return "<polygon points=\"" + points + "\" style=\"fill:" + this.fillColor + ";stroke:" + this.borderColor + ";stroke-width:" + (this.borderWidth/10) + "\" />";
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
			return new SVGPoint(pointDefinition.id, coords[0], coords[1], "black", 2, "", "red", 6, pointDefinition.id);
		});
		
		this.lines = previewConfiguration.constructionLinesDefinitions.map(function (lineDefinition) {
			return new SVGLine(
				findPointById(ctx.points, lineDefinition.pointA),
				findPointById(ctx.points, lineDefinition.pointB),
				"black", 1, "red", 6
			);
		});
		
		this.shapes = previewConfiguration.shapesDefinitions.map(function(definition) {
			var points = definition.points.map(function(pointId) {
				return findPointById(ctx.points, pointId)
			});
			return new SVGShape(points, "rgba(255, 178, 0, 0.5)", "rgb(255, 178, 39)", 1, definition.id);
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