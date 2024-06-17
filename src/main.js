
const { me, promptNice, promptRespond, discordPollingInterval} = require('./config')
const { Logger } = require('./utils');
const { Discord, channel } = require('./discord');
const { ollama } = require('./ai');

const logger = new Logger();
logger.log('Program started');

const discord = new Discord();
// discord.system = 'Execution Initiated';

async function totalScan() {
	logger.log('Scanning #general chat...');
	const history = (await discord.get(channel.general)).map(m => m.text);
	logger.log('Recent messages in #general:\n' + history.join('\n'));

	logger.log('Querying AI...');
	const response = await ollama.query(promptNice(history));

	logger.log('Sending response: ' + response);
	discord.general = response;

	logger.log('Scan completed.\n');
}

let mostRecentMessageID = '0', cycle = 1;
async function setup() {
	mostRecentMessageID = (await discord.get(channel.general, 1))[0].id;
	// ollama.setup(); // Set up the AI (clears tmp directory).
}

async function pingScan() {
	logger.log('Scanning #general chat for pings...');
	let done = false;
	const messages = await discord.get(channel.general, 25);
	const newMessages = messages.filter((message) => {
		// Skip old messages.
		if (done || message.id === mostRecentMessageID) {
			done = true;
			return false;
		}
		return message.author.username !== me.username;
	}), pings = newMessages.filter((message) => {
		if (message.mention_everyone) return true;
		return message.mentions.filter((user) => {
			logger.log('Found mention of ' + user.username);
			return user.username === me.username;
		}).length > 0
	});
	mostRecentMessageID = messages[0].id;

	logger.log(`Found ${newMessages.length} new messages from other members.`);
	if (pings.length === 0) logger.log('No recent pings in #general');
	else {
		logger.log('Pings in #general:\n' + pings.map(m => m.text).join('\n'));

		const responses = pings.map(async (message) => {
			const { author: { username }, id, content } = message;
			logger.log(`Querying AI for ${username} (message: ${id})...`);
			const text = ollama.query(promptRespond(username, content));
			return { id, username, text };
		});

		while (responses.length > 0) {
			const response = await responses.shift(), message = await response.text;

			logger.log(`Sending response for ${response.username} (message: ${response.id}): ${message}`);
			discord.general = { message, reply: response.id };
		}
	}

	logger.log(`Scan cycle ${cycle++} completed`);
}

async function test() {
	await discord.get(channel.general, 5);
}

// Run the bot
setup();
setInterval(pingScan, discordPollingInterval);
