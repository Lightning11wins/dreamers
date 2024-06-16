
const { spawn } = require('child_process');
const fs = require('fs');
const { tmpFile, promptEnd, pollingInterval } = require('./config');

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
			fs.readFile(tmpFile, 'utf8', (readErr, data) => {
				if (readErr) {
					console.error(`Error reading file ${tmpFile}: ${readErr}`);
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

	fs.unlink(tmpFile, (err) => {
		if (err) console.error('Error deleting file:', err);
	});

	const child = spawn('wsl', ['ollama', 'run', 'llama3', `"${prompt}"`, '>', tmpFile], {
		detached: true,
		stdio: 'ignore'
	});
	child.unref();

	await checkFile(tmpFile, pollingInterval);
	return await watchFile(tmpFile, pollingInterval);
}

module.exports = {
	ollama: { query },
}
