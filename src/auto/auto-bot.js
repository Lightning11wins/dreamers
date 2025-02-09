
// QOL optimization for a couple of basic tasks.
// Properly handles error assessment and recovery.

const fs = require('node:fs');
const {	interactionURL, getHeaders, tokens, defaultToken } = require('../config');
const { discord, channels } = require('../discord');
const { wait, shuffleArray } = require('../utils');

const NOTIFICATION_THRESHOLD = 40;
const LIGHTNING_ID = '349274318196441088'; // System Controller
const COMMAND_CHANNEL = '1336126961524936704';

const SUMMON_COOLDOWN = 29 * 60_000;
const RETRY_ON_ERROR_DELAY = 3_000;
const INITIAL_MESSAGE_POLLING_DELAY = 1_000;
const MESSAGE_POLLING_DELAY = 5_000;
const MAX_WAIT_FOR_COOLDOWN = 120_000;

const characterNameRegex = /\*\*(.*?)\*\*/g;
const characterGameRegex = /\*(.*?)\*/g;
const emojis = {
    c: '<a:e:1342202221558763571>',
    r: '<a:e:1342202219574857788>',
    sr: '<a:e:1342202597389373530>',
    ssr: '<a:e:1342202212948115510>',
    ur: '<a:e:1342202203515125801>',
}, emojiMap = Object.entries(emojis).reduce((obj, [key, value]) => {
    obj[value] = key;
    return obj;
}, {});

// noinspection SpellCheckingInspection
const command = ({
    inventory: ['------WebKitFormBoundaryEdbCKkJbjudLV0uF\nContent-Disposition: form-data; name="payload_json"\n\n{"type":2,"application_id":"1242388858897956906","guild_id":"1209913055362818048","channel_id":"' + COMMAND_CHANNEL + '","session_id":"d4f2e74af82fe48101af43eaec658c99","data":{"version":"1320960222084337756","id":"1320960222084337755","name":"inventory","type":1}}\n------WebKitFormBoundaryEdbCKkJbjudLV0uF--', 'multipart/form-data; boundary=----WebKitFormBoundaryEdbCKkJbjudLV0uF', 'inventory'],
    packs: ['------WebKitFormBoundaryAXo2HOAesPB70ugB\nContent-Disposition: form-data; name="payload_json"\n\n{"type":2,"application_id":"1242388858897956906","guild_id":"1209913055362818048","channel_id":"' + COMMAND_CHANNEL + '","session_id":"1835ba371b5206f1eb15ef25a56a4354","data":{"version":"1320893120476352560","id":"1276865860606365696","name":"packs","type":1}}\n------WebKitFormBoundaryAXo2HOAesPB70ugB--', 'multipart/form-data; boundary=----WebKitFormBoundaryAXo2HOAesPB70ugB', 'packs'],
    daily: ['------WebKitFormBoundaryzTDJbd7ssBUAAnD7\nContent-Disposition: form-data; name="payload_json"\n\n{"type":2,"application_id":"1242388858897956906","guild_id":"1209913055362818048","channel_id":"' + COMMAND_CHANNEL + '","session_id":"d4f2e74af82fe48101af43eaec658c99","data":{"version":"1320893120476352554","id":"1295773511972950090","name":"daily","type":1}}\n------WebKitFormBoundaryzTDJbd7ssBUAAnD7--', 'multipart/form-data; boundary=----WebKitFormBoundaryzTDJbd7ssBUAAnD7', 'daily'],
    openDaily: ['------WebKitFormBoundaryKNXP7IIH51pAkXd1\nContent-Disposition: form-data; name="payload_json"\n\n{"type":2,"application_id":"1242388858897956906","guild_id":"1209913055362818048","channel_id":"' + COMMAND_CHANNEL + '","session_id":"d4f2e74af82fe48101af43eaec658c99","data":{"version":"1320893120476352556","id":"1295773511972950091","name":"open","type":1,"options":[{"type":3,"name":"pack","value":"daily"}]}}\n------WebKitFormBoundaryKNXP7IIH51pAkXd1--', 'multipart/form-data; boundary=----WebKitFormBoundaryKNXP7IIH51pAkXd1', 'openDaily'],
    summon: ['------WebKitFormBoundaryA9Xo3enec1MFlP2r\nContent-Disposition: form-data; name="payload_json"\n\n{"type":2,"application_id":"1242388858897956906","guild_id":"1209913055362818048","channel_id":"' + COMMAND_CHANNEL + '","session_id":"7e3a197b1218283366a9be252ff775b6","data":{"version":"1320893120203980849","id":"1301277778385174601","name":"summon","type":1}}\n------WebKitFormBoundaryA9Xo3enec1MFlP2r--', 'multipart/form-data; boundary=----WebKitFormBoundaryA9Xo3enec1MFlP2r', 'summon'],
});

