
const fs = require('fs');
const path = require('path');
const { logDir } = require('./config');

const date = 2, time = 1;

// noinspection FunctionNamingConventionJS
const now = (format) => {
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
};

const shuffleArray = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]]; // Swap elements
    }
    return arr;
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class Logger {
	constructor(filename) {
		this.filename = filename ?? `log-${now(date | time).replaceAll(':', '-')}.txt`;
		this.filepath = path.join(logDir, this.filename);

		fs.writeFileSync(this.filepath, `Start of ${this.filename}:\n\n`);
	}

    // noinspection FunctionNamingConventionJS
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
    shuffleArray,
	wait,
	format: { date, time },
	logDir,
	Logger,
};
