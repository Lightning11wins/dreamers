
const axios = require('axios');

async function query(prompt) {
	try {
		const response = await axios.post('http://localhost:11434/api/generate', { model: 'llama3', prompt });
		const lines = response.data.trim().split('\n');
		return lines.map((line) => JSON.parse(line).response).join('');
	} catch (error) {
		console.error('Error:', error);
	}
}

module.exports = {
	AI: { query }
}