const execute = async (command, token = defaultToken, username = undefined) => {
    if (username) {
        console.log(`Executing /${command[2]} for ${username}.`);
    }
    const response = await fetch(interactionURL, { headers: getHeaders(token, command[1]), body: command[0], method: 'POST' });
    if (response.status !== 204) {
        console.error(`Status code ${response.status} '${response.statusText}': ` + JSON.stringify(await response.json(), null, 2));
    }
    if (!response.ok) {
        throw new Error('Response was not ok.');
    }
};

const filterFunctions = [
    ({game}) => game.includes('Genshin Impact'),
    ({game}) => game.includes('Honkai Star Rail'),
    ({game}) => game.includes('Honkai Impact 3rd'),
    ({game}) => game.includes('Reverse: 1999'),
    ({emoji}) => emoji === emojis.r,
    ({game}) => game.includes('Touhou'),
    ({game}) => game.includes('Wuthering Waves'),
    ({game}) => game.includes('Zenless Zone Zero'),
    ({game}) => game.includes('Project Sekai') || game.includes('Vocaloid'),
], autonomousRules = [
    [50, ({name, game, score}) => score === 0 && game.includes('Genshin Impact') && name.includes('Nahida')],
    [49, ({name, game, score}) => score === 0 && game.includes('Genshin Impact') && name.includes('Scaramouche')],
    [48, ({name, game, score}) => score === 0 && game.includes('Genshin Impact') && name.includes('Balladeer')],
    [47, ({name, game, score}) => score === 0 && game.includes('Genshin Impact') && name.includes('Wanderer')],
    [46, ({name, game, score}) => score === 0 && game.includes('Genshin Impact') && name.includes('Kinich')],
    [30, ({name, game, score}) => score === 0 && game.includes('Genshin Impact') && name.includes('Focalors')],
    [29, ({name, game, score}) => score === 0 && game.includes('Genshin Impact') && name.includes('Furina')],
    [28, ({name, game, score}) => score === 0 && game.includes('Genshin Impact') && name.includes('Hu Tao')],
    [27, ({name, game, score}) => score === 0 && game.includes('Genshin Impact') && name.includes('Raiden')],
    [26, ({name, game, score}) => score === 0 && game.includes('Genshin Impact') && (name.includes('Mualani') || name.includes('Kokomi'))],
    [25, ({name, game, score}) => score === 0 && game.includes('Genshin Impact') && (name.includes('Klee') || name.includes('Alice'))],
    [24, ({name, game, score}) => score === 0 && game.includes('Genshin Impact') && (name.includes('Ningguang') || name.includes('Mavuika'))],
    [50, ({game}) => game.includes('Genshin Impact')],
    [46, ({game}) => game.includes('Honkai Star Rail')],
    [45, ({game}) => game.includes('Honkai Impact 3rd')],
    [44, ({game}) => game.includes('Reverse: 1999')],
    [35, ({game}) => game.includes('Touhou')],
    [20, ({name, game}) => name.includes('Verina') && game.includes('Wuthering Waves')],
    [34, ({game}) => game.includes('Wuthering Waves')],
    [33, ({game}) => game.includes('Zenless Zone Zero')],
    [32, ({game}) => game.includes('Cookie Run')],
    [31, ({game}) => game.includes('Project Sekai') ||
                     game.includes('Vocaloid') ||
                     game.includes('Devil May Cry')],
    [48, ({name}) => name.includes('Lunari')],
    [29, ({name}) => name.includes('Lightning') ||
                     name.includes('Israel') ||
                     name.includes('Mia')],
    [10, ({emoji}) => emoji === emojis.r],
    [54, ({emoji}) => emoji === emojis.sr],
    [101,({emoji}) => emoji === emojis.ssr],
    [251,({emoji}) => emoji === emojis.ur],
];

