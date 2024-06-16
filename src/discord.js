
const { headers, rateLimitInterval } = require('./config');

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
	send(msg) {
		this.messageQueue.push(msg);

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
				date: new Date(timestamp),
				text: `${global_name} (${username}): ${content}`,
			};
		}).sort((a, b) => a.date - b.date);
	}
}

module.exports = {
	Discord,
	channel: channelList,
}
