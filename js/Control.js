define(['jQuery'],function($){
	return function Control($content){
		var config = {
			curves : {},
		};
				
		var inputs = {
			$wrap: $content.find('select[name=wrap]'),
			$modulo: $content.find('input[name=modulo]'),
			$groupBy: $content.find('select[name=groupBy]'),
		};
		
		var $curveList = $content.find('.curves ul');
		var $curveTemplate = $curveList.find('li');
		$curveTemplate.remove();
		
		var curveIdxCounter = 0;
		
		$content.find('.curves [name=add]').on('click',function(event){
			event.preventDefault();
			
			var curve = {
				idx: curveIdxCounter++,
				start: null,
				end: null
			};
			
			var $curveContent = $curveTemplate.clone();
			
			$curveContent.find('[name=remove]').on('click',function(event){
				event.preventDefault();
				$curveContent.remove();
				
				$content.triggerHandler('nrjfb.curve.remove',curve.idx);
			});
			
			$curveContent.find('[name=time-start]').on('change',function(){
				curve.start = $(this).val();
			});
			
			$curveContent.find('[name=time-end]').on('change',function(){
				curve.end = $(this).val();
			});
			
			config.curves[curve.idx] = curve;
			
			$content.triggerHandler('nrjfb.curve.add',curve.idx);
			
			$curveList.append($curveContent);
		});
		
		function change(){
			$content.triggerHandler('nrjfb.change',config);
		};
		
		function init($input,defaultValue){
			var inputName = $input.attr('name');
			
			config[inputName] = defaultValue;
			$input.val(defaultValue);
			$input.on('change',function(){
				config[inputName] = $(this).val();
				
				$content.triggerHandler('nrjfb.change.'+ inputName,config[inputName]);
				
				change();
			});
		}
		
		init(inputs.$wrap,'continuous');
		init(inputs.$modulo,'1');
		init(inputs.$groupBy,'hour');
	};
});