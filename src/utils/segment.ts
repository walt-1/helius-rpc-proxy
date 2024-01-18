// dynamically generates a number mapping to the current segment of the day
const segment = (num: number, timestamp: Date) => {
	// Get the current millisecond within the second
	const currentMillisecond = timestamp.getMilliseconds();

	// Calculate which 10th the current millisecond falls into
	const curSegment = Math.floor((currentMillisecond / 1000) * num) + 1;

	return curSegment;
};

module.exports = segment;
