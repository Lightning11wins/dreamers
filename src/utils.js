
const fs = require('fs');
const path = require('path');
const { logDir } = require('./config');

const date = 2, time = 1;

function now(format) {
	const showDate = format & date, showTime = format & time;
	const now = new Date();
	let str = '';

	if (showDate) {
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const day = String(now.getDate()).padStart(2, '0');
		str += `${year}-${month}-${day}`;
	}
	if (showTime) {
		const hours = String(now.getHours()).padStart(2, '0');
		const minutes = String(now.getMinutes()).padStart(2, '0');
		const seconds = String(now.getSeconds()).padStart(2, '0');
		str += `${showDate ? '_' : ''}${hours}-${minutes}-${seconds}`;
	}
	return str;
}

class Logger {
	constructor() {
		this.filename = `log-${now(date | time)}.txt`;
		this.filepath = path.join(logDir, this.filename);

		fs.writeFileSync(this.filepath, `Start of ${this.filename}:\n\n`);
	}

	log(msg) {
		const data = `[${now(time)}]: ${msg}\n`;
		fs.appendFile(this.filepath, data, (err) => {
			if (err) {
				console.error(`Failed to write to log file at ${this.filepath}:`, err);
				console.log('Data:', data);
			}
		});
	}
}

module.exports = {
	now,
	format: { date, time },
	logDir,
	Logger,
}
