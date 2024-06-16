
const { prompt } = require('./config')
const { Logger } = require('./utils');
const { Discord, channel } = require('./discord');
const fs = require("fs");
const { ollama } = require('./ai');

const logger = new Logger();
logger.log('Program started');

const discord = new Discord();
// discord.system = 'Program started';

async function scan() {
	logger.log('Scanning #general chat...');
	const history = (await discord.get(channel.general)).map(m => m.text);
	logger.log('Recent messages in #general:\n' + history.join('\n'));

	logger.log('Querying AI...');
	const response = await ollama.query(prompt(history));

	logger.log('Sending response: ' + response);
	discord.general = response;

	logger.log('Scan completed.\n');
}

scan();
setInterval(scan, 100_000);
