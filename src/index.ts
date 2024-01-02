const fetchWithRetries = require('./utils/fetchWithRetries');
const segment = require('./utils/segment');

interface Env {
	CORS_ALLOW_ORIGIN: string;
	RPC_URL: string;
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

		// calculates if origin is prod - splites all other traffic to dev rpc
		const RPC_POOL = env.RPC_URL.split(',');
		console.log(RPC_POOL);

		const curSegment = segment(RPC_POOL.length);
		console.log(`The current time falls into ${curSegment} of ${RPC_POOL.length} of the today.`);

		const upgradeHeader = request.headers.get('Upgrade');
		if (upgradeHeader || upgradeHeader === 'websocket') {
			return await fetch(RPC_POOL[curSegment], request);
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

		// curSegment targets given rpc url index
		return await fetchWithRetries(RPC_POOL, options, curSegment - 1, new Date()).then(res => {
			return new Response(res.body, {
				status: res.status,
				headers: corsHeaders,
			});
		});
	},
};
