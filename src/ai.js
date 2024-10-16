
const axios = require('axios');
const { exec } = require('child_process');
const { wait } = require("./utils");
// Start AI: wsl ollama run llama3

const commands = {
	start: 'wsl ollama run llama3',
	stop: 'wsl --shutdown',
};

const url = 'http://localhost:11434/api/generate';

async function start() {
	const promise = cmd(commands.start);
	await wait(5000);
	return promise;
}
async function stop() {
	return cmd(commands.stop);
}
async function cmd(command) {
	exec(command, (error, stdout, stderr) => {
		if (error) {
			console.error(`Exec Error: ${error.message.trim()}`);
			return;
		}
		if (stderr) {
			console.error(`Stderr: ${stderr.trim()}`);
			return;
		}
		console.log(`Stdout: ${stdout.trim()}`);
	});
}

async function query(prompt, autoWSL = true) {
	if (autoWSL) await start();
	let result = 'AI ERROR';
	try {
		const response = await axios.post(url, { model: 'llama3', prompt });
		const lines = response.data.trim().split('\n');
		result = lines.map((line) => JSON.parse(line).response).join('');
	} catch (error) {
		console.error('Error:', error);
	}
	if (autoWSL) await stop();
	return result;
}

// async function test() {
// 	await start();
// 	console.log('Response: ' + await query('Good morning'));
// 	console.log('Response: ' + await query('Good afternoon'));
// 	console.log('Response: ' + await query('Good evening'));
// 	console.log('Response: ' + await query('Good good night'));
// 	await stop();
// }
// test().then();

module.exports = {
	AI: { url, commands, cmd, start, stop, query }
};
