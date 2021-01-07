import express, {IRouter, NextFunction, Request as Req, Response as Res, Router} from "express";
import methodOverride from "method-override";
import cors from "cors";
import logger from "morgan";
import {define, defineByNames, mixins} from "./utils";



export type IPrototype = {
	__path: string;
	__type: keyof Res;
	__handler: Router;
	__mount: Function;
	__methods: Map<PropertyKey, PropertyDescriptor>;
	__arguments: Map<PropertyKey, IArguments[]>;
};

export type IArguments = {
	method: keyof Req | 'request' | 'response' | 'error' | 'status';
	position: number;
	name: string;
};

export type IMethod = {
	method: keyof IRouter;
	path: string|RegExp;
	handler?: Function;
	default: Function;
	args: IArguments[];
};

type Option = {
	version: number;
	prefix?: string;
	middlewares: any[];
	controllers: any[];
	exceptions: any[];
};
export function Layka(options: Option) {
	return function(
		target: Function
	) {
		defineByNames(target.prototype, options);
	};
};


export function plataform() {
	const wsgi: express.Application = express();

	return { bootstrap: __bootstrap(wsgi) };
};


function __bootstrap(wsgi: express.Application) {
	return function(app: { new(...args: any[]): void }): void {
		mixins(Root, [app]);
		
		const instance = new Root;
		const { 
			version, 
			prefix, 
			handler 
		} = instance;

		const path: string[] = [];
		
		path.push(prefix !== '/' ? prefix : '');
		path.push(`v${version}`);
		
		wsgi.use(path.join('/'), handler);
		wsgi.listen(8080, () => {
			console.log('Listening on PORT:'+ 8080)
		});
	};
};


const defaults = [
	express.urlencoded({ extended: true, limit: '1mb' }),
	methodOverride(),
	cors({ origin: true }),
	logger('dev'),
	express.json({ limit: '10mb' }),
];

class Root {
	private __handler: express.Application = express();

	public version: number = 1;
	public prefix: string = '/';
	private middlewares?: any[];
	private controllers?: any[];
	private exceptions?: any[];

	constructor() {	
		this.__initializeDefaults();
		this.__initializeMiddlewares();
		this.__initializeControllers();
		this.__initializeExceptions();
	}

	public get handler() {
		return this.__handler;
	}
	
	private __initializeDefaults() {
		defaults.forEach((item: any) => this.__handler.use(item));
	}

	private __initializeMiddlewares() {
		this.middlewares?.forEach((item: any) => {
			const instance = new item,
			      args = [];

			instance['__mount'].call(instance);

			if (instance.__path) {
				args.push(instance.__path);
			}
			if (!instance.__handler) {
				throw new Error("Error in attach middleware without handler.");
			}
	
			args.push(instance.__handler);
			this.__handler.use(...args);
		});
	}

	private __initializeControllers() {
		this.controllers?.forEach((item: any) => {
			const instance = new item,
				  args = [];
			
			instance['__mount'].call(instance);

			if (instance.__path) {
				args.push(instance.__path);
			}
			if (!instance.__handler) {
				throw new Error("Error in attach controller without handler.");
			}
		
			args.push(instance.__handler);
			this.__handler.use(...args);
		});
	}

	private __initializeExceptions() {
		this.exceptions?.forEach((item: any) => {
			const instance = new item,
			  	  args = [];
			
			instance['__mount'].call(instance);

			if (instance.__path) {
				args.push(instance.__path);
			}
			if (!instance.__handler) {
				throw new Error("Error in attach exception without handler.");
			}

			args.push(instance.__handler);
			this.__handler.use(...args);
		});
	}
};


/**
* Param decorator parameter.
*
* Inyect request param to parameter by name.
*
* @param {string} name.
*/
export function Params(name: string) {
	return function(
		target: IPrototype,
		propertyName: PropertyKey,
		parameterIndex: number
	) {
		addArguments(
			target, 
			propertyName, 
			{
				method: 'params',
				name,
				position: parameterIndex
			});
	};
};

