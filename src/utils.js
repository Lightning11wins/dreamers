
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
		str += `${showDate ? '_' : ''}${hours}:${minutes}:${seconds}`;
	}
	return str;
}

function wait(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

class Logger {
	constructor() {
		this.filename = `log-${now(date | time).replaceAll(':', '-')}.txt`;
		this.filepath = path.join(logDir, this.filename);

		fs.writeFileSync(this.filepath, `Start of ${this.filename}:\n\n`);
	}

	log(msg) {
		msg = msg.replaceAll('\n', '\n ⤷ ');
		const message = `[${now(time)}]: ${msg}`;
		console.log(message);
		fs.appendFile(this.filepath, `${message}\n`, (err) => {
			if (err) {
				console.error(`Failed to write to log file at ${this.filepath}:`, err);
				console.log('Data:', message);
			}
		});
	}
}

module.exports = {
	now,
	wait,
	format: { date, time },
	logDir,
	Logger,
}