const pickCharacter = (characters) => {
    // Error checking.
    for (const { emoji, name, game } of characters) {
        if (!emoji || !name || !game) {
            console.error('Character parsing failed!');
            console.error(`\temoji='${emoji}' name='${name}' game='${game}'`);
            console.error('Characters: ' + JSON.stringify(characters));
            return -1; // No selection.
        }
    }

    // Handle SR and SSR manually.
    if (characters.filter((({emoji}) => emoji === emojis.sr || emoji === emojis.ssr)).length) {
        return -1; // SR and SSR: handle manually.
    }

    // Apply filters.
    for (const filterFunction of filterFunctions) {
        const results = characters.filter(filterFunction);
        if (results.length > 1) {
            return -1; // Filter matches multiple cards: handle manually.
        }
        if (results.length === 1) {
            return results[0].index; // Filter matches 1 card: pick that card.
        }
    }
    return 1; // If all cards are equally valuable, pick the middle.
};

let autonomousResults = '';
const pickCharacterAutonomous = (characters, log = true, username) => {
    // Error checking.
    for (const character of characters) {
        const { emoji, name, game } = character;
        if (!emoji || !name || !game) {
            console.warn('Character parsing failed!');
            console.warn(`\temoji='${emoji}' name='${name}' game='${game}'`);
            console.warn('Characters: ' + JSON.stringify(characters));
        }
        character.score = 0;
    }

    for (const [score, scoringFunction] of autonomousRules) {
        characters.filter(scoringFunction).forEach((character) => character.score += score);
    }
    const scoredCharacters = shuffleArray(characters).sort((a, b) => b.score - a.score), choice = scoredCharacters[0];

    if (log) {
        const choiceRecord = '> ' + characters.map(({ score, emoji, name, game }) =>
            `${score}`.padEnd(3, ' ') + ` ${emojiMap[emoji]} ${name} - ${game} `.padEnd(64, ' ')
        ).join('') + '\n';
        fs.appendFileSync('logs/auto-choices.txt', choiceRecord, 'utf8');

        if (choice.score > NOTIFICATION_THRESHOLD) {
            autonomousResults += `${username} found ${emojiMap[choice.emoji]} **${choice.name}** - *${choice.game}* (${choice.score})\n`;
        }
    }

    return choice.index;
};

const extractCooldown = (message) => {
    const match = message.match(/<t:(\d+):R>/);
    if (match) {
        const timestampMs = parseInt(match[1], 10) * 1000;
        return Math.max(timestampMs + 1000 - Date.now(), 1);
    }
    return undefined;
};

const clickButton = async (token, message_id, button_id) => {
    const command = `{"type":3,"guild_id":"1209913055362818048","channel_id":"${COMMAND_CHANNEL}","message_flags":0,"message_id":"${message_id}","application_id":"1242388858897956906","session_id":"fc9e72eab33f9baf1e2c4ca941cfe101","data":{"component_type":2,"custom_id":"${button_id}"}}`;
    await execute([command, 'application/json', 'click'], token);
};

