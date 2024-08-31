
const { headers } = require('./config');

const members = {
	'Alice':        '1251589034191622329',
	'Alice2':       '473467759750283290',
	'Demi':         '755168894057971752',
	'Deo':          '270046680043225089',
	'DonDon':       '1259182269118021655',
	'Dreamers':     '1196573390060929034',
	'DumDum':       '1130475921992847390',
	'EVs17':        '294285529019711500',
	'HenIsHuman':   '285398826896850945',
	'Icy':          '774546309700386827',
	'Katy':         '419938556480454656',
	'Lightning':    '349274318196441088',
	'Mikasa':       '519663023984476171',
	'Timmsy':       '863157066062888960',
	'Timmsy2':      '518559262327439362',
	'TittyPopper':  '889997485114802226',
	'Tomio':        '879521406310825996',
	'Yapper':       '667879698562547744',
	'MonsterCindy': '278279716807639040',
	'Damiot':       '976723102086086686',
	'DarkInferno':  '763873033446228008',
	'HuoHuo':       '1250086079529222175',
	'WipEouT':      '185521048186388480',
	'KenRPG':       '752940180788346903',
}

async function main() {
	for (const [name, id] of Object.entries(members)) {
		// console.log('reading', name, id);
		console.log(`${name}: ${await getMessageCount(id)}`);
	}
}

async function getMessageCount(authorID) {
	const url = 'https://discord.com/api/v9/guilds/1237645376782078004/messages/search?author_id=' + authorID;
	const response = await fetch(url, {
		"headers": headers,
		"body": null,
		"method": "GET"
	});
	if (!response.ok) {
		console.error(JSON.stringify(response));
		throw new Error('Response was not ok!');
	}
	return (await response.json()).total_results | 0;
}

main().then();
