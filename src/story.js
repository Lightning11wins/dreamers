
const fs = require('fs');
const { AI } = require("./ai");
const { Discord, me, channels } = require('./discord');
const { Logger } = require('./utils');

const logger = new Logger();
logger.log('Program started!');
logger.log('Program name: Unlimited Story 2');
logger.log('Program phase: Deployed');

const discord = new Discord();
const participants = {
	// 'Dreamers':   'AI',
	'Alice':      '1261727174591905876',
	'Demi':       '1262865165259509922',
	'DonDon':     '1261728075326951474',
	'EVs17':      '1262864622277492889',
	'HenIsHuman': '1212226335909351435',
	'IcedCoffee': '1262864511334088886',
	'Katy':       '1262865085789896775',
	'Lightning':  '1196575384804802661',
	'Mikasa':     '1279562387896406130',
	'Timmsy':     '1261727825673851043',
	'Tomio':      '1262865264597532764',
	'Victoria':   '1279563746511032368',
	'Yapper':     '1264443743881265162',
};

const storyFiles = [
	'story/story_a.txt',
	'story/story_b.txt',
	'story/story_c.txt',
];
const persistFile = 'story/persist.json';
const storyPollingInterval = 20_000;
const maxResponseLength = 250;
const fastResponseThreshold = 1_800_000;
const initialWeight = 2;
let storyData = {}, dirty = false;

const aiPrompt = (story) => 'Continue the following story in up to 250 characters. Respond with ONLY the text you would like to append ' +
	'to the story and NOTHING ELSE:\n' + formatResponse(story.secondToLastMessage) + '\n' + formatResponse(story.lastMessage);
const pollingMessage = (story) => `## Unlimited Story 2\nHello ${story.currentAuthor}. ` + 'Your turn to continue the Unlimited Story! Previously...\n' +
	'### 2nd to last response\n> ' + formatResponse(story.secondToLastMessage) + '\n### Last response\n> ' + formatResponse(story.lastMessage) +
	`\n\nSend up to a paragraph (aka. a few sentences, up to ${maxResponseLength} characters) or less in a *single DM* to continue the story. ` +
	'Then, I\'ll tell you the length of your submission, and you can react to my message with a :white_check_mark: to confirm your response.';
const responseMessage = (length) => `\n\nYour last response is ${length}/${maxResponseLength} characters long. ` +
	((length > maxResponseLength) ? 'Your response is too long!' : 'React to this message with a :white_check_mark: to submit your response.');
const submitBotMessage = (story) => `While I'm flattered that you'd try to submit my own message as your response, ${story.currentAuthor}, ` +
	'I\'m not allowed to accept it. Please write your own *original* response to continue the story. Thanks!';
const responseTooLongMessage = (length) => `Wow, chill! Your response is ${length} characters long, ` +
	`which is longer than the maximum response length of ${maxResponseLength} characters.`;
const confirmationMessage = (durationMillis, story) => {
	const author = story.currentAuthor;
	return ((author === 'HenIsHuman' && Math.random() < 0.5) ? 'Shut up, that\'s such a lame response. Come back when you\'ve learned to write better than a kindergartener.\n' :
			(author === 'Katy'       && Math.random() < 0.2) ? 'Thanks for the response! This writing is so nice I\'d touch you... *except that I\'m NOT Icy!!*. XD\n' :
			(author === 'Alice'      && Math.random() < 0.3) ? 'Thanks! You\'re such a W, Alice. Love you! ^_^\n' :
			(author === 'EVs17'      && Math.random() < 0.3) ? `Thank you, ${story.currentAuthor}. Good luck on the captain's banner! ` :
			(author === 'Demi'       && Math.random() < 0.3) ? `Thank you, ${story.currentAuthor}. Also, I think Mauvika is hot.\n` :
			(author === 'Yapper'     && Math.random() < 0.6) ? `Thank you, ${story.currentAuthor}. Also, Mualani is a W.\n` :
			(author === 'Katy'       && Math.random() < 0.5) ? 'Thanks, Pookie! You\'re the best!\n' :
			(author === 'Tomio'      && Math.random() < 0.4) ? 'Thanks, Pookie! You\'re the best!\n' :
			(author === 'Victoria'   && Math.random() < 0.3) ? 'Thanks, Pookie! You\'re the best!\n' :
			(author === 'EVs17'      && Math.random() < 0.3) ? 'Thanks, Pookie! You\'re the best!\n' :
			(author === 'HenIsHuman' && Math.random() < 0.2) ? 'Thanks, Pookie! You\'re the best!\n' :
			(Math.random() < 0.1) ? 'Yeah, maybe I should have selected someone else to continue the story...\n' :
			(Math.random() < 0.1) ? 'Thanks! You\'re awesome!\n' :
			`Thank you, ${story.currentAuthor}. Your contribution has been recorded.\n`
		) + `You took ${formatDuration(durationMillis)} to respond.` +
			((durationMillis < fastResponseThreshold) ? ' Wow, thanks for being so fast! :D' : '')
};
function formatResponse(response) {
	const msg = response.content;
	return `${msg} (${msg.length} characters)`;
}
function formatDuration(millis, nerd = false) {
	const hours = Math.floor(millis / 3600000),
		minutes = Math.floor((millis % 3600000) / 60000),
		seconds = Math.floor((millis % 60000) / 1000),
		milliseconds = millis % 1000;
	return `${hours} hours, ${minutes} minutes, and ${seconds} seconds` + (nerd ? ` (& ${milliseconds} millis)` : '');
}