const summon = async (token, username, autonomous = false) => {

    let components, firstMessage;
    do {
        await execute(command.summon, token, username); // Initial summon command.
        await wait(MESSAGE_POLLING_DELAY);

        firstMessage = (await discord.getChannel({ channel: COMMAND_CHANNEL, messages: 1, token }))[0];
        const content = firstMessage.content.trim();
        if (content === '0') {
            console.warn('Skipping summon: User request.');
            return;
        } else if (content === 'There was an error executing this command.') {
            console.warn(`Error detected, retrying after ${RETRY_ON_ERROR_DELAY / 1000} seconds...`);
            await wait(RETRY_ON_ERROR_DELAY);
        } else if (
            firstMessage.embeds &&
            firstMessage.embeds[0] &&
            firstMessage.embeds[0].description.startsWith('You can summon again')
        ) {
            const cooldown = extractCooldown(firstMessage.embeds[0].description);
            const delay = (cooldown) ? cooldown + 1_000 : RETRY_ON_ERROR_DELAY;

            if (delay > MAX_WAIT_FOR_COOLDOWN) {
                console.warn(`Skipping summon: Cooldown ${(delay / 1_000).toFixed(0)} > ${MAX_WAIT_FOR_COOLDOWN / 1_000} seconds.`);
                return;
            } else {
                console.warn(`Cooldown detected, retrying after ${(delay / 1_000).toFixed(0)} seconds...`);
                await wait(delay);
            }
        }

        components = firstMessage.components;
    } while (!components.length);

    const button_ids = components[0].components.map((component) => component.custom_id);

    let recommendation = (autonomous) ? 1 : -1;
    try {
        const characters = firstMessage
            .embeds[0]
            .description
            .trim()
            .split('\n')
            .slice(2)
            .map((characterData, index) => ({
                index,
                emoji: characterData.split(' ')[0].trim(),
                name: characterData.match(characterNameRegex)[0].trim().slice(2, -2),
                game: characterData.match(characterGameRegex)[2].trim().slice(1, -1),
            }));
        recommendation = (autonomous) ? pickCharacterAutonomous(characters, true, username) : pickCharacter(characters);
    } catch (e) {
        console.error('Error during character selection:', e);
    }

    if (recommendation !== -1) {
        await clickButton(token, firstMessage.id, button_ids[recommendation]);
        return;
    }

    let resolve;
    const promise = new Promise((r) => resolve = r);
    const poll = async () => {
        const secondMessage = (await discord.getChannel({ channel: COMMAND_CHANNEL, messages: 1, token }))[0];
        if (secondMessage.author.id !== LIGHTNING_ID) {
            setTimeout(poll, MESSAGE_POLLING_DELAY);
            return;
        }

        const choice = (secondMessage.content.trim() | 0) - 1;
        if (choice === -1) {
            console.log('Skipping summon.');
            return;
        }

        await clickButton(token, firstMessage.id, button_ids[choice]);
        resolve();
    };
    setTimeout(poll, INITIAL_MESSAGE_POLLING_DELAY);
    return promise;
};

const executeAll = async (command, delay = 1_000) => {
    for (const [username, token] of Object.entries(tokens)) {
        if (delay > 0) {
            await wait(delay);
        }
        await execute(command, token, username);
    }
};

const summonAll = async (delay = 1_000, autonomous = false) => {
    for (const [username, token] of Object.entries(tokens)) {
        if (delay > 0) {
            await wait(delay);
        }

        await summon(token, username, autonomous);
    }

    await wait(15_000);

    // Get the time until the next summon may be preformed.
    const token = Object.values(tokens)[0];
    await execute(command.summon, token);
    await wait(INITIAL_MESSAGE_POLLING_DELAY);
    const message = (await discord.getChannel({ channel: COMMAND_CHANNEL, messages: 1, token }))[0];

    return (
        message.embeds &&
        message.embeds[0] &&
        message.embeds[0].description.startsWith('You can summon again')
    ) ? extractCooldown(message.embeds[0].description) : undefined;
};

