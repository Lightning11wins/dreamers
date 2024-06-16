
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

let mostRecentMessageID = 1252014462190489692;
async function pingScan() {
	logger.log('Scanning #general chat for pings...');
	let done = false;
	const messages = await discord.get(channel.general, 25);
	const pings = messages.filter((message) => {
		// Skip all messages that have already been seen.
		if (done || message.id === mostRecentMessageID) {
			done = true;
			return false;
		}
		if (message.mention_everyone) return true;
		return message.mentions.filter((user) => {
			logger.log('Found mention of ' + user.username);
			return user.username === me.username;
		}).length > 0;
	});
	mostRecentMessageID = messages[0].id;
	if (pings.length === 0) {
		logger.log('No recent pings in #general');
		return;
	}

	logger.log('Pings (jobs) in #general:\n' + pings.map(m => m.text).join('\n'));
	const answers = pings.map(async (message) => {
		logger.log('Querying AI...');
		return {
			username: message.author.username,
			text: ollama.query(promptRespond(message.author.username, message.content)),
		};
	});

	while (answers.length > 0) {
		const answer = await answers.shift(), response = await answer.text;
		discord.general = `To ${answer.username}: ${response}`;
	}
}

async function test() {
	await discord.get(channel.general, 5);
}

// Run the bot
pingScan();
setInterval(pingScan, discordPollingInterval);