function selectNewName(story) {
	const names = Object.keys(participants);

	// Ensure that everyone has a weight.
	let weights = storyData.weights;
	if (weights === undefined) storyData.weights = weights = {};
	for (const name of names) {
		if (!Object.hasOwn(weights, name)) {
			weights[name] = initialWeight;
		}
		weights[name]++;
	}
	dirty = true;

	// Deep copy weights.
	weights = JSON.parse(JSON.stringify(weights));

	// Never pick an author who is already the author for another story.
	for (let { currentAuthor } of storyData.stories) {
		weights[currentAuthor] = 0;
	}

	// Never pick an author if their last response is still in circulation.
	weights[story.secondToLastMessage.author] = 0;
	weights[story.lastMessage.author] = 0;

	// Select a random winner.
	const totalWeight = Object.values(weights).reduce((acc, cur) => cur + acc, 0);
	const randomWeight = Math.floor(Math.random() * totalWeight) + 1;
	let cumulativeSum = 0;
	for (let name in weights) {
		cumulativeSum += weights[name];
		if (randomWeight <= cumulativeSum) {
			storyData.weights[name] = initialWeight;

			return name;
		}
	}

	throw new Error(`Pity selection failed: totalPity=${totalWeight},
	  randomWeight=${randomWeight}, cumulativeSum=${cumulativeSum},
	  weights=${weights}, storyData.weights=${storyData.weights}`);
}
function selectNewAuthor(story) {
	logger.log('Selecting new author.');
	const currentAuthor = selectNewName(story);
	const currentChannel = participants[currentAuthor];
	story.currentAuthor = currentAuthor;
	story.currentChannel = currentChannel;
	story.currentTime = new Date().getTime().toString();
	dirty = true;

	logger.log(`Selected ${currentAuthor} (${currentChannel}).`);
	discord.send({ channel: currentChannel, message: pollingMessage(story) });
}
function recordResponse(messageContent, story, storyFile) {
	const currentAuthor = story.currentAuthor;
	const durationMillis = new Date().getTime() - parseInt(story.currentTime);
	const response = messageContent.replaceAll('\n', ' ');
	logger.log(`${currentAuthor} took ${formatDuration(durationMillis, true)} to say "${response}".`);
	recordTime(currentAuthor, durationMillis);

	const data = `${currentAuthor}: ${response}\n`;
	fs.appendFile(storyFile, data, (err) => {
		if (err) {
			console.error(`Failed to write to story to file at ${storyFile}:`, err);
			console.log('Data:', data);
			logger.log('Write error: ' + err.toString());
			logger.log('Data: ' + data);
		}
	});

	story.secondToLastMessage = story.lastMessage;
	story.lastMessage = { author: currentAuthor, content: response };
	dirty = true;

	return durationMillis;
}
function recordTime(currentAuthor, durationMillis) {
	const { times } = storyData;
	if (Object.hasOwn(times, currentAuthor)) {
		times[currentAuthor].push(durationMillis.toString());
	} else times[currentAuthor] = [durationMillis.toString()];
	dirty = true;
}
function saveData() {
	if (dirty) {
		logger.log('Writing persist file.');
		storyData = Object.fromEntries(Object.entries(storyData).sort());
		storyData.weights = Object.fromEntries(Object.entries(storyData.weights).sort(([, v1], [, v2]) => v2 - v1));
		fs.writeFileSync(persistFile, JSON.stringify(storyData, null, 2), { flush: true });
	}
	dirty = false;
}
function invokeCommand(command, story) {
	const invoker = story.currentAuthor;
	logger.log(`Invoking command ${command} for ${invoker}.`);
	let message;
	switch (command) {
		case 'leaderboard':
			const { times } = storyData;
			message = '## Fastest Response Times\n```' + Object.entries(times)
				.map(([key, times]) => [key, times.reduce((acc, cur) => acc + parseInt(cur), 0) / times.length])
				.sort(([, t1], [, t2]) =>  t1 - t2)
				.reduce((acc, cur) => acc + `\n${cur[0]}: ${formatDuration(cur[1])}`, '') + '\n```';
			break;
		case 'shutdown':
			message = 'Shutting down...';
			setTimeout(process.exit, 2_000);
			break;
		case 'kill':
			process.exit();
			break;
		case 'storydata': case 'story-data':
			message = '## StoryData\n```json\n' + JSON.stringify(storyData, null, 2) + '\n```';
			break;
		case 'help':
			message = `
				## Commands
				- **leaderboard**: Average response time leaderboard.
				- **shutdown**: Turn off Dreamers.
				- **kill**: Shut down Dreamers with no confirmation.
				- **story-data**: Dump raw story data.
			`.split('\n').map(line => line.trim()).join('\n');
			break;
		default:
			message = 'Unknown command';
	}
	discord.send({ channel: story.currentChannel, message: message ?? '### Done' });
}

