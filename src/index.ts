const Logger = require('./logger');

interface Env {
	CORS_ALLOW_ORIGIN: string;
	RPC_URL: string;
	LOGGING_URL: string
}

export default {
	async fetch(request: Request, env: Env) {
		// If the request is an OPTIONS request, return a 200 response with permissive CORS headers
		// This is required for the GFX RPC Proxy to work from the browser and arbitrary origins
		// If you wish to restrict the origins that can access your GFX RPC Proxy, you can do so by
		// changing the `*` in the `Access-Control-Allow-Origin` header to a specific origin.
		// For example, if you wanted to allow requests from `https://example.com`, you would change the
		// header to `https://example.com`. Multiple domains are supported by verifying that the request
		// originated from one of the domains in the `CORS_ALLOW_ORIGIN` environment variable.
		
		// CREATES LOGGER
		const logClient = new Logger(env.LOGGING_URL);

		const url: URL = new URL(request.url);
		if (url.pathname !== '/' || url.search !== '' || url.hash !== '') {
			logClient.log(`JSON RPC URL: ${request.url}`);
			return new Response('Bad Request: Invalid or malicious URL', {
				status: 400,
			});
		}

		const supportedDomains = env.CORS_ALLOW_ORIGIN ? env.CORS_ALLOW_ORIGIN.split(',') : undefined;
		const respHeaders: Record<string, string> = {
			'Access-Control-Allow-Methods': 'GET, HEAD, POST, PUT, OPTIONS',
			'Access-Control-Allow-Headers': '*',
		};
		const origin = request.headers.get('Origin');

		if (supportedDomains) {
			if (
				origin &&
				(supportedDomains.includes(origin) || origin.includes('doi1f799swne9.amplifyapp.com'))
			) {
				respHeaders['Access-Control-Allow-Origin'] = origin;
			}
		} else {
			respHeaders['Access-Control-Allow-Origin'] = '*';
		}

		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 200,
				headers: respHeaders,
			});
		}

		const timestamp = new Date();
		// calculates if origin is prod - splites all other traffic to dev rpc
		const RPC_POOL = env.RPC_URL.split(',');
		const H_INDEX = RPC_POOL.findIndex(i => i.includes('helius'))
		const Q_INDEX = RPC_POOL.findIndex(i => i.includes('quiknode'));

		const upgradeHeader = request.headers.get('Upgrade');
		if (upgradeHeader || upgradeHeader === 'websocket') {
			if (H_INDEX !== -1) {
				return await fetch(RPC_POOL[H_INDEX], request);
			} else {
				return new Response('RPC URL is not set in pool for websocket', {
					status: 500,
					headers: respHeaders,
				});
			}
		}

		const payload = await request.text();
		const options = {
			method: request.method,
			body: payload || null,
			headers: {
				'Content-Type': 'application/json'
			},
		};

		const proxyRequest = new Request(RPC_POOL[Q_INDEX], options);

		// const reqContentType = request.headers.get('content-type');
		// if (reqContentType !== 'application/json') {
		// 	return new Response(
		// 		'Invalid content-type, this application only supports application/json',
		// 		{
		// 			status: 415,
		// 		}
		// 	);
		// }

		return await fetch(proxyRequest).then(res => {
			return new Response(res.body, {
				status: res.status,
				headers: respHeaders,
			});
		});
	},
};