const test = ({ log = true } = {}) => {
    const testcases = [
        // Error cases.
        [
            'Strange index numbers',
            8,
            { index: 8, emoji: emojis.c, name: 'Nahida', game: 'Genshin Impact' },
            { index: 6, emoji: emojis.c, name: 'nobody', game: 'Genshin Impact' },
            { index: 4, emoji: emojis.c, name: 'nobody', game: 'Genshin Impact' },
        ],

        // Specific characters & rarities.
        [
            'Prefer Nahida',
            1,
            { index: 1, emoji: emojis.c, name: 'Nahida', game: 'Genshin Impact' },
            { index: 2, emoji: emojis.c, name: 'Scaramouche', game: 'Genshin Impact' },
            { index: 3, emoji: emojis.c, name: 'Wanderer', game: 'Genshin Impact' },
            { index: 4, emoji: emojis.c, name: 'Balladeer', game: 'Genshin Impact' },
            { index: 5, emoji: emojis.c, name: 'Kinich', game: 'Genshin Impact' },
            { index: 6, emoji: emojis.c, name: 'Focalors', game: 'Genshin Impact' },
            { index: 7, emoji: emojis.c, name: 'Furina', game: 'Genshin Impact' },
            { index: 8, emoji: emojis.c, name: 'Hu Tao', game: 'Genshin Impact' },
            { index: 9, emoji: emojis.c, name: 'Raiden', game: 'Genshin Impact' },
            { index: 10, emoji: emojis.c, name: 'Mualani', game: 'Genshin Impact' },
            { index: 11, emoji: emojis.c, name: 'Kokomi', game: 'Genshin Impact' },
            { index: 12, emoji: emojis.c, name: 'Ningguang', game: 'Genshin Impact' },
            { index: 13, emoji: emojis.c, name: 'Mavuika', game: 'Genshin Impact' },
        ],
        [
            'Prefer Scara',
            2,
            { index: 1, emoji: emojis.c, name: 'Furina', game: 'Genshin Impact' },
            { index: 2, emoji: emojis.c, name: 'Scaramouche', game: 'Genshin Impact' },
        ],
        [
            'Prefer Kinich',
            3,
            { index: 1, emoji: emojis.c, name: 'Furina', game: 'Genshin Impact' },
            { index: 2, emoji: emojis.c, name: 'Neuvillette', game: 'Genshin Impact' },
            { index: 3, emoji: emojis.c, name: 'Kinich', game: 'Genshin Impact' },
        ],
        [
            'Prefer Rare Scara over Nahida',
            2,
            { index: 1, emoji: emojis.c, name: 'Nahida', game: 'Genshin Impact' },
            { index: 2, emoji: emojis.r, name: 'Scaramouche', game: 'Genshin Impact' },
            { index: 3, emoji: emojis.c, name: 'Wanderer', game: 'Genshin Impact' },
        ],
        [
            'Prefer Rare Nahida',
            1,
            { index: 1, emoji: emojis.r, name: 'Nahida', game: 'Genshin Impact' },
            { index: 2, emoji: emojis.r, name: 'Scaramouche', game: 'Genshin Impact' },
            { index: 3, emoji: emojis.c, name: 'Wanderer', game: 'Genshin Impact' },
        ],
        [
            'Prefer SR Wanderer',
            3,
            { index: 1, emoji: emojis.r, name: 'Nahida', game: 'Genshin Impact' },
            { index: 2, emoji: emojis.r, name: 'Scaramouche', game: 'Genshin Impact' },
            { index: 3, emoji: emojis.sr, name: 'Wanderer', game: 'Genshin Impact' },
        ],
        [
            'Prefer Hu Tao',
            3,
            { index: 1, emoji: emojis.c, name: 'Raiden', game: 'Genshin Impact' },
            { index: 2, emoji: emojis.c, name: 'Mualani', game: 'Genshin Impact' },
            { index: 3, emoji: emojis.c, name: 'Hu Tao', game: 'Genshin Impact' },
        ],
        [
            'Prefer Rare Raiden over Hu Tao',
            1,
            { index: 1, emoji: emojis.r, name: 'Raiden', game: 'Genshin Impact' },
            { index: 2, emoji: emojis.c, name: 'Mualani', game: 'Genshin Impact' },
            { index: 3, emoji: emojis.c, name: 'Hu Tao', game: 'Genshin Impact' },
        ],
        [
            'Prefer SR Mauvika over Rare Nahida',
            1,
            { index: 1, emoji: emojis.sr, name: 'Raiden', game: 'Genshin Impact' },
            { index: 2, emoji: emojis.r, name: 'Nahida', game: 'Genshin Impact' },
            { index: 3, emoji: emojis.c, name: 'Hu Tao', game: 'Genshin Impact' },
        ],
        [
            'Prefer Nahida over Rare Focalors',
            1,
            { index: 1, emoji: emojis.c, name: 'Nahida', game: 'Genshin Impact' },
            { index: 2, emoji: emojis.r, name: 'Focalors', game: 'Genshin Impact' },
            { index: 3, emoji: emojis.r, name: 'Furina', game: 'Genshin Impact' },
        ],

        // Specific games & rarities.
        [
            'Prefer Genshin',
            1,
            { index: 1, emoji: emojis.c, name: 'Dori', game: 'Genshin Impact' },
            { index: 2, emoji: emojis.c, name: 'Fu Xuan', game: 'Honkai Star Rail' },
            { index: 3, emoji: emojis.c, name: 'Seele', game: 'Honkai Impact 3rd' },
            { index: 4, emoji: emojis.c, name: 'Apple', game: 'Reverse: 1999' },
            { index: 5, emoji: emojis.c, name: 'Apple Girl', game: 'Touhou' },
            { index: 6, emoji: emojis.c, name: 'Rover', game: 'Wuthering Waves' },
            { index: 7, emoji: emojis.c, name: 'Bed', game: 'Zenless Zone Zero' },
            { index: 8, emoji: emojis.c, name: 'Hatsune Miku', game: 'Project Sekai' },
        ],
        [
            'Prefer Rare HSR',
            2,
            { index: 1, emoji: emojis.c, name: 'Dori', game: 'Genshin Impact' },
            { index: 2, emoji: emojis.r, name: 'Fu Xuan', game: 'Honkai Star Rail' },
            { index: 3, emoji: emojis.r, name: 'Raiden Mei', game: 'Honkai Impact 3rd' },
        ],
        [
            'Prefer Rare HI3',
            3,
            { index: 1, emoji: emojis.c, name: 'Dori', game: 'Genshin Impact' },
            { index: 2, emoji: emojis.c, name: 'Fu Xuan', game: 'Honkai Star Rail' },
            { index: 3, emoji: emojis.r, name: 'Raiden Mei', game: 'Honkai Impact 3rd' },
        ],
        [
            'Prefer Rare Reverse',
            4,
            { index: 1, emoji: emojis.c, name: 'Dori', game: 'Genshin Impact' },
            { index: 2, emoji: emojis.c, name: 'Fu Xuan', game: 'Honkai Star Rail' },
            { index: 3, emoji: emojis.c, name: 'Raiden Mei', game: 'Honkai Impact 3rd' },
            { index: 4, emoji: emojis.r, name: 'Sonetto', game: 'Reverse: 1999' },
        ],
        [
            'Prefer HI3 to Rare Wuthering Waves',
            1,
            { index: 1, emoji: emojis.c, name: 'Raiden Mei', game: 'Honkai Impact 3rd' },
            { index: 2, emoji: emojis.r, name: 'Rover', game: 'Wuthering Waves' },
        ],
        [
            'Prefer HSR over Rare Wuthering Waves',
            1,
            { index: 1, emoji: emojis.c, name: 'Fu Xuan', game: 'Honkai Star Rail' },
            { index: 2, emoji: emojis.c, name: 'Raiden Mei', game: 'Honkai Impact 3rd' },
            { index: 3, emoji: emojis.r, name: 'Rover', game: 'Wuthering Waves' },
        ],
        [
            'Prefer Reverse over Rare Cookie Run',
            1,
            { index: 1, emoji: emojis.c, name: 'Sonetto', game: 'Reverse: 1999' },
            { index: 2, emoji: emojis.r, name: 'Cream Soda', game: 'Cookie Run: Tower of Adventures' },
        ],
        [
            'Prefer SR Cookie Run over Genshin',
            4,
            { index: 1, emoji: emojis.c, name: 'Dori', game: 'Genshin Impact' },
            { index: 2, emoji: emojis.c, name: 'Fu Xuan', game: 'Honkai Star Rail' },
            { index: 3, emoji: emojis.r, name: 'Sonetto', game: 'Reverse: 1999' },
            { index: 4, emoji: emojis.sr, name: 'Cream Soda', game: 'Cookie Run: Tower of Adventures' },
        ],
        [
            'Prefer Mia',
            2,
            { index: 1, emoji: emojis.c, name: 'Dori', game: 'Genshin Impact' },
            { index: 2, emoji: emojis.c, name: 'Mia', game: 'Honkai Star Rail' },
        ],

        // SSR rarity handling.
        [
            'Prefer SSR in most situations',
            1,
            { index: 1, emoji: emojis.ssr, name: 'Random', game: 'Who Knows' },
            { index: 2, emoji: emojis.c, name: 'Nahida', game: 'Genshin Impact' },
            { index: 3, emoji: emojis.c, name: 'Scaramouche', game: 'Genshin Impact' },
            { index: 4, emoji: emojis.c, name: 'Wanderer', game: 'Genshin Impact' },
            { index: 5, emoji: emojis.c, name: 'Balladeer', game: 'Genshin Impact' },
            { index: 6, emoji: emojis.c, name: 'Kinich', game: 'Genshin Impact' },
            { index: 7, emoji: emojis.r, name: 'Focalors', game: 'Genshin Impact' },
            { index: 8, emoji: emojis.r, name: 'Furina', game: 'Genshin Impact' },
            { index: 9, emoji: emojis.r, name: 'Hu Tao', game: 'Genshin Impact' },
            { index: 10, emoji: emojis.r, name: 'Raiden', game: 'Genshin Impact' },
            { index: 11, emoji: emojis.r, name: 'Mualani', game: 'Genshin Impact' },
            { index: 12, emoji: emojis.r, name: 'Kokomi', game: 'Genshin Impact' },
            { index: 13, emoji: emojis.r, name: 'Ningguang', game: 'Genshin Impact' },
            { index: 14, emoji: emojis.r, name: 'Mavuika', game: 'Genshin Impact' },
            { index: 15, emoji: emojis.r, name: 'Dori', game: 'Genshin Impact' },
            { index: 16, emoji: emojis.sr, name: 'Fu Xuan', game: 'Honkai Star Rail' },
            { index: 17, emoji: emojis.sr, name: 'Seele', game: 'Honkai Impact 3rd' },
            { index: 18, emoji: emojis.sr, name: 'Apple', game: 'Reverse: 1999' },
            { index: 19, emoji: emojis.sr, name: 'Apple Girl', game: 'Touhou' },
            { index: 20, emoji: emojis.sr, name: 'Rover', game: 'Wuthering Waves' },
            { index: 21, emoji: emojis.sr, name: 'Bed', game: 'Zenless Zone Zero' },
            { index: 22, emoji: emojis.sr, name: 'Hatsune Miku', game: 'Project Sekai' },
        ],
        [
            'Prefer SR Dori over SSR',
            2,
            { index: 1, emoji: emojis.ssr, name: 'Random', game: 'Who Knows' },
            { index: 2, emoji: emojis.sr, name: 'Dori', game: 'Genshin Impact' },
        ],
        [
            'Prefer SSR Mavuika over SR Nahida',
            1,
            { index: 1, emoji: emojis.ssr, name: 'Mavuika', game: 'Genshin Impact' },
            { index: 2, emoji: emojis.sr, name: 'Nahida', game: 'Genshin Impact' },
        ],
        [
            'Ignore extra characters',
            2,
            { index: 1, emoji: emojis.r, name: 'Scaramouche, Wanderer, Furina, & Klee', game: 'Genshin Impact' },
            { index: 2, emoji: emojis.r, name: 'Nahida', game: 'Genshin Impact' },
        ],

        // I sort of wish this wasn't the case.
        [
            'Prefer Vocaloid to Rare',
            1,
            { index: 1, emoji: emojis.c, name: 'Vocaloid Character', game: 'Vocaloid' },
            { index: 2, emoji: emojis.r, name: 'Rare Character', game: 'Other Game' },
            { index: 3, emoji: emojis.c, name: 'U-1146', game: 'Cells at Work!' },
        ],
    ];

    const repetitions = 8;
    let pass = 0, fail = 0;
    for (let i = 0; i < repetitions; i++) {
        for (const [testName, expect, ...characters] of testcases) {
            const choice = pickCharacterAutonomous(characters, false, 'Test');
            if (choice !== expect) {
                fail++;
                if (log) {
                    console.error(`TEST FAILED: '${testName}' expected ${expect} but got ${choice}.`);
                }
            } else {
                pass++;
                if (log) {
                    console.info(`TEST PASSED: '${testName}'`);
                }
            }
        }
    }
    pass /= repetitions;
    fail /= repetitions;

    if (log) {
        console.log();
        if (fail) {
            console.error(`FAIL: ${fail} tests failed, ${pass} tests passed.`);
        } else {
            console.info(`PASS: All ${pass} tests have passed.`);
        }
    }

    return fail === 0;
};

const main = async () => {
    console.log('Starting...');

    // Execute dailies
    await executeAll(command.daily, 2_000);
    await executeAll(command.openDaily, 2_000);

    // Execute summons
    const cooldown = await summonAll(4_000, true);

    if (autonomousResults) {
        discord.send({
            channel: channels.system,
            token: tokens.dreamers,
            message: (autonomousResults) ? autonomousResults : `Summon completed, no characters scoring over ${NOTIFICATION_THRESHOLD} were found.`
        });
        autonomousResults = '';
    }

    console.log(`Summoning completed, waiting ${(cooldown / 1000).toFixed(0)} seconds for cooldown.`);
    setTimeout(main, cooldown ?? SUMMON_COOLDOWN);

    console.log('Done');
};

if (require.main === module) {
    // Ensure that tests pass before running the code.
    if (!test({ log: false })) {
        test({ log: true });
        console.error('Start aborted: Tests failed');
        return;
    }
    console.log('Tests passed');

    // Call the main code with an optional delay.
    setTimeout(main, 0);
}
