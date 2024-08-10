// Import the required modules
const fs = require('fs');
const { AI } = require('./ai');

// Define the path to the prompt file
const promptFilePath = 'prompt.txt';

// Read the prompt from the file
fs.readFile(promptFilePath, 'utf8', (err, data) => {
	if (err) {
		console.error('Error reading the file:', err);
		return;
	}

	// Use the prompt content to query the AI model
	AI.query(data)
		.then(response => {
			console.log('AI response:', response);
		})
		.catch(error => {
			console.error('Error querying the AI model:', error);
		});
});
