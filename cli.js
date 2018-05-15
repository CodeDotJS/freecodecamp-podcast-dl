#!/usr/bin/env node

'use strict';

const dns = require('dns');
const os = require('os');
const fs = require('fs');
const http = require('follow-redirects').http;
const fse = require('fs-extra');
const got = require('got');
const cheerio = require('cheerio');
const chalk = require('chalk');
const logUpdate = require('log-update');
const ora = require('ora');
const updateNotifier = require('update-notifier');
const pkg = require('./package.json');

updateNotifier({pkg}).notify();

const arg = process.argv[2];
const inf = process.argv[3];
const spinner = ora();
const log = console.log;
const end = process.exit;
const rep = logUpdate;
const dim = chalk.dim;
const cyan = chalk.cyan;
const yellow = chalk.yellow;
const dir = `${os.homedir()}/FreeCodeCamp Podcasts/`;
const base = 'http://freecodecamp.libsyn.com/';

const makeSureDir = folder => {
	fse.ensureDir(folder, err => {
		if (err) {
			rep(err);
			end(1);
		}
	});
};

makeSureDir(dir);

const checkConnection = () => {
	dns.lookup('freecodecamp.libsyn.com', err => {
		if (err) {
			rep(`\n ${yellow('🔌')} ${dim(' Please check your Internet connection!')} \n`);
			end(1);
		} else {
			rep();
			spinner.text = ` ${chalk.blue('🚀')}  Getting ready ${yellow('🌟')} `;
			spinner.start();
			makeSureDir(dir);
		}
	});
};

const catched = () => {
	rep(`\n ${yellow('⛓')}  ${dim(' Feels like the link is broken. Sad!')} \n`);
	end(1);
};

if (!arg || arg === '-h' || arg === '--help') {
	log(`

		🎧  ${yellow('FreeCodeCamp Podcast Downloader')} 🎤


 ${chalk.redBright('🌟')}  Usage    : fpd <command> ${dim('[')}url/source${dim(']')}

 ${chalk.greenBright('💥')}  Commands :

	${cyan('⛷')}  -d, ${dim('--download')}   Download FreeCodeCamp Weekly Podcasts

	${cyan('⛹')}  -p, ${dim('--print')}      Print podcast's details

	${cyan('⏰')}  -n, ${dim('--notify')}     Check if there are new podcasts

	${cyan('⛳')}  -f, ${dim('--fetch')}      Fetch last 5 podcasts.

	${cyan('🏄')}  -h, ${dim('--help')}       Show help

 ${chalk.blueBright('⚡⚡')} Help     :

	$ fpd --download ${dim('[-d]')} ${dim('[-p]')} http://freecodecamp..com/ep-7..

		`);
	end(1);
}

const opts = () => {
	if (!inf) {
		log(`
 ${chalk.red('✖')} ${dim(`Things don't work this way. Provide a link`)}

 ${chalk.cyan('✔')} ${dim('Type')} ${chalk.magenta('$ fpd --help')} ${dim('for more help')}
 `);
		end(1);
	}
};

if (arg === '-p' || arg === '--print') {
	opts();
	checkConnection();

	got(inf).then(res => {
		const source = res.body;
		const $ = cheerio.load(source);

		rep(`

 ${cyan('🐥')}  Episode   :  ${$('.section-heading').text().split('-')[0].split('Ep.')[1].trim()}

 ${chalk.magenta('🌈')}  Title     :  ${$('.section-heading').text().split('-')[1].trim()}

 ${yellow('💨')}  Published :  ${$('p').eq(0).text()}

 ${chalk.blue('⚡⚡')} mp3 link  :  ${source.split('<meta name="twitter:player:stream" content="')[1].split('">')[0]}

		`);
		spinner.stop();
	}).catch(err => {
		if (err) {
			catched();
		}
	});
}

if (arg === '-d' || arg === '--download') {
	opts();
	checkConnection();

	got(inf).then(res => {
		const source = res.body;
		const $ = cheerio.load(source);

		const title = `Episode ${$('.section-heading').text().split('-')[0].split('Ep.')[1].trim()}`;
		const link = source.split('<meta name="twitter:player:stream" content="')[1].split('">')[0];
		const name = link.split('/')[5];

		makeSureDir(`${dir}${title}`);

		const save = fs.createWriteStream(`${dir}${title}/${name}`);

		rep();

		spinner.text = `Downloading Podcast, ${title}`;

		http.get(link, (res, cb) => {
			res.pipe(save);

			makeSureDir(`${dir}${title}`);

			save.on('finish', () => {
				rep(`\n ${yellow('⚡')}${cyan('⚡')}  Podcast Saved! \n`);
				save.close(cb);
				spinner.stop();

				save.on('error', () => {
					end(1);
				});
			});
		});
	}).catch(err => {
		if (err) {
			catched();
		}
	});
}

if (arg === '-f' || arg === '--fetch') {
	checkConnection();

	got(base).then(res => {
		const $ = cheerio.load(res.body);

		rep();

		log(chalk.green(`\n\t\t\t ${yellow('⚡⚡')} Last 5 FreeCodeCamp Podcasts ${yellow('⚡⚡')}\n`));
		const heading = $('.section-heading');

		for (let i = 0; i < heading.length; i++) {
			log('\n' + cyan(' 💥  ') + chalk.magenta($('.section-heading').eq(i).text()));
			log(yellow(' ⚡⚡') + chalk.blue(' Link  - ' + $('.libsyn-item a').eq(i).attr('href') + '\n'));
			spinner.stop();
		}
	});
}

if (arg === '-n' || arg === '--notify') {
	checkConnection();

	const saveFile = `${dir}.podcasts/podcast.txt`;

	if (!fs.existsSync(saveFile)) {
		fse.ensureFile(saveFile, err => {
			if (err) {
				end(1);
			} else {
				got(base).then(res => {
					const $ = cheerio.load(res.body);
					const fetchPodcast = $('.section-heading').eq(0).text();

					rep(`\n Run $ fpd -n next time for podcast notifications\n`);

					const buffer = Buffer.from(`${fetchPodcast}`);
					const stream = fs.createWriteStream(saveFile);

					stream.once('open', () => {
						stream.write(buffer);
						stream.end();
						spinner.stop();
					});
				});
			}
		});
	}

	if (fs.existsSync(saveFile)) {
		got(base).then(res => {
			const $ = cheerio.load(res.body);

			const posts = $('.section-heading').eq(0).text();
			const previousPost = fs.readFileSync(saveFile, 'utf-8');

			spinner.stop();

			if (posts === previousPost) {
				rep(`\n ${chalk.red('✖ ')} For now, there are no new podcasts available!\n\n ${chalk.cyan('✔')}  You should definitely check later!\n`);
			} else {
				rep(`\n ${chalk.blue('🌈 ')} Woohoo! I see some new podcasts! \n\n ${yellow('⚡⚡')} Check them on : http://freecodecamp.libsyn.com/\n`);
			}

			const buffer = Buffer.from(`${posts}`);
			const stream = fs.createWriteStream(saveFile);

			stream.once('open', () => {
				stream.write(buffer);
				stream.end();
			});
		});
	}
}
