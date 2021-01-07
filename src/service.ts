type Option = {

};


export function LykService(options: Option) {
	return function(
		target: any
	) {
		console.log(options);
		Object.defineProperties(target, {
		
		});
	}
};
