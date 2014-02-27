define(['d3'],function(d3){
		
	return function Collector(){
		var self=this;
		
		this.data = null;
		this.timeDelta = 0;
		
		var groupBy = function(){
			throw new Error('no grouping');
		};		
		
		var wrap = function(){
			throw new Error('not wrapped');
		};
		
		this.timeFormat = function(){
			throw new Error('no format');
		};
		
		function create(date,watts){
			return {
				date: date,
				watts: watts
			};
		};
		
		function wrapIdx(wrappedDate){
			return (wrappedDate.getTime()-self.data.min.time)/self.timeDelta;
		}
		
		function initContinuousData(){
			self.data = {
				list: new Array(),
				min: {
					time:null,
					watts:null,
				},
				max: {
					time:null,
					watts:null,
				}
			};
		};
		
		function initWrappedData(min,max){
			var delta = self.timeDelta;
			
			var list = new Array();
			for ( var t=min;t<max;t+=delta ) {
				var d = create(new Date(t),0);
				d.iterations = 0;
				d.realWatts = 0;
				
				list.push(d);
			}
			
			self.data = {
				list: list,
				min: {
					time:min,
					watts:null,
				},
				max: {
					time:max,
					watts:null,
				}
			};
		};
		
		this.wrap = {
			continuous: function(){
				self.add = addContinuous;
				wrap = function continuous(d){
					throw new Error('is continuous');
				};
				
				initContinuousData();
			},
			yearly: function(){
				var current = new Date();
				var y = current.getFullYear();
				
				self.add = addWrapped;
				
				wrap = function yearly(d){
					var w = new Date(d); 
					w.setYear(y);
					return w;
				};
				
				initWrappedData(current.getTime(),current.getTime()+364*24*60*60*1000);
			},
			weekly: function(){
				var current = new Date(2013,6,1); //The first of July in 2013 was a Sunday 
				var y = current.getFullYear();
				var m = current.getMonth();
				
				self.add = addWrapped;
				
				wrap = function weekly(d){
					var w = new Date(d);
					w.setYear(y);
					w.setMonth(m);
					w.setDate(((d.getDay()+6)%7)+1);
					
					return w;
				};
				
				initWrappedData(current.getTime(),current.getTime()+7*24*60*60*1000);
			},
			daily: function(){
				var current = new Date(2013,6,1);
				var y = current.getFullYear();
				var m = current.getMonth();
				var t = current.getDate();
				
				self.add = addWrapped;
				
				wrap = function daily(d){
					var w = new Date(d); 
					
					w.setYear(y);
					w.setMonth(m);
					w.setDate(t);
					
					return w;
				};
				
				initWrappedData(current.getTime(),current.getTime()+24*60*60*1000);
			},
			hourly: function(){
				var current = new Date(2013,6,1);
				var y = current.getFullYear();
				var m = current.getMonth();
				var t = current.getDate();
				
				self.add = addWrapped;
				
				wrap = function daily(d){
					var w = new Date(d); 
					
					w.setYear(y);
					w.setMonth(m);
					w.setDate(t);
					w.setHours(0);
					
					return w;
				};
				
				initWrappedData(current.getTime(),current.getTime()+60*60*1000);
			},
		};
		
		var weekFormat = d3.time.format("%a");
		var dayFormat = d3.time.format("%d. %b %Y");
		var hourFormat = d3.time.format("%H:%M");
		
		var defaultTimeFormat = function(d){
			if ( new Date(d).getHours() == 0 ) {
				if ( wrap.name == 'weekly' ) return weekFormat(d);
				
				return dayFormat(d);
			}
			
			return hourFormat(d);
		};
		
		this.groupBy = {
			hour: function(mod){
				if ( !mod ) mod = 1;
				
				self.timeDelta = 60*60*1000*mod;
								
				groupBy = function hour(t){
					var d = new Date(t);
					d.setMinutes(0);
					d.setSeconds(0);
					d.setMilliseconds(0);
					
					var hours = d.getHours();
					hours -= hours % mod;
					d.setHours(hours);
					
					return d;
				};
				
				self.timeFormat = defaultTimeFormat;
			},
			minute: function(mod){
				if ( !mod ) mod = 1;
				
				self.timeDelta = 60*1000*mod;
				
				groupBy = function minute(t){
					var d = new Date(t);
					d.setSeconds(0);
					d.setMilliseconds(0);
					
					var mins = d.getMinutes();
					mins -= mins % mod;
					
					d.setMinutes(mins);
					return d;
				};
				
				self.timeFormat = defaultTimeFormat;
			},
			
			second: function(mod){
				if ( !mod ) mod = 1;
				
				self.timeDelta = 1000*mod;
				
				groupBy = function second(t){
					var d = new Date(t);
					d.setMilliseconds(0);
					
					var seconds = d.getSeconds();
					seconds -= seconds % mod;
					
					d.setSeconds(seconds);
					return d;
				};
				
				self.timeFormat = d3.time.format("%H:%M:%S");
			},
			
			millisecond: function(mod){
				if ( !mod ) mod = 1;
				
				self.timeDelta = mod;
				
				groupBy = function millisecond(t){
					var d = new Date(t);
					
					var milli = d.getMilliseconds();
					milli -= milli % mod;
					
					d.setMilliseconds(milli);
					return d;
				};
				
				self.timeFormat = d3.time.format("%H:%M:%S:%L");
			}
		};
		
		var realWatts = 0;
		var current = null;
		var prev = null;
		
		function applyProjectedWatts(watts){
			realWatts += watts;
			if ( prev ) {
				var ratio = (current.maxTime-current.date.getTime())/self.timeDelta;
				
				current.watts = realWatts+prev.watts*(1-ratio);
			} else { 
				current.watts = realWatts;
			}
			
			current.watts = realWatts;
		}
		
		function shift(){
			var first = self.data.list.shift();
			self.data.min.time = self.data.list[0].date.getTime();
			
			return first;
		};
		
		function minimax(f,a,b){
			return a === null?b:f(a,b);
		}
		
		function addContinuous(realTime,watts){
			var date = groupBy(realTime);
			
			if ( current && current.date.getTime() == date.getTime() ) {
				current.maxTime = Math.max(current.maxTime,realTime);
				applyProjectedWatts(watts);
			} else {
				var next = create(date,watts);
				next.maxTime = realTime;
				
				if ( current ) {
					current.watts = realWatts;
					
					var t1 = current.date.getTime();
					var t2 = next.date.getTime();
				
					if ( t2-t1 > self.timeDelta ) {
						current = create(groupBy(t1+self.timeDelta),0);
						current.maxTime = t1+2*self.timeDelta-1;
						
						self.data.list.push(current);
						
						if ( t2-t1 > 2*self.timeDelta ) {
							current = create(groupBy(t2-self.timeDelta),0);
							current.maxTime = t2-1;
							
							self.data.list.push(current);
						}
					};
					
					prev = current;
				}
				
				current = next;
				
				realWatts = 0;
				applyProjectedWatts(watts);
				
				self.data.list.push(current);
			}
			
			self.data.min.watts = minimax(Math.min,self.data.min.watts,realWatts);
			self.data.max.watts = minimax(Math.max,self.data.max.watts,realWatts);
			
			self.data.min.time = minimax(Math.min,self.data.min.time,current.date.getTime());
			self.data.max.time = minimax(Math.max,self.data.max.time,current.date.getTime());
		};
		
		function addWrapped(realTime,watts){
			var date = groupBy(realTime);
			var wrappedDate = wrap(date);
			var wrappedIdx = wrapIdx(wrappedDate);
			
			var existing = self.data.list[wrappedIdx];
			if ( !existing ) throw new Error('wrapped index ('+ wrappedIdx +') for wrapped date ('+ wrappedDate.toString() +') does not exist');
			existing.realWatts += watts;
			
			if ( !existing.last || existing.last.getTime() != date.getTime() ) {
				existing.last = date; //this only works, if the previous unwrapped but grouped time will never occur again (sorted adds) 
				existing.iterations++;
			}
			
			existing.watts = existing.realWatts / existing.iterations;
			
			self.data.min.watts = minimax(Math.min,self.data.min.watts,existing.watts);
			self.data.max.watts = minimax(Math.max,self.data.max.watts,existing.watts);
		}
		
		
	};
});