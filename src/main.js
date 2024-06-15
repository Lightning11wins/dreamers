
const { Logger } = require('utils');
const { Discord } = require('ai');

const logger = new Logger();
logger.log('Program started');

const discord = new Discord();
discord.system = 'Program started';
