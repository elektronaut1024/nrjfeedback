define(['d3'],function(d3){
	return function Chart(data,wattsUnit){
		var margin = {
			top : 20,
			right : 20,
			bottom : 30,
			left : 50
		}, width = 1500 - margin.left - margin.right, height = 500 - margin.top
				- margin.bottom;
	
		var x = d3.time.scale().range([ 0, width ]);
	
		var y = d3.scale.linear().range([ height, 0 ]);
		
		function updateDomain(data){
			x.domain([
				data.min.time,
				data.max.time
			]);
			
			y.domain([
				0,
				data.max.watts*1.3
			]);
		}
		
		updateDomain(data);
	
		var xAxis = d3.svg.axis()
			.scale(x)
			.orient("bottom")
			.tickFormat(d3.time.format("%H:%M:%S"))
		;
	
		var yAxis = d3.svg.axis().scale(y).orient("left");
	
		var line = d3.svg.line()
			.interpolate('basxis')
			.x(function(d) {
				return x(d.maxTime);
			})
			.y(function(d) {
				return y(d.watts);
			})
		;
	
		var svg = d3.select("body").append("svg")
			.attr("width",width + margin.left + margin.right)
			.attr("height",height + margin.top + margin.bottom)
			.append("g").attr("transform","translate(" + margin.left + "," + margin.top + ")")
		;
		
		svg.append("g")
			.attr("class", "x axis")
			.attr("transform","translate(0," + height + ")")
			.call(xAxis)
		;
		
		svg.append("g").attr("class", "y axis")
			.call(yAxis)
			.append("text")
				.attr("transform", "rotate(-90)")
				.attr("y", 6)
				.attr("dy",".71em")
				.style("text-anchor", "end")
				.text("Watts / "+ wattsUnit)
		;
	
		svg.append("path")
			.attr("class", "line")
			.datum(data.list)
			.attr("d", line)
		;
		
		this.update = function(data){
			updateDomain(data);
			
			svg.selectAll("g.x.axis")
				.call(xAxis)
			;
			
			svg.selectAll("g.y.axis")
				.call(yAxis)
			;
			
			svg.selectAll("path.line")
				.datum(data.list)
				//.transition()
				.attr("d", line) // apply the new data values
			;
		};
	};
});