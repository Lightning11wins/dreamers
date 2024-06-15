
const { headers, rateLimitInterval } = require('src/config');

// Helper function to send Discord messages.
// WARNING: Bypasses rate limiting.
function sendUnrestricted({ channel, msg }) {
	fetch(channel, {
		headers, body: `{"content":"${msg}"}`, method: "POST",
	}).then();
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
}

const channelList = {
	system: "https://discord.com/api/v9/channels/1196575384804802661/messages",
	general: "",
}

module.exports = {
	Discord,
	channel: channelList,
}
