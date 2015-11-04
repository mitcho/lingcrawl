// lingcrawl.js
// Michael Yoshitaka Erlewine <mitcho@mitcho.com>
// Dedicated to the public domain, 2015
// http://github.com/mitcho/lingcrawl

// Usage: in bash, something like
// for i in {1..2742}; do node lingcrawl.js $i; done;

var fs = require("fs"),
	exec = require('child_process').exec;

const LINGBUZZ = 'http://ling.auf.net/lingbuzz',
	HEADERS = {'User-Agent': 'lingcrawl'},
	ARCHIVEPATH = './archive/';

function pad(n, digits) {
	n += '';
	return new Array(digits - n.length + 1).join('0') + n;
}
function dl(id, type) { // type = pdf | html
	id = pad(id, 6);
	var filename;
	var targetpath = LINGBUZZ + '/' + id;
	var archivedir = ARCHIVEPATH + id;

	if ( !fs.existsSync(archivedir) )
		fs.mkdirSync(archivedir);	
	
	if ( type == 'pdf' )
		filename = '/current.pdf';
	if ( type == 'html' )
		filename = '/index.html';
	targetpath += filename;

	// don't redownload existing files
	// todo: skip this for updated files? The issue is that lingbuzz doesn't seem to send back Last-Modified, so we can't do this intelligently.
	if ( fs.existsSync(archivedir + filename) )
		return;
	
	var flags = process.argv.length > 3 ? process.argv[3] : '-N';

	console.log('🐌  ' + targetpath + ' ...');

	var child = exec('wget ' + flags + ' -P ' + archivedir + ' -w 1m --random-wait ' + targetpath, function(err, stdout, stderr) {
		if (err) {
			if ( err.code == 8 ) // wget exit code 8 = server error
				console.log('🚫  ' + id + ' ' + type);
			else
				console.log(err);
		}
		else console.log('✅  ' + id + ' ' + type);
	});	
}

var id = process.argv[2];
dl(id,'html');
dl(id,'pdf');
