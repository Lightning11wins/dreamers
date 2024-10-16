
const { headers, rateLimitInterval, warnLength } = require('./config');

const channelList = {
	system: '1196575384804802661',  // DMs
	general: '1237645376782078007', // Epic Alliance # general
};
const guildID = '1237645376782078004'; // Epic Alliance
const me = {
	id: '1196573390060929034',
	username: 'evs17.',
	global_name: 'Dreamers5592',
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
function formatMessage(message) {
	return Object.assign(message, {
		// Reformatting
		timestamp: new Date(message.timestamp),
		edited_timestamp: message.edited_timestamp !== null ? new Date(message.edited_timestamp) : null,
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
function sendUnrestricted({ channel, message, reply }) {
	message = message.replaceAll('"', '\\"').replaceAll('\n', '\\n');
	const ref = reply ? `,"message_reference":{"guild_id":"${guildID}","channel_id":"${channel}","message_id":"${reply}"}` : '';
	const body = `{"content":"${message}"${ref}}`;
	const url = channelURL(channel), request = { headers, body, method: "POST" };
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
	constructor() {
		this.messageQueue = [];
		this.msgInterval = -1;
	}
	get isSending() {
		return this.messageQueue.length > 0;
	}
	// msg is 3 strings: { channel, message, reply }
	send(msg) {
		this.messageQueue.push(msg);
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

	async get(channel, messages = 10) {
		return (await new Promise((resolve, reject) => {
			fetch(`${channelURL(channel)}?limit=${messages}`, { headers, body: null, method: "GET" }).then((response) => {
				if (!response.ok) reject(response.error);
				else resolve(response.json());
			});
		})).map(formatMessage).sort((a, b) => b.time - a.time);
	}
}

// async function main() {
// 	console.log(JSON.stringify(await new Discord().get(channelList.general, 1), null, 2));
// }
// main().then()

module.exports = {
	Discord,
	channels: channelList,
	me
};
