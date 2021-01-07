import {NextFunction, Request, Response} from "express";
import {applyArguments, IArguments, IMethod, IPrototype} from "./layka";
import {define, defineByNames, defines, GenericConstructor, getPropertyDescriptor, isAsync, isPromise} from "./utils";

export interface LykException {
	intercept(...args: any[]) : void;	
};

/**
* LykMiddleware typing options ControllerOptions.
*/
type ExceptionOptions = {
	path?: string|RegExp;
	type?: keyof Response; 
};
export function LykException(options: ExceptionOptions) {
	return function<T extends GenericConstructor>(constructor: T) {
		const prototype = constructor.prototype as IPrototype;
		// Define properties of options controller.
		if (options) {
			defineByNames(prototype, options, '__');
		}

		const properties: PropertyDescriptorMap = {
			'__handler': {
				configurable: true,
				value: null,
				writable: true
			},
			'__mount': { value: mount },
			'__methods': { value: prototype?.__methods ?? new Map() },
			'__arguments': { value: prototype?.__arguments ?? new Map() }
		}
		// Define properties internal of controller.
		defines(prototype, properties);
		
		const descriptor: PropertyDescriptor = getPropertyDescriptor(prototype, 'intercept') || {};
		methods(prototype, 'intercept', descriptor);
		handler(prototype, options, descriptor);
	}
};


function methods(
	target: IPrototype,
	propertyName: PropertyKey,
	descriptor: PropertyDescriptor
): void {
	if (!('__methods' in target)) {
		define(target, '__methods', { value: new Map });
	}

	const __methods: IPrototype['__methods'] = target['__methods'];
	const args: IPrototype['__arguments'] = target['__arguments'];
	
	descriptor.value =  <IMethod> {
		default: descriptor.value,
		args: args.get(propertyName)
	};
	__methods.set(propertyName, descriptor);
};


function handler(
	target: IPrototype,
	options: ExceptionOptions,
	descriptor: PropertyDescriptor
): void {
	const method: Function = descriptor.value.default,
		  args: IArguments[] = descriptor.value.args;

	descriptor.value.handler = function(
		this: any,
		err: Error,
		req: Request,
		res: Response,
		next: NextFunction
	) {
		const type: keyof Response = (options.type || target['__type']) ?? 'json';
		const fn = method.apply(this, applyArguments(args, req, res, next, err));	
			
		if (!res[type]) {
			throw new Error(`${type} is'nt function of Response.`);	
		}
		
		// if fn instanceof Error, then break execute and 
		// Si fn instanceof Error, entonces rompe la execucion y delega el error a next.
		if (fn instanceof Error) {
			return next(fn);
		}
		
		// if fn is undefined, then break execute. Because handler function catch error.
		if (!fn) {
			return;
		}

		if (isAsync(fn) || isPromise(fn)) {
			fn.then((rtrn: Function) => {
					if (!rtrn) {
						return;
					}
					(res[type] as Function)(rtrn);
				})
			  	.catch((__: any) => next(__));

			return;
		}		
		(res[type] as Function)(fn);
	}
};


function mount(this: any): void {
	const __methods = this['__methods'];

	const loop = (
		descriptor: TypedPropertyDescriptor<IMethod>,
		propertyName: PropertyKey
	) => {
		if (!descriptor.value) {
			throw new Error(`Not found descriptor for ${String(propertyName)}`);
		}	

		const __method: IMethod = descriptor.value;

		if (!__method.handler) {
			throw new Error(`Not found handler for ${String(propertyName)}`);
		}

		this['__handler'] = __method.handler.bind(this);
	};
	__methods.forEach(loop);
};


