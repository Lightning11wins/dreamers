
const { spawn } = require('child_process');
const EventEmitter = require('events');

const events = new EventEmitter();
let wsl = undefined, ready = false;

function write(data) {
	console.log('< '+data);
	wsl.stdin.write(data+'\n');
}

async function start() {
	// Set up WSL
	wsl = spawn('wsl', { shell: false });
	wsl.stdout.on('data', (data) => {
		console.log(`> ${data}`);
		if (!ready && data.includes('online')) {
			ready = true;
			events.emit('ready');
		}
	});
	wsl.stderr.on('data', (data) => console.error(`> Error: ${data}`));
	wsl.on('close', (code) => {
		console.log(`> wsl process exited with code ${code}`);
	});

	write('echo online');
}

async function prompt(query) {
	if (wsl === undefined) {
		console.warn('Prompt Failed: no wsl');
		return;
	}

	if (!ready) await new Promise(done => events.once('ready', done));

	write(`ollama run llama3 "${query}" > output.txt`);
	write('echo -end of transmission-');

	// return new Promise((resolve, reject) => {
	// 	let data = '';
	// 	wsl.stdout.on('data', chunk => {
	// 		data += chunk.toString();
	// 		console.log(`>> ${data}`);
	// 		if (chunk.endsWith('-end of transmission-')) resolve(data);
	// 	});
	// 	wsl.stdout.on('close', (code) => {
	// 		console.warn(`> wsl process exited with code ${code}`);
	// 		resolve(data);
	// 	});
	// 	wsl.stdout.on('error', err => reject(err));
	// });
	return 'done';
}

async function run() {
	console.log('got answer:', await prompt('Hello'));
}

start().catch((err) => console.error(err));

run().catch((err) => console.error(err));

// setTimeout(() => { wsl.kill('SIGINT'); }, 5000);
