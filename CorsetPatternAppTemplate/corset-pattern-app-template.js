function t_corset(str, languageId = "eng") {
	window.t_corset_eng = {
	};

	try {
		return window["t_corset_" + languageId][str];
	} catch(ex) {
		console.log(ex);
		return window.t_corset_eng[str];
	}
}

class CorsetPatternAppTemplate {
	constructor(title, partsNumber, usedLevels, partsDefinitions, exampleInputCode) {
		var inputDefinitions = [];
		
		if(usedLevels.includes("bust"))
			inputDefinitions.push(new InputDefinition("bust", "Bust circumference"));
		
		if(usedLevels.includes("underbust"))
			inputDefinitions.push(new InputDefinition("underbust", "Underbust circumference"));
		
		if(usedLevels.includes("waist"))
			inputDefinitions.push(new InputDefinition("waist", "Waist circumference"));
		
		if(usedLevels.includes("upperHips"))
			inputDefinitions.push(new InputDefinition("upperHips", "Upper hips circumference"));
		
		if(usedLevels.includes("hips"))
			inputDefinitions.push(new InputDefinition("hips", "Hips circumference"));
		
		if(usedLevels.includes("bust"))
			inputDefinitions.push(new InputDefinition("waistToBust", "Waist to bust"));
		
		if(usedLevels.includes("underbust"))
			inputDefinitions.push(new InputDefinition("waistToUnderbust", "Waist to underbust"));
		
		if(usedLevels.includes("upperHips"))
			inputDefinitions.push(new InputDefinition("waistToUpperHips", "Waist to upper hips"));
		
		if(usedLevels.includes("hips"))
			inputDefinitions.push(new InputDefinition("waistToHips", "Waist to hips"));
		
		inputDefinitions.push(new InputDefinition("toTopFront", "Waist to top at front"));
		inputDefinitions.push(new InputDefinition("toTopSide", "Waist to top at side"));
		inputDefinitions.push(new InputDefinition("toTopBack", "Waist to top at back"));
		inputDefinitions.push(new InputDefinition("toBottomFront", "Waist to bottom at front"));
		inputDefinitions.push(new InputDefinition("toBottomSide", "Waist to bottom at side"));
		inputDefinitions.push(new InputDefinition("toBottomBack", "Waist to bottom at back"));
		inputDefinitions.push(new InputDefinition("reduction", "Reduction"));
		inputDefinitions.push(new InputDefinition("backSpace", "Back space width"));
		
		var outputDefinitions = [
			new OutputDefinition("patternWidth", "Pattern width", function(v) { return (Math.max(v.bust ? v.bust : 0, v.underbust ? v.underbust : 0, v.upperHips ? v.upperHips : 0, v.hips ? v.hips : 0) - v.backSpace)/2.0;}, "cm"),
			new OutputDefinition("patternHeight", "Pattern height", function(v) { return v.h_waist + Math.max(v.toBottomFront, v.toBottomSide, v.toBottomBack);}, "cm")
		];
		
		for(var i = 0; i<partsNumber; ++i) {
			outputDefinitions.push(new OutputDefinition("v_" + i, "From (0, 0) to v_" + i, function(v, i) { return (i*v.patternWidth)/4.0;}, "cm", true, i));
		}
		
		if(usedLevels.includes("bust")) {
			outputDefinitions.push(new OutputDefinition("calculated_bust", "Calculated bust corset length", function(v) { return (v.bust - v.backSpace)/2.0;}, "cm"));
		}
		
		if(usedLevels.includes("underbust")) {
			outputDefinitions.push(new OutputDefinition("calculated_underbust", "Calculated underbust corset length", function(v) { return (v.underbust - v.backSpace)/2.0;}, "cm"));
		}
		
		outputDefinitions.push(new OutputDefinition("calculated_waist", "Calculated waist corset length", function(v) { return (v.waist - v.backSpace)/2.0;}, "cm"));
		
		if(usedLevels.includes("upperHips")) {
			outputDefinitions.push(new OutputDefinition("calculated_upperHips", "Calculated upper hips corset length", function(v) { return (v.upperHips - v.backSpace)/2.0;}, "cm"));
		}
		
		if(usedLevels.includes("hips")) {
			outputDefinitions.push(new OutputDefinition("calculated_hips", "Calculated hips corset length", function(v) { return (v.hips - v.backSpace)/2.0;}, "cm"));
		}
		
		if(usedLevels.includes("bust")) {
			outputDefinitions.push(new OutputDefinition("h_bust", "From (0, 0) to h_bust", function(v) { return v.h_waist - v.waistToBust;}, "cm"));
		}
		
		if(usedLevels.includes("underbust")) {
			outputDefinitions.push(new OutputDefinition("h_underbust", "From (0, 0) to h_underbust", function(v) { return v.h_waist - v.waistToUnderbust;}, "cm"));
		}
		
		outputDefinitions.push(new OutputDefinition("h_waist", "From (0, 0) to h_waist", function(v) { return Math.max(v.toTopFront, v.toTopSide, v.toTopBack);}, "cm"));
		
		if(usedLevels.includes("upperHips")) {
			outputDefinitions.push(new OutputDefinition("h_upperHips", "From (0, 0) to h_upperHips", function(v) { return v.h_waist + v.waistToUpperHips;}, "cm"));
		}
		
		if(usedLevels.includes("hips")) {
			outputDefinitions.push(new OutputDefinition("h_hips", "From (0, 0) to h_hips", function(v) { return v.h_waist - v.waistToHips;}, "cm"));
		}
		
		//preparation before couting lengths
		var sums = Array.apply(null, Array(usedLevels.length)).map(Number.prototype.valueOf,0);
		
		partsDefinitions.forEach(function(partDefinition) {
			partDefinition.forEach(function(lengths, i) {
				sums[i] += lengths[0] + lengths[1];
			});
		});
		
		//main calculations
		var points = [];
		var paths = [];
		
		function genLetter(letter, diff = 1) {
			return String.fromCharCode(letter.charCodeAt(0) + diff);
		}
		
		partsDefinitions.forEach(function (definition, partNo) {
			var pointNo = 1;
			var path = []
			definition.forEach(function (lengths, levelNo) {
				var guidePointId = "G_" + genLetter("A", partNo) + (levelNo + 1);
				
				if(lengths[0] != 0) {
					var leftPointId = genLetter("A", partNo) + pointNo;
					pointNo += 1;
					outputDefinitions.push(new OutputDefinition(leftPointId + "_to_" + guidePointId, "Length between " + leftPointId + " and " + guidePointId, function(v, args) { return v["calculated_" + args[0]]*args[1];}, "cm", true, [usedLevels[levelNo], lengths[0]/sums[levelNo]]));
					points.push(new PointDefinition(leftPointId, function(v, args) { return [v[args[0]][0] - v[args[1] + "_to_" + args[0]], v[args[0]][1]];}, [guidePointId, leftPointId]));
					path.unshift(leftPointId);
				}
				
				points.push(new PointDefinition(guidePointId, function(v, args) { return [v["v_" + args[0]], v["h_" + args[1]]];}, [partNo, usedLevels[levelNo]]));
				if(levelNo == 0)
					path.push(guidePointId);
				if(levelNo == usedLevels.length -1)
					path.unshift(guidePointId);
				
				if(lengths[1] != 0) {
					var rightPointId = genLetter("A", partNo) + pointNo;
					pointNo += 1;
					outputDefinitions.push(new OutputDefinition(guidePointId + "_to_" + rightPointId, "Length between " + guidePointId + " and " + rightPointId, function(v, args) { return v["calculated_" + args[0]]*args[1];}, "cm", true, [usedLevels[levelNo], lengths[1]/sums[levelNo]]));
					points.push(new PointDefinition(rightPointId, function(v, args) { return [v[args[0]][0] + v[args[0] + "_to_" + args[1]], v[args[0]][1]];}, [guidePointId, rightPointId]));
					path.push(rightPointId);
				}
				
				
			});
			paths.push(new PathDefinition(path));
		});
		
		var previewConfiguration = new PreviewConfiguration(points, paths, [
		//TODO
		], 20, 10);
			
		this.app = new PatternAppTemplate(title, inputDefinitions, outputDefinitions, previewConfiguration, null, null, exampleInputCode);
	}

	mount(id) {
		this.app.mount(id);
	}
}