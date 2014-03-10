require(['d3','jQuery','Chart','Control','DataCollector','Feed'],function(d3,$,Chart,Control,Collector,Feed){

	
	var chart = null;
	var newData = new Array();
	
	var config = {
		groupBy:'second',
		wrap:'continuous',
		modulo:30
	};
	
	var factor = 60*(60/config.modulo);
	
	function update(){
		var collector = new Collector();
		collector.groupBy[config.groupBy](config.modulo);
		collector.wrap[config.wrap]();
		
		for( var i=0;i<newData.length; i++) {
			collector.add(newData[i],1*factor);
		}
		
		collector.data.list.pop(); //skip last because it might not be complete
		
		if ( chart ) {
			chart.update(collector.data);
		} else {
			chart = new Chart(
				collector.data,
				'Hour',
				collector.timeFormat
			);
		}
		
		var last = collector.data.list.pop();
		$('#currentUsage p em').text(last.watts);
	};
	
	var timeout = null;
	function addData(snapshot) {
		newData = newData.concat(Feed(snapshot.val()));
		if ( timeout ) clearTimeout(timeout);
		timeout = setTimeout(update,100);
	};
	
	var myDataRef = new Firebase('https://nrjfeed.firebaseio.com/feed/');
	query = myDataRef.endAt().limit(3000);
	query.on('child_added', addData);
});