
const fs = require('fs');
const { Logger } = require('./utils');
const { Discord, participants } = require('./discord');
const { AI } = require("./ai");

const logger = new Logger();
logger.log('Program started');
logger.log('Program name: Unlimited Story Project');

const discord = new Discord();

const storyFile = 'story/story.txt';
const persistFile = 'story/persist.json';
const storyPollingInterval = 30_000;
const maxResponseLength = 250;
const initialPity = 2;
const storyData = {};
let dirty = false;

const pollingMessage = () => `## Unlimited Story Project\nHello ${storyData.currentAuthor}. ` +
	'You have been selected to continue the Unlimited Story story! Previously...\n' +
	'### 2nd to last response\n> ' + formatResponse(storyData.secondToLastMessage) +
	'\n### Last response\n> ' + formatResponse(storyData.lastMessage) +
	`\n\nNow, it's your turn! Send up to a paragraph (aka. a few sentences, no longer than ${maxResponseLength} characters, ` +
	'new lines will be replaced with spaces) or less in a *single DM* to continue the story. ' +
	'(To put that into perspective, this paragraph is 249 characters.)'
function confirmationMessage() {
	const author = storyData.currentAuthor;
	if (author === 'HenIsHuman') {
		return 'Shut up, that\'s such a lame response. Come back when you\'ve learned to write better than a kindergartener.';
	}
	return `Thank you, ${storyData.currentAuthor}. Your contribution has been recorded.`;
}
function formatResponse(response) {
	const msg = response.content;
	return `${msg} (${msg.length} characters)`;
}

function selectNewName() {
	const names = Object.keys(participants);

	// Ensure that everyone has pity.
	let pity = storyData.pity;
	if (pity === undefined) pity = {};
	for (const name of names) {
		if (!Object.hasOwn(pity, name)) {
			pity[name] = initialPity;
		}
		pity[name]++;
	}
	storyData.pity = Object.assign({}, storyData.pity);
	dirty = true;

	// Never pick an author if their last response is still in circulation.
	pity[storyData.secondToLastMessage.author] = 0;
	pity[storyData.lastMessage.author] = 0;

	// Select a random winner.
	const totalPity = Object.values(pity).reduce((acc, cur) => cur + acc, 0);
	const randomTicket = Math.floor(Math.random() * totalPity) + 1;
	let cumulativeSum = 0;
	for (let name in pity) {
		cumulativeSum += pity[name];
		if (randomTicket <= cumulativeSum) {
			storyData.pity[name] = initialPity;
			dirty = true;
			return name;
		}
	}

	// Uh oh
	throw new Error(`Pity selection failed: totalPity=${totalPity},
	  randomTicket=${randomTicket}, cumulativeSum=${cumulativeSum},
	  pity=${pity}, storyData.pity=${storyData.pity}`);
}

function selectNewAuthor() {
	logger.log('Selecting new author.');
	const currentAuthor = selectNewName();
	const currentChannel = participants[currentAuthor];
	storyData.currentAuthor = currentAuthor;
	storyData.currentChannel = currentChannel;
	dirty = true;

	logger.log(`Selected ${currentAuthor} (${currentChannel})`);

	discord.send({
		channel: currentChannel,
		message: pollingMessage(),
	});
}

function saveData() {
	if (dirty) {
		logger.log('Writing persist file.');
		fs.writeFileSync(persistFile, JSON.stringify(storyData, null, 2), { flush: true });
		dirty = false;
	}
}

function saveResponse(messageContent) {
	const currentAuthor = storyData.currentAuthor;
	const response = messageContent.replaceAll('\n', ' ');
	logger.log(`${currentAuthor} said "${response}"`);

	const data = `${currentAuthor}: ${response}\n`;
	fs.appendFile(storyFile, data, (err) => {
		if (err) {
			console.error(`Failed to write to story to file at ${storyFile}:`, err);
			console.log('Data:', data);
			logger.log('Write error: ' + err.toString());
			logger.log('Data: ' + data);
		}
	});
	storyData.secondToLastMessage = storyData.lastMessage;
	storyData.lastMessage = { author: currentAuthor, content: response };
	dirty = true;
}

// Cycle function
async function DMScan() {
	if (!Object.hasOwn(storyData, 'currentAuthor')) {
		logger.log('Reading persist file.');
		Object.assign(storyData, JSON.parse(fs.readFileSync(persistFile, 'utf8')));
		dirty = false;
	}
	if (storyData.currentChannel === '') {
		selectNewAuthor();
		
		saveData();
		return; // End of cycle.
	}

	if (storyData.currentChannel === 'AI') {
		const currentAuthor = storyData.currentAuthor;
		logger.log('Querying AI: ' + currentAuthor);
		const prompt = `${pollingMessage()} Respond with ONLY the text you would like to append to the story and NOTHING ELSE.`;
		const response = await AI.query(prompt);
		saveResponse(response);
		selectNewAuthor();

		saveData();
		return; // End of cycle.
	}

	const message = (await discord.get(storyData.currentChannel, 1))[0];
	if (message.author.username === 'evs17.') {
		saveData();
		return; // End of cycle.
	}

	logger.log('Response found!');
	const messageContent = message.content;
	const messageLength = messageContent.length;
	if (messageLength > maxResponseLength) {
		logger.log(`Response is too long! Size ${messageLength} characters (max ${maxResponseLength}).`);
		const message = `Wow, chill! Your response is ${messageLength} characters long, ` +
			`which is longer than the maximum response length of ${maxResponseLength} characters.`;
		discord.send({ channel: storyData.currentChannel, message });
		return;
	}

	saveResponse(messageContent);
	discord.send({
		channel: storyData.currentChannel,
		message: confirmationMessage(),
	});
	selectNewAuthor();
	saveData();

	// End of cycle.
}

// Start the program.
DMScan();
setInterval(DMScan, storyPollingInterval);
