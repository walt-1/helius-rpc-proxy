// dynamically generates a number mapping to the current segment of the day
const segment = (num: number) => {
	// Get the current date and time
	const currentDate = new Date();

	// Get the current millisecond within the second
	const currentMillisecond = currentDate.getMilliseconds();
	
	// Calculate which 10th the current millisecond falls into
	const curSegment = Math.floor((currentMillisecond / 1000) * num) + 1;

	return curSegment;
}

module.exports = segment;
