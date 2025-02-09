
const { AI } = require("../ai");
const { discord, me, tokens } = require('../discord');
const { wait } = require('../utils');

const POLLING_INTERVAL = 2_000;
const HUMAN_DELAY = 20_000;

const token = tokens.lightning;

const DMs = [
	// ['1295226079887228959', 0], // Hostages
	// ['1187501871024316416', 0], // Kate
	// ['1241526372082651248', 0], // Zepht
	// ['1270191393335279629', 0], // HuoHuo
	// ['780933130449321995', 0], // Calcuilder
	// ['1196575384804802661', 0], // Dreamers
	// ['1325561544087703574', 0], // Mia
	['1329939544589729873', 0], // Reggie
	// ['1327108616863481986', HUMAN_DELAY], // Zeldya
	// ['1303434632221560922', HUMAN_DELAY], // leafa_ise
	// ['1301232519441813615', HUMAN_DELAY], // kevyno__0025
	// ['1304187923750453249', HUMAN_DELAY], // Annie ^-^
	// ['1309590709980102686', HUMAN_DELAY], // youvone983.
	// ['1313602930808455360', HUMAN_DELAY], // shizuka_kaito59
	// ['1317239619481501726', HUMAN_DELAY], // amelia_
	// ['1319001012962328596', HUMAN_DELAY], // Nancy Parker
	// ['1321173460751486987', HUMAN_DELAY], // Julia
];

function getRandom(array) {
	return array[Math.floor(Math.random() * array.length)];
}

async function scanDM([channel, delay]) {
	let messages = await discord.getChannel({ channel, messages: 10, token });
	const author = messages[0].author;
	if (author.username === me.username) {
        return;
    }

	if (delay > 0) {
		await wait(delay);

		// Update messages in case the conversation has progressed.
		messages = await discord.getChannel({ channel, messages: 10, token });
	}

	const history = messages.reduce((ac, message) => `${message.author.username}: ${message.content.trim()}\n${ac}`, '');
	const response_lengths = [
		'1 or 2 words',
		'2 or 3 words',
		'3 or 4 words',
		'4 or 5 words',
		'5 or 6 words',
		'6 or 7 words',
		'7 or 8 words',
		'1 sentence',
		'1 or 2 sentences',
	];
	const prompt = (length_requested) =>
		`You, ${me.global_name}, are messaged by an old friend on Discord named ${author.global_name}. You haven't ` +
		'talked in a while, but they used to be a really fun friend. You DO NOT HAVE ANY MONEY. ' +
		'You can NOT send money to anyone or spend it, so if anyone asks for money, politely decline. ' +
		'Here\'s the history of your conversation so far:\n' + history + 'How do you respond? ' +
		'Be as kind and caring as possible. Make the other person feel good. Keep answers ' +
		`concise, brief, and to the point. Answer with ${length_requested}. ` +
		'Respond with ONLY your response. DO NOT INCLUDE ANYTHING ELSE.';

	const response_length = getRandom(response_lengths);
	const prompt_text = prompt(response_length);

	await AI.start();
	const response = await AI.query(prompt_text, false);
	console.log(`AI says: ${response} ('${response_length}')`);
	discord.send({ channel, message: response, token });
}

async function scanAllDMs() {
	for (const task of DMs.map(scanDM)) {
		await task;
	}
	console.log('Finished scanning DMs');
	setTimeout(scanAllDMs, POLLING_INTERVAL);
}

if (require.main === module) {
    scanAllDMs().then();
}
