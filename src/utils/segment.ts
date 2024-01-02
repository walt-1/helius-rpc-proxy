// dynamically generates a number mapping to the current segment of the day
const segment = (num: number) => {
	// Get the current time
	const currentTime = new Date();

	// Get the current second
	const currentSecond = currentTime.getSeconds();

	// Calculate the total seconds in a minute
	const totalSecondsInMinute = 60;

	// Calculate the duration of each fifth of the minute in seconds
	const fifthDurationInSeconds = totalSecondsInMinute / num;

	// Determine which fifth the current time falls into
	const timeFifthInMinute = Math.floor(currentSecond / fifthDurationInSeconds) + 1;

	return timeFifthInMinute;
}

module.exports = segment;
