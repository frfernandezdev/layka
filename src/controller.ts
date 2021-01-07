import {
	IRouter, 
	Router, 
	Request, 
	Response, 
	NextFunction
} from "express";
import {applyArguments, IArguments, IMethod, IPrototype} from "./layka";
import {
	define, 
	defineByNames, 
	defines, 
	GenericConstructor, 
	GenericFunction, 
	isAsync, 
	isPromise
} from "./utils";



const instance: Map<string, Router> = new Map();

/**
* LykController typing options ControllerOptions.
*/
type ControllerOptions = {
	path?: string|RegExp;
	type?: keyof Response; 
};
/**
* LykController decorator.
*
* Define internal behavior for target controller.
*
* @param {ControllerOptions} options.
*/
export function LykController(options: ControllerOptions) {
	return function<T extends GenericConstructor>(constructor: T) {
		const prototype = constructor.prototype as IPrototype;
		// Define properties of options controller.
		if (options) {
			defineByNames(prototype, options, '__');
		}
		
		const properties: PropertyDescriptorMap = {
			'__handler': { value: newInstance(constructor.name) },
			'__mount': { value: mount },
			'__methods': { value: prototype?.__methods ?? new Map() },
			'__arguments': { value: prototype?.__arguments ?? new Map() }
		}
		// Define properties internal of controller.
		defines(prototype, properties);
	};
};

/**
* Route typing options RouteOptions.
*/
interface RouteOptions {
	method: keyof IRouter;
	path: string|RegExp;
	type?: keyof Response;
};
/**
* Route decorator.
*
* Define internal behavior of route for target method from controller.
*
* @param {RouteOptions} options.
*/
export function Route(options: RouteOptions) {
	return function(
		target: any,
		propertyName: PropertyKey,
		descriptor: TypedPropertyDescriptor<GenericFunction>
	) {
		if (!descriptor?.value) {
			throw new Error("Descriptor must be Function");
		}
		methods(target, propertyName, options, descriptor);
		handler(target, options, descriptor);
	}
};

/**
* Get route decorator method.
*
* Define internal behavior of route (get) for target method from controller.
*
* @param {string|RegExp} path.
* @param {Type} type (options).
*/
export function Get(
	path: string|RegExp, 
	type?: keyof Response
) {
	return Route({
		path,
		method: 'get',
		type
	});
};

/**
* Post route decorator method.
*
* Define internal behavior of route (post) for target method from controller.
*
* @param {string|RegExp} path.
* @param {Type} type (options).
*/
export function Post(
	path: string|RegExp,
	type?: keyof Response 
) {
	return Route({
		path,
		method: 'post',
		type
	});
};

/**
* Put route decorator method.
*
* Define internal behavior of route (put) for target method from controller.
*
* @param {string|RegExp} path.
* @param {Type} type (options).
*/
export function Put(
	path: string|RegExp,
	type?: keyof Response
) {
	return Route({
		path,
		method: 'put',
		type
	});
};

/**
* Patch route decorator method.
*
* Define internal behavior of route (patch) for target method from controller.
*
* @param {string|RegExp} path.
* @param {Type} type (options).
*/
export function Patch(
	path: string|RegExp,
	type?: keyof Response
) {
	return Route({
		path,
		method: 'patch',
		type
	});
};

/**
* Delete route decorator method.
*
* Define internal behavior of route (delete) for target method from controller.
*
* @param {string|RegExp} path.
* @param {Type} type (options).
*/
export function Delete(
	path: string|RegExp,
	type?: keyof Response 
) {
	return Route({
		path,
		method: 'delete',
		type
	});
};


function newInstance(key: string): IRouter {
	const router = Router();
	
	if (instance.has(key)) {
		return instance.get(key) || router;
	}
	instance.set(key, router);
	return instance.get(key) || router;
};


function methods(
	target: IPrototype,
	propertyName: PropertyKey,
	options: RouteOptions,
	descriptor: PropertyDescriptor 
): void {
	if (!('__methods' in target)) {
		define(target, '__methods', { value: new Map });
	}	
	const __methods: IPrototype['__methods'] = target['__methods'];
	const args: IPrototype['__arguments'] = target['__arguments'];

	descriptor.value = <IMethod>{
		method: options.method,
		path: options.path,
		default: descriptor.value,
		args: args.get(propertyName)
	};
	__methods.set(propertyName, descriptor);	
};


function mount(this: any): void {
	const __methods = this['__methods'],
		  __instance = this['__handler'];

	const loop = (
		descriptor: TypedPropertyDescriptor<IMethod>, 
		propertyName: PropertyKey
	) => {
		if (!descriptor.value) {
			throw new Error(`Not found descriptor for ${String(propertyName)}`);
		}

		const __method: IMethod = descriptor.value;

		if (!__method.handler) {
			throw new Error(`Not found handler for ${String(propertyName)} in Controllers`);
		}

		__instance[__method.method].call(
								__instance, 
								__method.path, 
								__method.handler.bind(this));
	};
	__methods.forEach(loop);
};


function handler(
	target: IPrototype,
	options: RouteOptions,
	descriptor: PropertyDescriptor
): void {
	const method: Function = descriptor.value.default,
		  args: IArguments[] = descriptor.value.args;

	descriptor.value.handler = function(
		this: any,
		req: Request,
		res: Response,
		next: NextFunction
	) {
		const type: keyof Response = (options.type || target['__type']) ?? 'json';
		const fn = method.apply(this, applyArguments(args, req, res, next));	
			
		if (!res[type]) {
			throw new Error(`${type} is'nt function of Response.`);	
		}
		
		// if fn instanceof Error, then break execute and delegate the error to next. 
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
			  	.catch((err: any) => next(err));

			return;
		}		
		(res[type] as Function)(fn);
	};	
};



