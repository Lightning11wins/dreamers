
const { Logger } = require('./utils');
const { Discord, channel } = require('./discord');
// const { ollama } = require('./ai');

const logger = new Logger();
logger.log('Program started');

const discord = new Discord();
discord.system = 'Program started';

function annoy() {
	if (discord.isSending) return;
	discord.get(channel.general).then((data) => {
		if (data[0].handle !== 'evs17.') {
			discord.general = data[0].text;
		}
	});
}

setInterval(annoy, 5000);

// ollama('What pet should I get?').then(((answer) => console.log('program:', answer)));
