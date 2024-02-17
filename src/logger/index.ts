// GFX Logger
class Logger {
	public url: string | null;

	constructor(url: string) {
		this.url = this.isValidUrl(url) ? url : null;
	}

	public async log(data: string): Promise<any> {
		if (this.url === null) return
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
	};

	private isValidUrl(url: string) {
		const urlPattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
			'((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
			'((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
			'(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
			'(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
			'(\\#[-a-z\\d_]*)?$','i'); // fragment locator

		return urlPattern.test(url);
	}

}

module.exports = Logger;
