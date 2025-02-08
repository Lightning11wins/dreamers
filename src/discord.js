
const { rateLimitInterval, warnLength, getHeaders, tokens, defaultToken } = require('./config');
const { wait } = require('./utils');

const channelList = {
	system: '1196575384804802661',  // DMs
	general: '1237645376782078007', // Epic Alliance # general
};
const guildID = '1237645376782078004'; // Epic Alliance
const me = {
	id: '1196573390060929034',
	username: 'lightning_11', //'evs17.',
	global_name: 'Lightning', // 'Dreamers5592',
};

// Discord format examples:
/* Dreamers says 'Hello World!': {
 * 	type: 0,
 * 	channel_id: '1237645376782078007',
 * 	content: 'Hello World!',
 * 	attachments: [],
 * 	embeds: [],
 * 	timestamp: '2024-06-16T20:51:58.251000+00:00',
 * 	edited_timestamp: null,
 * 	flags: 0,
 * 	components: [],
 * 	id: '1252002756563173477',
 * 	author: {
 * 	  id: '1196573390060929034',
 * 	  username: 'evs17.',
 * 	  avatar: 'fc93aaf7b82ac1855272cf6593ab3487',
 * 	  discriminator: '0',
 * 	  public_flags: 0,
 * 	  flags: 0,
 * 	  banner: null,
 * 	  accent_color: null,
 * 	  global_name: 'Dreamers5592',
 * 	  avatar_decoration_data: null,
 * 	  banner_color: null,
 * 	  clan: null
 * 	},
 * 	mentions: [],
 * 	mention_roles: [],
 * 	pinned: false,
 * 	mention_everyone: false,
 * 	tts: false
 * }
 */
/* justalice_87 replies to wriosimp4life : {
 * 	type: 19,
 * 	channel_id: '1237645376782078007',
 * 	content: 'exactly 😭',
 * 	attachments: [],
 * 	embeds: [],
 * 	timestamp: '2024-06-16T20:01:12.796000+00:00',
 * 	edited_timestamp: null,
 * 	flags: 0,
 * 	components: [],
 * 	id: '1251989982999085146',
 * 	author: {
 * 		id: '1251589034191622329',
 * 		username: 'justalice_87',
 * 		avatar: '24cf0af668f8cdfe0ff1c044b556a734',
 * 		discriminator: '0',
 * 		public_flags: 0,
 * 		flags: 0,
 * 		banner: null,
 * 		accent_color: null,
 * 		global_name: 'Lix',
 * 		avatar_decoration_data: null,
 * 		banner_color: null,
 * 		clan: null,
 * 	},
 * 	mentions: [{
 * 		id: '1250086079529222175',
 * 		username: 'huohuo.mod',
 * 		avatar: 'da1cd3e7656bb55a11cfa87def126775',
 * 		discriminator: '0',
 * 		public_flags: 0,
 * 		flags: 0,
 * 		banner: null,
 * 		accent_color: null,
 * 		global_name: 'HuoHuo',
 * 		avatar_decoration_data: null,
 * 		banner_color: null,
 * 		clan: null,
 * 	}],
 * 	mention_roles: [],
 * 	pinned: false,
 * 	mention_everyone: false,
 * 	tts: false,
 * 	message_reference: {
 * 		type: 0,
 * 		channel_id: '1237645376782078007',
 * 		message_id: '1251977007332327455',
 * 		guild_id: '1237645376782078004'
 * 	},
 * 	position: 0,
 * 	referenced_message: { type: 19, ..., }
 * }
 */
