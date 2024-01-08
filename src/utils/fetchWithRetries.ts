const DELAY = 300;

const fetchWithRetries = async (rpcURLs: string[], options: any, index: number, prevTime: Date) => {
	// resets index to 0 if all urls in array have been tried
	if (index >= rpcURLs.length) index = 0;

	// kills retry after 7 second timeout
	const curTime = new Date().getTime();
	const elapse = (curTime - prevTime.getTime()) / 1000;
	if (elapse >= 7) {
		return new Response('GFX Proxy Service Timed Out', { status: 500 });
	}

	const request = new Request(rpcURLs[index], options);

	try {
		const response = await fetch(request);
		if (response.ok) {
			return response;
		} else {
			await new Promise(resolve => setTimeout(resolve, DELAY));
			return fetchWithRetries(rpcURLs, options, index + 1, prevTime);
		}
	} catch (error) {
		await new Promise(resolve => setTimeout(resolve, DELAY));
		return fetchWithRetries(rpcURLs, options, index + 1, prevTime);
	}
};

module.exports = fetchWithRetries;
