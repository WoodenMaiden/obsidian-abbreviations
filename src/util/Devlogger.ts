/* eslint-disable  @typescript-eslint/no-explicit-any */
/* eslint-disable  no-console*/

import "reflect-metadata";


const dummyConsole: Partial<Console> = {
	log: (..._: any) => {},
	warn: (..._: any) => {},
	info: (..._: any) => {},
	trace: (..._: any) => {},
	error: console.error,
};


// sets the logger to console in development mode and to a mock console in production mode
export default function Devlogger(): PropertyDecorator {
	return (target: any, key: string) => {
		const logger = process.env.NODE_ENV === "development" ? console : dummyConsole

		Reflect.deleteProperty(target, key);
		Reflect.defineProperty(target, key, {
			value: logger,
			writable: false,
			configurable: false,
			enumerable: false
		});
	};
}
