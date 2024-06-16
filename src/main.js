
const { Logger } = require('./utils');
const { Discord } = require('./discord');
const { ollama } = require('./ai');

const logger = new Logger();
logger.log('Program started');

const discord = new Discord();
discord.system = 'Program started';

// ollama('What pet should I get?').then(((answer) => console.log('program:', answer)));
