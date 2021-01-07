export interface LykModel {
	[key: string]: any;
	__database: string;
	__collection: string;
};


type ModelOptions = {
	database?: string;
	collection: string;
};
export function LykModel(options: ModelOptions) {
	return function(
		target: any
	) {
		Object.defineProperty(target, 'constructor', {
			value: function() {
				console.log(arguments)
			}
		})
		Object.defineProperty(target, '__database', {
			enumerable: true,
			value: options.database ?? 'default' 
		});
		Object.defineProperty(target, '__collection', { 
			enumerable: true,
			value: options.collection 
		});	
	}
};

type DataOptions = {
	default: any;
	child: any;
	required: boolean;
};
export function DataType(type: string, options?: DataOptions) {
	return function(
		target: any, 
		propertyName: PropertyKey
	) {
		const symbol = `__${String(propertyName)}`;
		Object.defineProperty(target, symbol, { 
			writable: true,
			configurable: true, 
			value: target[propertyName] 
		});
		Object.defineProperty(target, propertyName, {
			get: () => {
				return target[symbol];
			},
			set: (val: any) => {
				if (!validators[type].call(null, val))
					throw new Error(`${String(propertyName)} is not a ${options}`);
				target[symbol] = val;
			}
		});
	};
};


const validators: {[key: string]: any} = {
	string: (val:any) => {
		return typeof val === 'string' && val !== '' && val.length > 0;
	}
};
