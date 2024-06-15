const { spawn } = require('child_process');
const fs = require('fs');

const outputFile = 'output.txt', interval = 5000;
const prompt_end = '-END OF OUTPUT-';

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
			fs.readFile(outputFile, 'utf8', (readErr, data) => {
				if (readErr) {
					console.error(`Error reading file ${outputFile}: ${readErr}`);
					return;
				}

				const index = data.indexOf(prompt_end);
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

async function ollama(prompt) {
	prompt += ` To indicate the end of your response, include EXACTLY "${prompt_end}". Do NOT include this text anywhere else in your response.`;

	fs.unlink(outputFile, (err) => {
		if (err) console.error('Error deleting file:', err);
	});

	const child = spawn('wsl', ['ollama', 'run', 'llama3', `"${prompt}"`, '>', outputFile], {
		detached: true,
		stdio: 'ignore'
	});
	child.unref();

	await checkFile(outputFile, interval);
	return await watchFile(outputFile, interval);
}

ollama('What pet should I get?').then(((answer) => console.log('program:', answer)));