/**
* Query decorator parameter.
*
* Inyect request query to paramter by name.
*
* @param {string} name.
*/
export function Query(name: string) {
	return function(
		target: IPrototype,
		propertyName: PropertyKey,
		parameterIndex: number
	) {
		addArguments(
			target, 
			propertyName, 
			{
				method: 'query',
				name,
				position: parameterIndex
			});
	};
};

/**
* Body decorator parameter.
*
* Inyect request body to parameter by name.
*
* @param {string} name.
*/
export function Body(name: string) {
	return function(
		target: IPrototype,
		propertyName: PropertyKey,
		parameterIndex: number
	) {
		addArguments(
			target, 
			propertyName, 
			{
				method: 'body',
				name,
				position: parameterIndex
			});
	};
};

/**
* Header decorator parameter.
*
* Inyect request header to parameter by name.
*
* @param {string} name.
*/
export function Headers(name: string) {
	return function(
		target: IPrototype,
		propertyName: PropertyKey,
		parameterIndex: number
	) {
		addArguments(
			target, 
			propertyName, 
			{
				method: 'headers',
				name,
				position: parameterIndex
			});
	};
};

/**
* Next decorator parameter.
*
* Inyect request next to parameter.
*
*/
export function Next(
	target: IPrototype,
	propertyName: PropertyKey,
	parameterIndex: number
) {	
	addArguments(
		target, 
		propertyName, 
		{
			method: 'next',
			name: 'next',
			position: parameterIndex
		});
};

/**
* Request decorator parameter.
*
* Inyect request to parameter.
*
*/
export function Request(
	target: IPrototype,
	propertyName: PropertyKey,
	parameterIndex: number
) {	
	addArguments(
		target, 
		propertyName, 
		{
			method: 'request',
			name: 'request',
			position: parameterIndex
		});
};


/**
* Response decorator parameter.
*
* Inyect response to parameter.
*
*/
export function Response(
	target: IPrototype,
	propertyName: PropertyKey,
	parameterIndex: number
) {	
	addArguments(
		target, 
		propertyName, 
		{
			method: 'response',
			name: 'response',
			position: parameterIndex
		});
};


/**
* Response decorator parameter.
*
* Inyect response to parameter.
*
*/
export function Err(
	target: IPrototype,
	propertyName: PropertyKey,
	parameterIndex: number
) {	
	addArguments(
		target, 
		propertyName, 
		{
			method: 'error',
			name: 'error',
			position: parameterIndex
		});
};


/**
* Status decorator parameter.
*
* Inyect status function to parameter.
*
*/
export function Status(
	target: IPrototype,
	propertyName: PropertyKey,
	parameterIndex: number
) {
	addArguments(
		target, 
		propertyName,
		{
			method: 'status',
			name: 'status',
			position: parameterIndex
		});
}; 


export function addArguments(
	target: IPrototype,
	propertyName: PropertyKey,
	args: IArguments
): void {
		if (!('__arguments' in target)) {
			define(target, '__arguments', { value: new Map });
		}
		const __arguments = target['__arguments'];
		if (!__arguments.has(propertyName)) {
			__arguments.set(propertyName, [args]);
			return;
		}
		const arr: IArguments[] = __arguments.get(propertyName) || [];
		      arr.push(args);
		__arguments.set(propertyName, arr);
};


export function applyArguments(
	args: IArguments[],
	req: Req,
	res: Res,
	next: NextFunction,
	err?: Error
): any[] {
	const output: any[] = [];
	
	if (!args) {
		return output;
	}
	
	args.sort((a, b) => a.position - b.position)
		.reduce((prev, curr) => {
			const { method, name }: IArguments = curr;

			if (method === 'next') {
				prev.push(next);
				return prev;
			}

			if (method === 'request') {
				prev.push(req);
				return prev;
			}

			if (method === 'response') {
				prev.push(res);
				return prev;
			}

			if (method === 'status') {
				prev.push(res.status);
				return prev;
			} 

			if (method === 'error') {
				prev.push(err);
				return prev;
			}

			const raw = req[method];

			if (raw.hasOwnProperty(name)) {
				prev.push(raw[name]);
			}
			else {
				prev.push(undefined);
			} 
			return prev;
		}, output);	

	return output;
};













