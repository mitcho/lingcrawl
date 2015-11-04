// lingcrawl.js
// Michael Yoshitaka Erlewine <mitcho@mitcho.com>
// Dedicated to the public domain, 2015
// http://github.com/mitcho/lingcrawl

// Usage: in bash, something like
// for i in {1..2742}; do node lingcrawl.js $i; done;

var fs = require("fs"),
	exec = require('child_process').exec,
	cheerio = require('cheerio'),
	path = require('path');

const LINGBUZZ = 'http://ling.auf.net/lingbuzz',
	HEADERS = {'User-Agent': 'lingcrawl'},
	ARCHIVEPATH = './archive/';

function pad(n, digits) {
	n += '';
	return new Array(digits - n.length + 1).join('0') + n;
}
function dl(id, filename, cb) { // filename = current.pdf | index.html | etc. (optional ?_s=)
	id = pad(id, 6);
	var targetpath = LINGBUZZ + '/' + id + '/';
	var archivedir = ARCHIVEPATH + id + '/';
	
	if ( !fs.existsSync(archivedir) )
		fs.mkdirSync(archivedir);	

	targetpath += filename;

	// don't redownload existing files
	// todo: skip this for updated files? The issue is that lingbuzz doesn't seem to send back Last-Modified, so we can't do this intelligently.
	if ( fs.existsSync(archivedir + filename) ) {
		if ( typeof cb == 'function' )
			cb( id, filename, archivedir + filename );
		return
	}
	
	var flags = process.argv.length > 3 ? process.argv[3] : '-N';

	console.log('🐌  ' + targetpath + ' ...');

	var child = exec('wget ' + flags + ' -P ' + archivedir + ' -w 1m --random-wait ' + targetpath, function(err, stdout, stderr) {
		if (err) {
			if ( err.code == 8 ) // wget exit code 8 = server error
				console.log('🚫  ' + id + ' ' + filename);
			else
				console.log(err);
		} else {
			console.log('✅  ' + id + ' ' + filename);
			if ( typeof cb == 'function' )
				return cb( id, filename, archivedir + filename );
		}
	});
}

var id = process.argv[2];
dl(id, 'index.html', function ( id, filename, filepath ) {
	// load cheerio, the faux-jQuery
	var $ = cheerio.load(fs.readFileSync(filepath));

	var current = $('table tr:nth-child(1) > td:nth-child(2) a').attr('href');
	var currentfile = path.basename(current);
	var currentext = path.extname(current).replace(/\?.*$/,'');
	var previousList = $('table tr:nth-child(5) > td:nth-child(2) a');
	var maxrev = 0;
	previousList.each(function(i, previous){
		var link = $(previous).attr('href');
		var revfile = link.replace(/^\/lingbuzz\/(\d+)\/(v\d+\.\w+)(\?.*)?$/, '$2');
		var revnum = parseInt(revfile.replace(/^v(\d+)\.\w+$/, '$1'));
		
		dl(id, revfile);
		
		maxrev = Math.max(maxrev, revnum);
	});

	maxrev++;
	var currentfile = 'v' + maxrev + currentext;
// 	console.log('current = ' + currentfile);

	dl(id, currentfile);
});

