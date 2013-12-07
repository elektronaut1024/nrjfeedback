require(['d3','Chart','DataCollector'],function(d3,Chart,Collector){
	d3.json('feed.json',function(d){
		var feed = new Array();
		function descend(d){
			if ( !d ) return;
			
			if ( d.ts ) {
				for( var i=0; i<d.times.length; i++) {
					feed.push({
						time:d.ts*1000+d.times[i],
						watts:1
					});
				}
			} else {
				if ( d instanceof Array ) {
					for ( var i=0; i<d.length; i++ ) {
						descend(d[i]);
					}
				} else {
					for ( var key in d ) {
						descend(d[key]);
					}
				}
			}
		}
		descend(d);
		
		feed = feed.sort(function(a,b){
			return d3.ascending(a.time,b.time);
		});
		
		var offset = 5250;
		var inputList = feed.slice(offset);
		var startList = feed.slice(0,offset);
		
		var timeWindow = 24*60*60*1000;
		
		var groupBy = Collector.groupBy.second;
		var mod = 1;
		
		var data = Collector.rollup(startList,groupBy(mod));
		
		var chart = new Chart(data,mod +' '+ groupBy.name);
		
		var int = setInterval(function(){
			var value = inputList.shift();
			
			if ( inputList.length <= 0 ) clearInterval(int);
			
			data.add(value.time,value.watts);
			if ( timeWindow ) {
				while ( data.max.time - data.min.time > timeWindow ) {
					data.shift();
				}
			}
			
			chart.update(data);
		},1000);
	});
	
	
	/*
	var myDataRef = new Firebase('https://nrjfeed.firebaseio.com/feed/2013/11/27/');
	myDataRef.on('child_added', function(snapshot) {
		descend(snapshot.val());
	});
	*/
});