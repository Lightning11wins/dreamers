
const fs = require('fs');

const storyNames = [
	['story', 'The Unlimited Story'],
	['story_a', 'Unlimited Story 2: Story A'],
	['story_b', 'Unlimited Story 2: Story B'],
	['story_c', 'Unlimited Story 2: Story C'],
];

const navSelect = ' class="selected"';
const html = (title, responses, nav) => `
<!DOCTYPE html>
<html lang='en'>
<head>
	<meta charset='utf-8'>
	<meta name='viewport' content='width=device-width, initial-scale=1.0'>
	<title>${title}</title>
	<link rel='icon' href='./static/favicon.png' type='image/png'>
	<link rel="stylesheet" href="./styles.css">
</head>

<body>
	<nav><ul>
		<li${nav === 0 ? navSelect : ''}><a href="./story.html">Story</a></li>
		<li${nav === 1 ? navSelect : ''}><a href="./story_a.html">Story A</a></li>
		<li${nav === 2 ? navSelect : ''}><a href="./story_b.html">Story B</a></li>
		<li${nav === 3 ? navSelect : ''}><a href="./story_c.html">Story C</a></li>
	</ul></nav>
	<h1 class='title'>${title}</h1>
    <h2 class='subtitle'>${responses.length} Responses</h2>
    <article class='container'>\n\t${responses.join('\n\t')}</article>
</body>
</html>`;

let i = 0;
for (const [storyName, title] of storyNames) {
	const story = fs.readFileSync(`./story/${storyName}.txt`, 'utf8');

	const responses = story.split('\n').map((entry, lineNumber) => {
		entry = entry.trim();
		if (!entry) return '';

		const index = entry.indexOf(':');
		if (index === -1) throw new Error(`Could not find ':' on line ${lineNumber + 1} of ${storyName}.`);
		const name = entry.slice(0, index), response = entry.slice(index + 1).trim(), pfp = `./static/${name.toLowerCase()}.${name === 'Demi' ? 'gif' : 'png'}`;
		return `<div class='message'><img src='${pfp}' alt='${name}'><div class='content'><h2>${name}</h2><p>${response}</p></div></div>`;
	});

	fs.writeFileSync(`./story/results/${storyName}.html`, html(title, responses, i++));
	console.log(`Built ${title}`);
}
