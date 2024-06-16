
const fs = require('fs');
const path = require('path');
const { logDir } = require('./config');

class Logger {
	constructor() {
		const now = Date.now().toString();
		this.filename = `log-${now}.txt`;
		this.filepath = path.join(logDir, this.filename);

		fs.writeFileSync(this.filepath, `Start of ${this.filename}:\n\n`);
	}

	log(msg) {
		const now = Date.now().toString();
		const data = `[${now}]: ${msg}\n`;
		fs.appendFile(this.filepath, data, (err) => {
			if (err) {
				console.error(`Failed to write to log file at ${this.filepath}:`, err);
				console.log('Data:', data);
			}
		});
	}
}

module.exports = {
	logDir,
	Logger,
}
