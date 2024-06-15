
const { headers } = require('src/private');

function send(msg) {
	fetch("https://discord.com/api/v9/channels/1196575384804802661/messages", {
		headers, body: `{"content":"${msg}"}`, method: "POST",
	}).then();
}

module.exports = {
	send,
}
