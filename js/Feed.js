define(['d3'],function(d3){
	return function Feed(data){
		var feed = new Array();
		function descend(d){
			if ( !d ) return;
			
			if ( d.ts ) {
				for( var i=0; i<d.times.length; i++) {
					feed.push(d.ts*1000+d.times[i]);
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
		descend(data);
		
		feed = feed.sort();
		
		return feed;
	};
});