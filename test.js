import childProcess from 'child_process';
import test from 'ava';

test.cb('main', t => {
	const cp = childProcess.spawn('./cli.js', {stdio: 'inherit'});

	cp.on('error', t.ifError);

	cp.on('close', code => {
		t.is(code, 1);
		t.end();
	});
});

test.cb('download', t => {
	const cp = childProcess.spawn('./cli.js', ['-d', 'http://freecodecamp.libsyn.com/ep-7-the-code-im-still-ashamed-of'], {stdio: 'inherit'});

	cp.on('error', t.ifError);

	cp.on('close', code => {
		t.is(code, 0);
		t.end();
	});
});

test.cb('details', t => {
	const cp = childProcess.spawn('./cli.js', ['-p', 'http://freecodecamp.libsyn.com/which-programming-language-should-you-learn-first'], {stdio: 'inherit'});

	cp.on('error', t.ifError);

	cp.on('close', code => {
		t.is(code, 0);
		t.end();
	});
});

test.cb('notifications', t => {
	const cp = childProcess.spawn('./cli.js', ['-n'], {stdio: 'inherit'});

	cp.on('error', t.ifError);

	cp.on('close', code => {
		t.is(code, 0);
		t.end();
	});
});

test.cb('lastFivePodcasts', t => {
	const cp = childProcess.spawn('./cli.js', ['-f'], {stdio: 'inherit'});

	cp.on('error', t.ifError);

	cp.on('close', code => {
		t.is(code, 0);
		t.end();
	});
});
