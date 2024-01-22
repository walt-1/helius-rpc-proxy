// GFX Logger
class Logger {
	public url: string;

	constructor(url: string) {
		this.url = url;
	}

	public async log(data: string): Promise<void> {
		const options = {
			method: 'POST',
			body: JSON.stringify({
				data: data,
				time: new Date().getTime(),
			}),
			headers: {
				'Content-Type': 'application/json',
			},
		};

		const request = new Request(this.url, options);
		try {
			const response = await fetch(request);
			return response;
		} catch (error) {
			console.error(error);
			return error;
		}
	}
}

module.exports = Logger;
