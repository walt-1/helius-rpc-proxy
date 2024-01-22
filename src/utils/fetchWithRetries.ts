const Logger = require('../logger');

const DELAY = 100;

const fetchWithRetries = async (
	rpcURLs: string[],
	options: any,
	index: number,
	prevTime: Date,
	logClient: Logger
) => {
	// resets index to 0 if all urls in array have been tried
	if (index >= rpcURLs.length) index = 0;

	// kills retry after 7 second timeout
	const curTime = new Date().getTime();
	const elapse = (curTime - prevTime.getTime()) / 1000;
	if (elapse >= 7) {
		logClient.log('Timeout');
		return new Response('GFX Proxy Service Timed Out', { status: 500 });
	}

	const request = new Request(rpcURLs[index], options);

	try {
		const response = await fetch(request);
		if (response.ok) {
			return response;
		} else {
			await new Promise(resolve => setTimeout(resolve, DELAY));
			logClient.log(`Retry: status ${response.status} on ${rpcURLs[index]}`);
			return fetchWithRetries(rpcURLs, options, index + 1, prevTime, logClient);
		}
	} catch (error) {
		await new Promise(resolve => setTimeout(resolve, DELAY));
		logClient.log(`Error: ${rpcURLs[index]}`);
		return fetchWithRetries(rpcURLs, options, index + 1, prevTime, logClient);
	}
};

module.exports = fetchWithRetries;
