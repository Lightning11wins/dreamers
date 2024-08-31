
const axios = require('axios');
const { exec } = require('child_process');
const { wait } = require("./utils");
// Start AI: wsl ollama run llama3

const url = 'http://localhost:11434/api/generate';

async function start() {
	const promise = cmd('wsl ollama run llama3');
	await wait(5000);
	return promise;
}
async function stop() {
	return cmd('wsl --shutdown');
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

async function querySafe() {
	await start();
	const response = await query('Good morning');
	await stop();
	return response;
}

async function query(prompt) {
	try {
		const response = await axios.post(url, { model: 'llama3', prompt });
		const lines = response.data.trim().split('\n');
		return lines.map((line) => JSON.parse(line).response).join('');
	} catch (error) {
		console.error('Error:', error);
	}
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
	AI: { start, stop, query, querySafe, url }
}
