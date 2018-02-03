class PointDefinition {
	constructor(id, recipe, args) {
		this.id = id;
		this.recipe = recipe;
		this.args = args;
	}
}

class ShapeDefinition {
	constructor(id, points) {
		this.id = id;
		this.points = points;
	}
}

class LineDefinition {
	constructor(pointA, pointB) {
		this.pointA = pointA;
		this.pointB = pointB;
	}
}

class GuideLineDefinition {
	constructor(space, coord) {
		this.space = space;
		this.coord = coord;
	}
}