
const { spawn } = require('child_process');
const fs = require('fs');
const { promptEnd, filePollingInterval } = require('./config');

let id = 0;

function checkFile(file, interval) {
	return new Promise((resolve) => {
		const findFileInterval = setInterval(() => {
			fs.stat(file, (err, stats) => {
				if (!err && stats.size > 0) {
					console.log('Output detected.');
					clearInterval(findFileInterval);
					resolve();
				} else console.log(`Waiting for AI...`);
			});
		}, interval);
	});
}

function watchFile(file, interval) {
	return new Promise((resolve) => {
		const watchInterval = setInterval(() => {
			fs.readFile(file, 'utf8', (readErr, data) => {
				if (readErr) {
					console.error(`Error reading file ${file}: ${readErr}`);
					return;
				}

				const index = data.indexOf(promptEnd);
				if (index === -1) {
					console.log('AI is typing...');
					return;
				}

				clearInterval(watchInterval);
				resolve(data.substring(0, index).trim());
			});
		}, interval);
	});
}

async function query(prompt) {
	prompt += ` To indicate the end of your response, include EXACTLY "${promptEnd}". Do NOT include this text anywhere else in your response.`;

	const tmpFile = `tmp/${id++}-output.txt`;
	fs.unlink(tmpFile, () => undefined);

	const child = spawn('wsl', ['ollama', 'run', 'llama3', `"${prompt}"`, '>', tmpFile], {
		detached: true,
		stdio: 'ignore'
	});
	child.unref();

	await checkFile(tmpFile, filePollingInterval);
	const data = await watchFile(tmpFile, filePollingInterval);

	fs.unlink(tmpFile, (error) => {
		if (error) console.error('Failed to delete temp file:', error)
	});

	return data;
}

module.exports = {
	ollama: { query },
}
