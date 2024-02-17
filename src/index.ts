const fetchWithRetries = require('./utils/fetchWithRetries');
const segment = require('./utils/segment');
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

		const url: URL = new URL(request.url)
		if (url.pathname !== '/' || url.search !== '' || url.hash !== '') {
			return new Response('Bad Request: Invalid or malicious URL', {
				status: 400
			});
		}

		const headers = request.headers.get('content-type');
		if (headers !== 'application/json') {
			return new Response('Invalid content-type, this application only supports application/json', {
				status: 415,
			});
		}

		const supportedDomains = env.CORS_ALLOW_ORIGIN ? env.CORS_ALLOW_ORIGIN.split(',') : undefined;
		const corsHeaders: Record<string, string> = {
			'Access-Control-Allow-Methods': 'GET, HEAD, POST, PUT, OPTIONS',
			'Access-Control-Allow-Headers': '*',
		};
		const origin = request.headers.get('Origin');

		if (supportedDomains) {
			if (
				origin &&
				(supportedDomains.includes(origin) || origin.includes('doi1f799swne9.amplifyapp.com'))
			) {
				corsHeaders['Access-Control-Allow-Origin'] = origin;
			}
		} else {
			corsHeaders['Access-Control-Allow-Origin'] = '*';
		}

		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 200,
				headers: corsHeaders,
			});
		}

		const timestamp = new Date()
		// calculates if origin is prod - splites all other traffic to dev rpc
		const RPC_POOL = env.RPC_URL.split(',');

		const curSegment = segment(RPC_POOL.length, timestamp);
		
		const upgradeHeader = request.headers.get('Upgrade');
		if (upgradeHeader || upgradeHeader === 'websocket') {
			return await fetch(RPC_POOL[curSegment - 1], request);
		}

		const payload = await request.text();
		const options = {
			method: request.method,
			body: payload || null,
			headers: {
				'Content-Type': 'application/json',
				'X-Helius-Cloudflare-Proxy': 'true',
			},
		};

		// CREATES LOGGER
		const logClient = new Logger(env.LOGGING_URL);
		// curSegment targets given rpc url index
		return await fetchWithRetries(RPC_POOL, options, curSegment - 1, timestamp, logClient).then(
			res => {
				return new Response(res.body, {
					status: res.status,
					headers: corsHeaders,
				});
			}
		);
	},
};
