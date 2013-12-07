define(['d3'],function(d3){
	
	function hourly(t,mod){
		var d = new Date(t);
		d.setMinutes(0);
		d.setSeconds(0);
		d.setMilliseconds(0);
		
		var hours = d.getHours();
		hours -= hours % mod;
		d.setHours(hours);
		
		return d;
	}
	
	function minutely(t,mod){
		var d = new Date(t);
		d.setSeconds(0);
		d.setMilliseconds(0);
		
		var mins = d.getMinutes();
		mins -= mins % mod;
		
		d.setMinutes(mins);
		return d;
	}
	
	function millisecondly(t,mod){
		var d = new Date(t);
		
		var milli = d.getMilliseconds();
		milli -= milli % mod;
		
		d.setMilliseconds(milli);
		return d;
	}
	
	function secondly(t,mod){
		var d = new Date(t);
		d.setMilliseconds(0);
		
		var seconds = d.getSeconds();
		seconds -= seconds % mod;
		
		d.setSeconds(seconds);
		return d;
	}
	
	function rollup(list,timeFunction){
		var data = {
			list: null,
			min: {
				time:null,
				watts:null,
			},
			max: {
				time:null,
				watts:null,
			}
		};
		
		function updateMinMax(time,watts){
			data.min.time = data.min.time===null?time:Math.min(data.min.time,time);
			data.min.watts = data.min.watts===null?watts:Math.min(data.min.watts,watts);
			
			data.max.time = Math.max(data.max.time,time);
			data.max.watts = Math.max(data.max.watts,watts);
		};
		
		function create(time,watts,maxTime){
			return {
				"time":time,
				"watts":watts,
				"maxTime":maxTime
			};
		};
		
		function groupList(){
			var rolled = d3.nest()
				.key(function(d){
					return timeFunction(d.time).getTime();
				})
				.rollup(function(leaves){
					var time = timeFunction(d3.min(leaves,function(d){
						return d.time;
					}));
					
					var maxTime = d3.max(leaves,function(d){
						return d.time;
					});
					
					var watts = d3.sum(leaves,function(d){
						return d.watts;
					});
					
					updateMinMax(maxTime,watts);
					
					return create(time,watts,maxTime);
				})
				.entries(list)
			;
			
			data.list = new Array();
			
			rolled.forEach(function(element){
				data.list.push(element.values);
			});
		}
		
		function sortList(){
			data.list = data.list.sort(function(a,b){
				return d3.ascending(a.time.getTime(),b.time.getTime());
			});
		}
		
		groupList();
		sortList();
		
		var prev = data.list[data.list.length-2];
		var last = data.list[data.list.length-1];
		var delta = last.time - prev.time;
		
		var realWatts = 0;
		
		function applyProjectedWatts(watts){
			realWatts += watts;
			last.watts = realWatts+prev.watts*(1-(last.maxTime-last.time)/delta);
			//last.watts = realWatts;
		}
		
		applyProjectedWatts(last.watts);
		
		
		data.shift = function(){
			var first = data.list.shift();
			data.min.time = data.list[0].time;
			
			return first;
		};
		
		data.add = function(realTime,watts){
			time = timeFunction(realTime);
			
			if ( last.time.getTime() == time.getTime() ) {
				last.maxTime = Math.max(last.maxTime,realTime);
				applyProjectedWatts(watts);
			} else {
				last.watts = realWatts;
				
				var next = create(time,watts,realTime);
				
				console.log(new Date(last.time),delta,new Date(next.time));
				
				if ( last.time + delta < next.time ) {
					var bridgeStart = create(last.time+delta,0,last.time+2*delta-1);
					var bridgeEnd = create(next.time-delta,0,next.time-1);
					
					data.list.push(bridgeStart);
					data.list.push(bridgeEnd);
					
					last = bridgeEnd;
				}
						
				prev = last;
				last = next;
				
				realWatts = 0;
				applyProjectedWatts(watts);
				
				data.list.push(last);
			}
			
			updateMinMax(realTime,watts);
		};
		
		return data;
	}
	
	return {
		rollup : rollup,
		groupBy : {
			hour: function hour(mod){
				if ( !mod ) mod = 1;
				
				return function(t){
					return hourly(t,mod);
				};
			},
			minute: function minute(mod){
				if ( !mod ) mod = 1;
				
				return function(t){
					return minutely(t,mod);
				};
			},
			
			second: function second(mod){
				if ( !mod ) mod = 1;
				
				return function(t){
					return secondly(t,mod);
				};
			},
			
			millisecond: function millisecond(mod){
				if ( !mod ) mod = 1;
				
				return function(t){
					return millisecondly(t,mod);
				};
			},
		}
	};
});