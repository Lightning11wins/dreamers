
const { headers, rateLimitInterval, warnLength } = require('./config');

const channelList = {
	system: "https://discord.com/api/v9/channels/1196575384804802661/messages",
	general: "https://discord.com/api/v9/channels/1237645376782078007/messages",
}

// Helper function to send Discord messages.
// WARNING: Bypasses rate limiting.
function sendUnrestricted({ channel, msg }) {
	fetch(channel, { headers, body: `{"content":"${msg}"}`, method: "POST" }).then();
}

class Discord {
	constructor() {
		this.messageQueue = [];
		this.msgInterval = -1;
	}
	get isSending() {
		return this.messageQueue.length > 0;
	}
	send(msg) {
		this.messageQueue.push(msg);
		if (this.messageQueue.length > warnLength) {
			console.warn(`[Discord] Queue ${this.messageQueue.length}/${warnLength}!`);
		}

		if (this.msgInterval !== -1) return;
		this.msgInterval = setInterval(() => {
			if (this.messageQueue.length === 0) {
				clearInterval(this.msgInterval);
				this.msgInterval = -1;
			}
			else sendUnrestricted(this.messageQueue.shift());
		}, rateLimitInterval);
	}
	set system(msg) {
		this.send({ channel: channelList.system, msg });
	}
	set general(msg) {
		this.send({ channel: channelList.general, msg });
	}

	async get(channel, messages = 10) {
		return (await new Promise((resolve, reject) => {
			fetch(`${channel}?limit=${messages}`, { headers, body: null, method: "GET" }).then((response) => {
				if (!response.ok) reject(response.error);
				else resolve(response.json());
			});
		})).map((message) => {
			const { content, author: { username, global_name }, timestamp } = message;
			return {
				time: new Date(timestamp),
				handle: username,
				nickname: global_name,
				content,
				text: `${global_name} (${username}): ${content}`,
			};
		}).sort((a, b) => b.time - a.time);
	}
}

module.exports = {
	Discord,
	channel: channelList,
}
