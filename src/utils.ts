/** Global typing */
export type GenericConstructor = { new (...args: any[]): void };
export type GenericFunction = (...args: any[]) => any;
export type GenericObject = {[key: string]: any};
/***/



/**
 * Mixins multiples classes.
 *
 * @param {Function} target.
 * @param {Array<Any>} constructors.
 * @return {void}
*/
export function mixins(target: Function, constructors: any[]): void {
	constructors.forEach((base: any) => {
		defineByNames(target.prototype, base.prototype);
	});
};

/**
 * What's it.
 *
 * @param {Any} it.
 * @return {String} typing of it.
*/
export function whatsIt(it: any): string {
	return it.toString().match(/ (\w+)/)[1];
}; 

/**
* Get prototype of instance or object.
*
* @param {Object} instance.
* @return {Prototype}
*/
export function getPrototype<T>(instance: T): object {
	return Object.getPrototypeOf(instance);
};

/**
* Get property names.
*
* @param {Object} target.
* @return {Array<String>} array within properties names of target.
*/
export function getPropertyNames<T>(target: T): string[] {
	return Object.getOwnPropertyNames(target);
};

/**
* Get property descriptors.
*
* @param {Object} target.
* @return {PropertyDescriptorMap|undefined}
*/
export function getPropertyDescriptors<T>(target: T): PropertyDescriptorMap|undefined {
	return Object.getOwnPropertyDescriptors(target);
};

/**
* Get property descriptor
*
* @param {Object} target.
* @param {PropertyKey} key.
* @return {PropertyDescriptor|undefined}.
*/
export function getPropertyDescriptor<T>(
	target: T, 
	key: PropertyKey
): PropertyDescriptor|undefined {
	return Object.getOwnPropertyDescriptor(target, key);
};

/**
* Define property of target.
*
* @param {Object} target.
* @param {PropertyKey} key.
* @param {PropertyDescriptor} descriptor
* @return {void}
*/
export function define<T>(
	target: T, 
	key: PropertyKey, 
	descriptor: PropertyDescriptor
): void {
	Object.defineProperty(target, key, descriptor);	
};

/**
* Defines properties of target.
*
* @param {Object} target.
* @param {PropertyDescriptorMap} descriptors
* @return {void}
*/
export function defines<T>(
	target: T, 
	descriptors: PropertyDescriptorMap
): void {
	Object.defineProperties(target, descriptors);
};

/**
* Defines propeties by names from obj to target.
*
* @param {Object} target.
* @param {Object} obj.
* @param {String} prefix (optional).
* @return {void}
*/
export function defineByNames<T, K>(
	target: T, 
	obj: K,
	prefix?: string
): void {
	const _reduce = (acc: GenericObject, curr: string) => {
		const key = prefix ? prefix + curr : curr;
		acc[key] = getPropertyDescriptor<K>(obj, curr) ?? {};
		return acc; 	
	};

	const names = getPropertyNames<K>(obj);
	const properties: PropertyDescriptorMap = names.reduce(_reduce, {});

	defines<T>(target, properties);
};

/**
* isAsync, check is param fn is AsyncFunction
*
* @param {Function} fn.
* @return {Boolean}
*/
export function isAsync<T extends Function>(fn: T): boolean {
	return fn.constructor.name === 'AsyncFunction';
};

/**
* isPromise, check is param fn is Promise
*
* @param {Function} fn.
* @return {Boolean}
*/
export function isPromise<T extends Function>(fn : T): boolean {
	return fn.constructor.name === 'Promise';
};


