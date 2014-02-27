require(['d3','jQuery','Chart','Control','DataCollector','Feed'],function(d3,$,Chart,Control,Collector,Feed){
	var chart = null;
	
	function draw(config){
		if ( chart ) chart.remove();
		
		var collector = new Collector();
		var mod = parseInt(config.modulo);
		collector.groupBy[config.groupBy](mod);
		collector.wrap[config.wrap]();
		//collector.timeWindow = parseInt(config.timeWindow)*collector.timeDelta;
		
		var fileFormat = d3.time.format('feed/%Y.%m.%d.json');
		
		var files = [];
		var start = new Date(2013,10,26), end = new Date(2013,11,13);
		
		while ( start <= end ) {
			files.push(fileFormat(start));
			start.setDate(start.getDate()+1);
		}
		
		function processFile(){
			var file = files.shift();
			
			console.log(file);
			
			if ( file ) {
				d3.json(file,function(json){
					var feed = Feed(json);
					for( var i=0;i<feed.length;i++) collector.add(feed[i],1);
					
					processFile();
				});
			} else {
				showChart();
			}
		}
		
		processFile();
		
		function showChart(){
			chart = new Chart(
				collector.data,
				config.modulo +' '+config.groupBy,
				collector.timeFormat
			);
		}
	};
	
	$control = $('#control');
	$control.on('nrjfb.change',function(event,config){
		draw(config);
	});
	
	new Control($control);
	
	
	/*
	var myDataRef = new Firebase('https://nrjfeed.firebaseio.com/feed/2013/11/27/');
	myDataRef.on('child_added', function(snapshot) {
		descend(snapshot.val());
	});
	*/
});