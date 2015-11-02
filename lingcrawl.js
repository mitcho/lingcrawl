// lingcrawl.js
// Michael Yoshitaka Erlewine <mitcho@mitcho.com>
// Dedicated to the public domain, 2015
// http://github.com/mitcho/lingcrawl

// Usage: in bash, something like
// for i in {1..2742}; do node lingcrawl.js $i; done;

var fs = require("fs"),
	exec = require('child_process').exec,
	argv = process.argv;

const LINGBUZZ = 'http://ling.auf.net/lingbuzz',
	HEADERS = {'User-Agent': 'lingcrawl'},
	ARCHIVEPATH = './archive/';

function pad(n, digits) {
	n += '';
	return new Array(digits - n.length + 1).join('0') + n;
}
function dl(id, type) { // type = pdf | html
	id = pad(id, 6);
	var targetpath = LINGBUZZ + '/' + id;
	var archivedir = ARCHIVEPATH + id;

	if ( !fs.existsSync(archivedir) )
		fs.mkdirSync(archivedir);	
	
	if ( type == 'pdf' ) {
		targetpath += '/current.pdf';
	} 
	if ( type == 'html' ) {
		targetpath += '/index.html';
	}

	console.error('GET ' + targetpath + ' ...');

	var child = exec('wget -NP ' + archivedir + ' ' + targetpath, function(err, stdout, stderr) {
        if (err) throw err;
        else console.log(targetpath + ' downloaded to ' + archivedir);
    });
		
}

var id = argv[2];
dl(id,'html');
dl(id,'pdf');