/* wriosimp4life pings icygolemlmao: {
 * 	type: 0,
 * 	channel_id: '1237645376782078007',
 * 	content: '<@774546309700386827> meant skibidi',
 * 	attachments: [],
 * 	embeds: [],
 * 	timestamp: '2024-06-16T19:47:12.891000+00:00',
 * 	edited_timestamp: null,
 * 	flags: 0,
 * 	components: [],
 * 	id: '1251986460182319154',
 * 	author: {
 * 		id: '990346754580951120',
 * 		username: 'wriosimp4life',
 * 		avatar: '4f7551f2196a97dacb4353ab0e240f70',
 * 		discriminator: '0',
 * 		public_flags: 0,
 * 		flags: 0,
 * 		banner: null,
 * 		accent_color: null,
 * 		global_name: '#1 Wriothesley Simp',
 * 		avatar_decoration_data: null,
 * 		banner_color: null,
 * 		clan: null
 * 	},
 * 	mentions: [{
 * 		id: '774546309700386827',
 * 		username: 'icygolemlmao',
 * 		avatar: '02e1c0951b84dc173458bcc4b928098d',
 * 		discriminator: '0',
 * 		public_flags: 256,
 * 		flags: 256,
 * 		banner: null,
 * 		accent_color: null,
 * 		global_name: 'Icygolemlmao',
 * 		avatar_decoration_data: [Object],
 * 		banner_color: null,
 * 		clan: null
 * 	}],
 * 	mention_roles: [],
 * 	pinned: false,
 * 	mention_everyone: false,
 * 	tts: false
 * }
 */
/* Calling discord.getProfile(1045368074993401996) profile:
 * {
 *  user: {
 *    id: '1045368074993401996',
 *    username: 'globalcastle95',
 *    global_name: 'GlobalCastle95',
 *    avatar: '2d11d0085d786236e741552528252417',
 *    avatar_decoration_data: null,
 *    discriminator: '0',
 *    public_flags: 0,
 *    primary_guild: null,
 *    clan: null,
 *    flags: 0,
 *    banner: null,
 *    banner_color: null,
 *    accent_color: null,
 *    bio: 'heeeeello\nGenerally clueless, completely oblivious'
 *  },
 *  connected_accounts: [
 *    {
 *      type: 'spotify',
 *      id: '31szuwbizlksh5ljpyoex5vnusgi',
 *      name: 'Lorekeeper',
 *      verified: true
 *    }
 *  ],
 *  premium_since: '2024-09-30T23:08:08.033655+00:00',
 *  premium_type: 3,
 *  premium_guild_since: null,
 *  profile_themes_experiment_bucket: 4,
 *  user_profile: {
 *    bio: 'heeeeello\nGenerally clueless, completely oblivious',
 *    accent_color: null,
 *    pronouns: 'In need of sleep'
 *  },
 *  badges: [
 *    {
 *      id: 'premium',
 *      description: 'Subscriber since Sep 30, 2024',
 *      icon: '2ba85e8026a8614b640c2837bcdfe21b',
 *      link: 'https://discord.com/settings/premium'
 *    },
 *    {
 *      id: 'legacy_username',
 *      description: 'Originally known as GlobalCastle95#1992',
 *      icon: '6de6d34650760ba5551a79732e98ed60'
 *    },
 *    {
 *      id: 'quest_completed',
 *      description: 'Completed a Quest',
 *      icon: '7d9ae358c8c5e118768335dbe68b4fb8',
 *      link: 'https://discord.com/discovery/quests'
 *    }
 *  ],
 *  guild_badges: [],
 *  mutual_guilds: [
 *    { id: '1215154229010890782', nick: null },
 *    { id: '1237645376782078004', nick: null }
 *  ],
 *  legacy_username: 'GlobalCastle95#1992'
 * }
 */
function formatMessage(message) {
	return Object.assign(message, {
		// Reformatting
		timestamp: new Date(message.timestamp).getTime(), // Millis since epoch
		edited_timestamp: message.edited_timestamp === null ? null : new Date(message.edited_timestamp),
		referenced_message: message.referenced_message ? formatMessage(message.referenced_message) : undefined,

		// Convenience
		text: `${message.author.username}: ${message.content}`,
	});
}

function channelURL(channel) {
	return `https://discord.com/api/v9/channels/${channel}/messages`;
}

// Helper function to send Discord messages.
// WARNING: Bypasses rate limiting.
function sendUnrestricted({ channel, message, reply, token }) {
	message = message.replaceAll('"', '\\"').replaceAll('\n', '\\n');
	const ref = reply ? `,"message_reference":{"guild_id":"${guildID}","channel_id":"${channel}","message_id":"${reply}"}` : '';
	const body = `{"content":"${message}"${ref}}`;
	const url = channelURL(channel), request = { header: getHeaders(token), body, method: "POST" };
	fetch(url, request)
		.then(async response => {
			if (!response.ok) {
				console.error('Uh oh! url: ' + url + ', request: ' + request);
				console.error('response:', JSON.stringify(await response.json()));
				throw new Error(`HTTP error! status: ${response.status}`);
			}
		})
		.catch(error => console.error('There was a problem with the fetch operation:', error));
}

