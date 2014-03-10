require(['d3','jQuery','Chart','Control','DataCollector','Feed','bootstrap'],function(d3,$,Chart,Control,Collector,Feed){
	var chart = null;
	var newData = new Array();
	
	var config = null;
	
	function update(){
		var collector = new Collector();
		collector.groupBy[config.groupBy](config.modulo);
		collector.wrap[config.wrap]();
		
		for( var i=0;i<newData.length; i++) {
			collector.add(newData[i],1);
		}
		
		collector.data.list.pop(); //skip last because it might not be complete
		
		if ( chart ) {
			chart.update(collector.data);
		} else {
			chart = new Chart(
				collector.data,
				config.modulo +' '+config.groupBy,
				collector.timeFormat
			);
		}
	};
	
	var timeout = null;
	function addData(snapshot) {
		newData = newData.concat(Feed(snapshot.val()));
		if ( timeout ) clearTimeout(timeout);
		timeout = setTimeout(update,100);
	};
	
	var myDataRef = new Firebase('https://nrjfeed.firebaseio.com/feed/');
	
	$control = $('#control');
	$control.on('nrjfb.change',function(event,newConfig){
		if ( chart ) {
			chart.remove();
			chart = null;
		}
		config = newConfig;
		
		query = myDataRef.endAt().limit(10000);
		query.on('child_added', addData);
	});
	
	new Control($control);
});