// Main loop.
async function DMScan(story, storyFile) {
	if (story.currentChannel === '') {
		selectNewAuthor(story);
	}

	if (story.currentAuthor === 'Dreamers') {
		logger.log(`Querying AI: ${story.currentAuthor}.`);
		const response = await AI.query(aiPrompt(story))
		recordResponse(response, story, storyFile);
		selectNewAuthor(story);
	}
	if (story.currentAuthor === 'Dreamers') {
		console.error('AI picked twice? How?');
		process.exit();
	}

	const messages = await discord.get(story.currentChannel, 2);
	const recentMessage = messages[0], author = story.currentAuthor;
	if (recentMessage.author.username !== me.username) {
		const content = recentMessage.content.trim().toLowerCase();
		if (content.startsWith('#invoke')) {
			invokeCommand(content.slice(7).trim(), story);
			return; // End of cycle.
		}

		const length = content.length;
		logger.log(`${author} previewed a response that was ${length}/${maxResponseLength} characters long.`);
		discord.send({ channel: story.currentChannel, message: responseMessage(length) });

		saveData();
		return; // End of cycle.
	}

	if (recentMessage.reactions && recentMessage.reactions.length) {
		const response = messages[1];
		if (response.author.username === me.username) {
			logger.log('Response failed: Participant attempted to submit message from Dreamers.');
			discord.send({ channel: story.currentChannel, message: submitBotMessage(story) });

			saveData();
			return; // End of cycle.
		}

		logger.log('Response confirmed!');
		const responseContent = response.content.trim(), responseLength = responseContent.length;
		if (responseLength > maxResponseLength) {
			logger.log(`${author}'s response was too long! Size ${responseLength} characters (max ${maxResponseLength}).`);
			discord.send({ channel: story.currentChannel, message: responseTooLongMessage(responseLength) });
			return; // End of cycle.
		}

		const duration = recordResponse(responseContent, story, storyFile);
		discord.send({ channel: story.currentChannel, message: confirmationMessage(duration, story) });

		selectNewAuthor(story);
	}

	saveData();
}

async function ScanStories() {
	//await DMScan(storyData.stories[0], storyFiles[0]);
	//await DMScan(storyData.stories[1], storyFiles[1]);
	await DMScan(storyData.stories[2], storyFiles[2]);
}

// Execute.
logger.log('Reading persist file.');
Object.assign(storyData, JSON.parse(fs.readFileSync(persistFile, 'utf8')));
ScanStories().then(() => setInterval(ScanStories, storyPollingInterval));