class Discord {
	// The maximum number of messages Discord allows us to request at once.
	static maxMessages = 100;
	static maxConcurrentGets = 1;
	concurrentGets = 0;
	blocked = undefined;
	waitingToGet = [];

	constructor() {
		this.messageQueue = [];
		this.msgInterval = -1;
	}
	get isSending() {
		return this.messageQueue.length > 0;
	}

	send({ channel, message, reply, token }) {
		this.messageQueue.push({ channel, message, reply, token });
		if (this.messageQueue.length > warnLength) {
			console.warn(`[Discord] Queue ${this.messageQueue.length}/${warnLength}!`);
		}

		if (this.msgInterval !== -1) return;
		sendUnrestricted(this.messageQueue.shift());
		this.msgInterval = setInterval(() => {
			if (this.messageQueue.length) {
				sendUnrestricted(this.messageQueue.shift())
			}
			if (this.messageQueue.length === 0) {
				clearInterval(this.msgInterval);
				this.msgInterval = -1;
				console.log(`[Discord] Queue drained.`);
			}
		}, rateLimitInterval);
	}

	async getChannel({ channel, messages = 10, before, token}) {
		if (messages > Discord.maxMessages) {
			throw new Error(`Requested ${messages} (max 100)`);
		}

		const json = await this.getJSON(`${channelURL(channel)}?limit=${messages}` + ((before) ? `&before=${before}` : ''), token);
		return json.map(formatMessage).sort((a, b) => b.time - a.time);
	}

	async getProfile(id, token) {
		return this.getJSON(`https://discord.com/api/v9/users/${id}/profile`, token);
	}

	async getJSON(url, token = defaultToken) {
		await this.beginConcurrentGet();

		concurrentGet:
		while (true) {
			try {
				const response = await fetch(url, { headers: getHeaders(token), body: null, method: "GET" });
				if (response.ok) {
					this.endConcurrentGet();
					return response.json();
				}

				switch (response.status) {
					case 429: // Too many requests
						const retryAfter = response.headers.get('Retry-After') ?? 0;
						console.warn(`Rate limited. Retrying after ${retryAfter}s...`);

						const timeout = wait(retryAfter * 1000);
						while (this.blocked) await this.blocked;
						await (this.blocked = timeout);
						this.blocked = undefined;

						console.log('Done waiting');
						break;
					default:
						console.error(`HTTP Error ${response.status} for ${url}`);
						const json = await response.json();
						if (json) console.log(json);
						break concurrentGet;
				}
			} catch (error) {
				const code = error.code ?? error;
				switch (code) {
					case 'ECONNRESET':
					case 'ETIMEDOUT':
						console.warn(`${error.code} when getting URL '${url}'. Retrying...`);
						break;
					default:
						console.error(`Failed to get '${url}' due to error '${code}': ${JSON.stringify(error, null, 2)}`);
						break concurrentGet;
				}
			}
		}
		this.endConcurrentGet();
		return undefined; // Give up.
	}

	async beginConcurrentGet() {
		while (this.concurrentGets >= Discord.maxConcurrentGets) {
			while (this.blocked) await this.blocked;
			await new Promise((resolve) => this.waitingToGet.push(resolve));
		}
		this.concurrentGets++;
	}

	endConcurrentGet() {
		this.concurrentGets--;
		if (this.waitingToGet.length) {
			this.waitingToGet.pop()();
		}
	}
}

async function main() {
	const messages = await new Discord().getChannel({
        channel: channelList.general,
        messages: 10,
        before: '1298330411482484847',
    });
	console.log(JSON.stringify(messages, null, 2));
	console.log(`Message count: ${messages.length}`);
}

if (require.main === module) {
	main().then();
}

module.exports = {
	Discord,
	channels: channelList,
	discord: new Discord(),
	me,
    tokens,
};
